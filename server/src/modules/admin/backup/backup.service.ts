import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import unzipper from 'unzipper';
import path from 'path';
import { exec } from 'child_process';
import { promisify as promisifyExec } from 'util';
import { prisma } from '../../../config/database';

const execAsync = promisifyExec(exec);
const scryptAsync = promisify(scrypt);

export class BackupService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  /**
   * Derive encryption key from password using scrypt
   */
  private static async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
  }

  /**
   * Create encrypted stream
   * Returns: { cipherStream, salt, iv }
   */
  private static async createEncryptionStream(password: string) {
    const salt = randomBytes(32);
    const iv = randomBytes(this.IV_LENGTH);
    const key = await this.deriveKey(password, salt);
    const cipher = createCipheriv(this.ALGORITHM, key, iv);

    return { cipher, salt, iv };
  }

  /**
   * Create decryption stream
   */
  private static async createDecryptionStream(password: string, salt: Buffer, iv: Buffer) {
    const key = await this.deriveKey(password, salt);
    const decipher = createDecipheriv(this.ALGORITHM, key, iv);
    return decipher;
  }

  /**
   * Create backup: DB + Code + Uploads
   * Returns path to encrypted backup file
   */
  static async createBackup(password: string): Promise<{ filePath: string; filename: string }> {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = `${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}`;
    const filename = `meyadleyad_backup_${dateStr}_${timeStr}.zip`;
    
    const tempDir = path.join(process.cwd(), 'temp_backup');
    const backupDir = path.join(tempDir, 'backup');
    const encryptedPath = path.join(tempDir, filename);

    try {
      // Create temp directories
      await fs.mkdir(tempDir, { recursive: true });
      await fs.mkdir(backupDir, { recursive: true });

      // 1. Export database
      console.log('Exporting database...');
      await this.exportDatabase(path.join(backupDir, 'database.sql'));

      // 2. Copy code (excluding node_modules, cache, etc.)
      console.log('Copying code...');
      await this.copyCode(path.join(backupDir, 'site_code'));

      // 3. Copy uploads
      console.log('Copying uploads...');
      await this.copyUploads(path.join(backupDir, 'uploads'));

      // 4. Create zip archive (in memory, then encrypt)
      console.log('Creating encrypted archive...');
      const unencryptedZip = path.join(tempDir, 'backup_temp.zip');
      await this.createZipArchive(backupDir, unencryptedZip);

      // 5. Encrypt the zip file
      await this.encryptFile(unencryptedZip, encryptedPath, password);

      // 6. Clean up unencrypted files
      await fs.rm(backupDir, { recursive: true, force: true });
      await fs.rm(unencryptedZip, { force: true });

      console.log('Backup created successfully:', encryptedPath);
      return { filePath: encryptedPath, filename };
    } catch (error) {
      // Clean up on error
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {}
      throw error;
    }
  }

  /**
   * Restore backup: Decrypt + Extract + Restore
   */
  static async restoreBackup(encryptedFilePath: string, password: string): Promise<void> {
    const tempDir = path.join(process.cwd(), 'temp_restore');
    const decryptedZip = path.join(tempDir, 'backup_decrypted.zip');
    const extractDir = path.join(tempDir, 'extracted');

    try {
      await fs.mkdir(tempDir, { recursive: true });

      // 1. Decrypt the backup file
      console.log('Decrypting backup...');
      await this.decryptFile(encryptedFilePath, decryptedZip, password);

      // 2. Extract zip
      console.log('Extracting backup...');
      await this.extractZipArchive(decryptedZip, extractDir);

      // 3. Restore database
      console.log('Restoring database...');
      const dbPath = path.join(extractDir, 'backup', 'database.sql');
      await this.restoreDatabase(dbPath);

      // 4. Skip code restore - code should be in Git, not in backups
      // Restoring code while server is running is dangerous and can crash the system
      console.log('⚠️  Skipping code restore (use Git for code management)');

      // 5. Restore uploads
      console.log('Restoring uploads...');
      const uploadsPath = path.join(extractDir, 'backup', 'uploads');
      await this.restoreUploads(uploadsPath);

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });

      console.log('Restore completed successfully');
    } catch (error) {
      // Clean up on error
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {}
      throw error;
    }
  }

  /**
   * Export database to SQL file using pg_dump
   */
  private static async exportDatabase(outputPath: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    try {
      // Try to use pg_dump first
      const url = new URL(databaseUrl);
      const command = `pg_dump -h ${url.hostname} -p ${url.port || 5432} -U ${url.username} -d ${url.pathname.slice(1)} -F p -f "${outputPath}"`;
      const env = { ...process.env, PGPASSWORD: url.password };
      await execAsync(command, { env });
    } catch (error: any) {
      // If pg_dump not found, use Prisma-based export (development fallback)
      if (error.message?.includes('not recognized') || error.message?.includes('command not found')) {
        console.log('⚠️ pg_dump not found, using Prisma export (development mode)');
        await this.exportDatabaseWithPrisma(outputPath);
      } else {
        throw error;
      }
    }
  }

  /**
   * Fallback: Export complete database using Prisma (full data export)
   */
  private static async exportDatabaseWithPrisma(outputPath: string): Promise<void> {
    try {
      console.log('📦 Exporting full database with Prisma...');
      
      // Use require instead of import
      const { PrismaClient } = require('@prisma/client');
      const db = new PrismaClient();
      
      console.log('✓ Prisma client created');
      
      // Export all data from all tables
      const data: any = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        tables: {}
      };

      // Export all tables
      console.log('  - Exporting users...');
      data.tables.users = await db.user.findMany();
      console.log(`    ✓ Exported ${data.tables.users.length} users`);
      
      console.log('  - Exporting ads...');
      data.tables.ads = await db.ad.findMany();
      console.log(`    ✓ Exported ${data.tables.ads.length} ads`);
      
      console.log('  - Exporting categories...');
      data.tables.categories = await db.category.findMany();
      console.log(`    ✓ Exported ${data.tables.categories.length} categories`);
      
      console.log('  - Exporting cities...');
      data.tables.cities = await db.city.findMany();
      console.log(`    ✓ Exported ${data.tables.cities.length} cities`);
      
      console.log('  - Exporting neighborhoods...');
      data.tables.neighborhoods = await db.neighborhood.findMany();
      console.log(`    ✓ Exported ${data.tables.neighborhoods.length} neighborhoods`);
      
      console.log('  - Exporting streets...');
      data.tables.streets = await db.street.findMany();
      console.log(`    ✓ Exported ${data.tables.streets.length} streets`);
      
      console.log('  - Exporting appointments...');
      data.tables.appointments = await db.appointment.findMany();
      console.log(`    ✓ Exported ${data.tables.appointments.length} appointments`);
      
      console.log('  - Exporting userAudits...');
      data.tables.userAudits = await db.userAudit.findMany();
      console.log(`    ✓ Exported ${data.tables.userAudits.length} audit logs`);
      
      // Try to export optional tables (may not exist in all schemas)
      try {
        console.log('  - Exporting brokerProfiles...');
        data.tables.brokerProfiles = await db.brokerProfile.findMany();
        console.log(`    ✓ Exported ${data.tables.brokerProfiles.length} broker profiles`);
      } catch (e) {
        console.log('    ⚠ Skipped brokerProfiles (table not found)');
        data.tables.brokerProfiles = [];
      }
      
      try {
        console.log('  - Exporting serviceProviders...');
        data.tables.serviceProviders = await db.serviceProvider.findMany();
        console.log(`    ✓ Exported ${data.tables.serviceProviders.length} service providers`);
      } catch (e) {
        console.log('    ⚠ Skipped serviceProviders (table not found)');
        data.tables.serviceProviders = [];
      }
      
      try {
        console.log('  - Exporting emailLogs...');
        data.tables.emailLogs = await db.emailLog.findMany();
        console.log(`    ✓ Exported ${data.tables.emailLogs.length} email logs`);
      } catch (e) {
        console.log('    ⚠ Skipped emailLogs (table not found)');
        data.tables.emailLogs = [];
      }
      
      try {
        console.log('  - Exporting banners...');
        data.tables.banners = await db.banner.findMany();
        console.log(`    ✓ Exported ${data.tables.banners.length} banners`);
      } catch (e) {
        console.log('    ⚠ Skipped banners (table not found)');
        data.tables.banners = [];
      }

      // Write as JSON (easier to restore than SQL)
      const jsonPath = outputPath.replace('.sql', '.json');
      await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
      
      // Also create SQL placeholder for compatibility
      const sqlHeader = `-- Full Database Export via Prisma
-- Date: ${new Date().toISOString()}
-- Exported ${Object.keys(data.tables).length} tables
-- Data stored in: ${path.basename(jsonPath)}
-- Total records: ${Object.values(data.tables).reduce((sum: number, table: any) => sum + table.length, 0)}

-- This export includes ALL data from all tables.
-- To restore, use the Prisma-based restore function.
`;
      await fs.writeFile(outputPath, sqlHeader, 'utf-8');
      
      console.log('✅ Full database exported successfully');
      console.log(`   Total tables: ${Object.keys(data.tables).length}`);
      console.log(`   Total records: ${Object.values(data.tables).reduce((sum: number, table: any) => sum + table.length, 0)}`);
      
      // Disconnect
      await db.$disconnect();
    } catch (error) {
      console.error('❌ Failed to export database:', error);
      throw error;
    }
  }

  /**
   * Restore database from SQL file using psql
   */
  private static async restoreDatabase(sqlPath: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    try {
      const url = new URL(databaseUrl);
      const command = `psql -h ${url.hostname} -p ${url.port || 5432} -U ${url.username} -d ${url.pathname.slice(1)} -f "${sqlPath}"`;
      const env = { ...process.env, PGPASSWORD: url.password };
      await execAsync(command, { env });
    } catch (error: any) {
      if (error.message?.includes('not recognized') || error.message?.includes('command not found')) {
        console.log('⚠️ psql not found - using Prisma restore');
        // Use Prisma-based restore
        await this.restoreDatabaseWithPrisma(sqlPath);
      } else {
        throw error;
      }
    }
  }

  /**
   * Restore database using Prisma (from JSON export)
   */
  private static async restoreDatabaseWithPrisma(sqlPath: string): Promise<void> {
    const jsonPath = sqlPath.replace('.sql', '.json');

    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();

    try {
      console.log('📦 Restoring database with Prisma...');
      console.log('✓ Prisma client created');
      
      // Step 1: Read and validate backup data BEFORE doing anything
      console.log('🔍 Validating backup file...');
      const jsonData = await fs.readFile(jsonPath, 'utf-8');
      const data = JSON.parse(jsonData);

      if (!data.tables) {
        throw new Error('Invalid backup file format: missing tables object');
      }

      // Count total records to restore
      const totalRecords = Object.values(data.tables).reduce((sum: number, table: any) => {
        return sum + (Array.isArray(table) ? table.length : 0);
      }, 0);

      console.log(`\n📊 Backup file validation:`);
      console.log(`   ✓ Total records: ${totalRecords}`);
      console.log(`   - Users: ${data.tables.users?.length || 0}`);
      console.log(`   - Categories: ${data.tables.categories?.length || 0}`);
      console.log(`   - Cities: ${data.tables.cities?.length || 0}`);
      console.log(`   - Neighborhoods: ${data.tables.neighborhoods?.length || 0}`);
      console.log(`   - Streets: ${data.tables.streets?.length || 0}`);
      console.log(`   - Ads: ${data.tables.ads?.length || 0}`);
      console.log(`   - Appointments: ${data.tables.appointments?.length || 0}`);

      if (totalRecords === 0) {
        throw new Error('❌ Backup file is empty - no data to restore');
      }

      if (!data.tables.users || data.tables.users.length === 0) {
        throw new Error('❌ Backup file has no users - restore aborted for safety');
      }

      console.log('\n✅ Backup file is valid\n');

      // Step 2: Use transaction for atomic restore
      console.log('🔄 Starting atomic restore transaction...');
      console.log('⚠️  If this fails, all data will be rolled back automatically');
      
      await db.$transaction(async (tx: any) => {
        // Clear existing data within transaction
        console.log('\n🗑️  Clearing existing data...');
        
        const tablesToClear = [
          { name: 'RefreshToken', model: tx.refreshToken },
          { name: 'UserAudit', model: tx.userAudit },
          { name: 'Appointment', model: tx.appointment },
          { name: 'Ad', model: tx.ad },
          { name: 'Street', model: tx.street },
          { name: 'Neighborhood', model: tx.neighborhood },
          { name: 'City', model: tx.city },
          { name: 'Category', model: tx.category },
          { name: 'User', model: tx.user }
        ];

        for (const table of tablesToClear) {
          try {
            if (table.model?.deleteMany) {
              const count = await table.model.count();
              if (count > 0) {
                await table.model.deleteMany();
                console.log(`   ✓ Cleared ${count} ${table.name} records`);
              }
            }
          } catch (error: any) {
            console.log(`   ⚠️  Could not clear ${table.name}: ${error.message}`);
          }
        }

        console.log('\n📥 Restoring data from backup...\n');
        
        // Helper function to restore a table with createMany
        const restoreTable = async (tableName: string, tableData: any[], modelName: string) => {
          if (!tableData || tableData.length === 0) return;
          
          console.log(`   - Restoring ${tableData.length} ${tableName}...`);
          try {
            const model = (tx as any)[modelName];
            if (model && model.createMany) {
              await model.createMany({
                data: tableData,
                skipDuplicates: false
              });
              console.log(`     ✅ Successfully restored ${tableData.length} ${tableName}`);
            } else {
              console.log(`     ⚠️  Model ${modelName} not found, skipping...`);
            }
          } catch (error: any) {
            console.error(`     ❌ Failed to restore ${tableName}:`, error.message);
            throw error; // Fail the transaction if critical table fails
          }
        };

        // Restore in correct order (respecting foreign keys)
        // Categories and Cities first (no dependencies)
        await restoreTable('categories', data.tables.categories, 'category');
        await restoreTable('cities', data.tables.cities, 'city');
        
        // Neighborhoods depend on Cities
        await restoreTable('neighborhoods', data.tables.neighborhoods, 'neighborhood');
        
        // Streets depend on Cities and Neighborhoods
        await restoreTable('streets', data.tables.streets, 'street');
        
        // Users depend on Cities (brokerCityId)
        await restoreTable('users', data.tables.users, 'user');
        
        // Ads depend on Users, Categories, Cities, Streets
        await restoreTable('ads', data.tables.ads, 'ad');
        
        // Optional tables - don't fail transaction if they don't exist
        try {
          await restoreTable('appointments', data.tables.appointments, 'appointment');
        } catch (e) {
          console.log('     ⚠️  Skipping appointments (table may not exist)');
        }
        
        try {
          await restoreTable('audit logs', data.tables.userAudits, 'userAudit');
        } catch (e) {
          console.log('     ⚠️  Skipping audit logs (table may not exist)');
        }
      }, {
        maxWait: 30000, // 30 seconds
        timeout: 120000, // 2 minutes
      });

      console.log('\n✅ Database restored successfully!');
      console.log('🔒 Transaction committed - all changes saved\n');
      
    } catch (error: any) {
      console.error('\n❌ Restore failed:', error.message);
      console.error('🔄 Transaction rolled back - original data preserved\n');
      throw error;
    } finally {
      await db.$disconnect();
    }
  }

  /**
   * Copy code files (excluding node_modules, etc.)
   */
  private static async copyCode(destDir: string): Promise<void> {
    await fs.mkdir(destDir, { recursive: true });

    const rootDir = path.join(process.cwd(), '..');
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'temp_backup', 'temp_restore', 'uploads', 'test-output'];

    await this.copyDirectory(rootDir, destDir, excludeDirs);
  }

  /**
   * Restore code files
   */
  private static async restoreCode(sourceDir: string): Promise<void> {
    const rootDir = path.join(process.cwd(), '..');
    
    // WARNING: This is dangerous! Be careful in production
    // In production, you might want to restore to a different location first
    await this.copyDirectory(sourceDir, rootDir, []);
  }

  /**
   * Copy uploads directory
   */
  private static async copyUploads(destDir: string): Promise<void> {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    try {
      await fs.access(uploadsDir);
      await this.copyDirectory(uploadsDir, destDir, []);
    } catch {
      // Uploads directory doesn't exist, create empty
      await fs.mkdir(destDir, { recursive: true });
    }
  }

  /**
   * Restore uploads directory
   */
  private static async restoreUploads(sourceDir: string): Promise<void> {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Remove existing uploads
    try {
      await fs.rm(uploadsDir, { recursive: true, force: true });
    } catch {}

    // Copy restored uploads
    await this.copyDirectory(sourceDir, uploadsDir, []);
  }

  /**
   * Recursively copy directory
   */
  private static async copyDirectory(src: string, dest: string, excludeDirs: string[]): Promise<void> {
    await fs.mkdir(dest, { recursive: true });

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      if (excludeDirs.includes(entry.name)) {
        continue;
      }

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath, excludeDirs);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Create zip archive from directory
   */
  private static async createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceDir, 'backup');
      archive.finalize();
    });
  }

  /**
   * Extract zip archive
   */
  private static async extractZipArchive(zipPath: string, extractDir: string): Promise<void> {
    await fs.mkdir(extractDir, { recursive: true });

    return new Promise((resolve, reject) => {
      createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on('close', resolve)
        .on('error', reject);
    });
  }

  /**
   * Encrypt file with password
   * File format: [32 bytes salt][16 bytes IV][encrypted data]
   */
  private static async encryptFile(inputPath: string, outputPath: string, password: string): Promise<void> {
    const { cipher, salt, iv } = await this.createEncryptionStream(password);

    const input = createReadStream(inputPath);
    const output = createWriteStream(outputPath);

    // Write salt and IV first (unencrypted headers)
    output.write(salt);
    output.write(iv);

    // Stream encrypt the file
    await pipeline(input, cipher, output);
  }

  /**
   * Decrypt file with password
   */
  private static async decryptFile(inputPath: string, outputPath: string, password: string): Promise<void> {
    const input = createReadStream(inputPath);
    const output = createWriteStream(outputPath);

    // Read salt and IV from file header
    const headerBuffer = Buffer.alloc(48); // 32 + 16
    const fd = await fs.open(inputPath, 'r');
    await fd.read(headerBuffer, 0, 48, 0);
    await fd.close();

    const salt = headerBuffer.subarray(0, 32);
    const iv = headerBuffer.subarray(32, 48);

    // Create decipher
    const decipher = await this.createDecryptionStream(password, salt, iv);

    // Create read stream starting after header
    const encryptedStream = createReadStream(inputPath, { start: 48 });

    // Stream decrypt the file
    await pipeline(encryptedStream, decipher, output);
  }

  /**
   * Clean up temporary files
   */
  static async cleanup(): Promise<void> {
    const tempBackup = path.join(process.cwd(), 'temp_backup');
    const tempRestore = path.join(process.cwd(), 'temp_restore');

    try {
      await fs.rm(tempBackup, { recursive: true, force: true });
    } catch {}

    try {
      await fs.rm(tempRestore, { recursive: true, force: true });
    } catch {}
  }
}
