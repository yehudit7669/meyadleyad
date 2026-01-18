import { Request, Response, NextFunction } from 'express';
import { BackupService } from './backup.service';
import { AuditService } from '../../profile/audit.service';
import { promises as fs } from 'fs';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

export class BackupController {
  /**
   * POST /api/admin/backups/create
   * Create encrypted backup
   */
  static async createBackup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { password } = req.body;
      const userId = req.user!.id;
      const ip = req.ip || req.connection.remoteAddress;

      // Validation
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'נדרשת סיסמת הצפנה' 
        });
      }

      if (password.length < 12) {
        return res.status(400).json({ 
          success: false, 
          message: 'הסיסמה חייבת להכיל לפחות 12 תווים' 
        });
      }

      console.log(`[BACKUP] User ${userId} creating backup...`);

      // Create backup (encrypted)
      const { filePath, filename } = await BackupService.createBackup(password);

      // Log to audit
      await AuditService.log(userId, 'CREATE_BACKUP', { filename }, ip);

      // Send file for download
      res.download(filePath, filename, async (err) => {
        if (err) {
          console.error('Error sending backup file:', err);
        }

        // Clean up the file after sending
        try {
          await fs.unlink(filePath);
          await BackupService.cleanup();
        } catch (cleanupErr) {
          console.error('Error cleaning up backup file:', cleanupErr);
        }
      });

      console.log(`[BACKUP] Backup created successfully: ${filename}`);
    } catch (error) {
      console.error('Backup creation error:', error);
      next(error);
    }
  }

  /**
   * POST /api/admin/backups/restore
   * Restore from encrypted backup
   */
  static async restoreBackup(req: AuthRequest, res: Response, next: NextFunction) {
    let tempFilePath: string | null = null;

    try {
      const { password } = req.body;
      const userId = req.user!.id;
      const ip = req.ip || req.connection.remoteAddress;

      // Validation
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'נדרשת סיסמת הצפנה' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'נדרש קובץ גיבוי' 
        });
      }

      tempFilePath = req.file.path;

      console.log(`[RESTORE] User ${userId} restoring backup...`);
      console.log(`[RESTORE] File: ${req.file.originalname}`);

      // Restore backup
      await BackupService.restoreBackup(tempFilePath, password);

      // Log to audit
      await AuditService.log(
        userId, 
        'RESTORE_BACKUP', 
        { filename: req.file.originalname }, 
        ip
      );

      // Clean up (file might already be deleted by service)
      try {
        await fs.unlink(tempFilePath);
      } catch (err: any) {
        // Ignore if file already deleted
        if (err.code !== 'ENOENT') {
          console.error('Error deleting temp file:', err);
        }
      }
      await BackupService.cleanup();

      console.log(`[RESTORE] Restore completed successfully`);

      res.json({
        success: true,
        message: 'המערכת שוחזרה בהצלחה'
      });
    } catch (error: any) {
      console.error('Restore error:', error);

      // Clean up on error
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch {}
      }

      await BackupService.cleanup();

      // Check if it's a decryption error (wrong password)
      if (error.message?.includes('bad decrypt') || error.message?.includes('wrong final block length')) {
        return res.status(400).json({
          success: false,
          message: 'סיסמת הצפנה שגויה'
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בשחזור המערכת'
      });
    }
  }
}
