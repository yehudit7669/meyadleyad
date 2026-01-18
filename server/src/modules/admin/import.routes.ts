import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import multer from 'multer';
import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/imports/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
});

// ========================================
// CITIES & STREETS IMPORT - PREVIEW
// ========================================
router.post('/cities-streets/preview', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Pre-Validation: File format
    const ext = fileName.toLowerCase().split('.').pop();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      await fs.unlink(filePath);
      res.status(400).json({ 
        error: 'פורמט קובץ לא תקין. נדרשים קבצי XLSX או CSV בלבד.',
        validationErrors: ['INVALID_FILE_FORMAT']
      });
      return;
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // Clean up uploaded file
    await fs.unlink(filePath);

    // Pre-Validation: Check required columns
    if (rawData.length === 0) {
      res.status(400).json({ 
        error: 'הקובץ ריק',
        validationErrors: ['EMPTY_FILE']
      });
      return;
    }

    const firstRow: any = rawData[0];
    const hasRequiredColumns = ('עיר' in firstRow || 'city' in firstRow || 'cityName' in firstRow) &&
                                ('רחוב' in firstRow || 'street' in firstRow || 'streetName' in firstRow);

    if (!hasRequiredColumns) {
      res.status(400).json({ 
        error: 'חסרות עמודות חובה. נדרש: עיר, רחוב (או city, street באנגלית)',
        validationErrors: ['MISSING_REQUIRED_COLUMNS']
      });
      return;
    }

    // Process rows for preview
    const previewData: any[] = [];
    const warnings: string[] = [];
    const duplicatesInFile = new Set<string>();
    const cityStreetKeys = new Set<string>();

    for (let i = 0; i < rawData.length; i++) {
      const row: any = rawData[i];
      
      // Extract data (support both Hebrew and English column names)
      const cityName = row['עיר'] || row['city'] || row['cityName'] || '';
      const streetName = row['רחוב'] || row['street'] || row['streetName'] || '';
      const neighborhoodName = row['שכונה'] || row['neighborhood'] || row['neighborhoodName'] || '';
      const streetCode = row['קוד רחוב'] || row['code'] || row['streetCode'] || `${Date.now()}-${i}`;

      let status = 'תקין';
      let rowErrors: string[] = [];

      // Empty row check
      if (!cityName.trim() && !streetName.trim()) {
        status = 'שורה ריקה';
        rowErrors.push('שורה ריקה');
      }

      // Required fields check
      if (!cityName.trim()) {
        status = 'שגוי';
        rowErrors.push('חסר שם עיר');
      }
      if (!streetName.trim()) {
        status = 'שגוי';
        rowErrors.push('חסר שם רחוב');
      }

      // Invalid characters check
      const invalidCharsCity = cityName.match(/[<>{}[\]\\\/]/g);
      const invalidCharsStreet = streetName.match(/[<>{}[\]\\\/]/g);
      if (invalidCharsCity || invalidCharsStreet) {
        status = 'שגוי';
        rowErrors.push('תווים לא חוקיים');
      }

      // Duplicate within file
      const key = `${cityName.trim().toLowerCase()}_${streetName.trim().toLowerCase()}`;
      if (cityStreetKeys.has(key)) {
        status = 'כפול';
        rowErrors.push('כפילות בקובץ');
        duplicatesInFile.add(key);
      } else {
        cityStreetKeys.add(key);
      }

      previewData.push({
        rowNumber: i + 2, // +2 because Excel is 1-indexed and first row is headers
        city: cityName,
        street: streetName,
        neighborhood: neighborhoodName || '',
        code: streetCode,
        status,
        errors: rowErrors
      });
    }

    // Generate warnings
    if (duplicatesInFile.size > 0) {
      warnings.push(`נמצאו ${duplicatesInFile.size} כפילויות בקובץ`);
    }

    const invalidRows = previewData.filter(r => r.status === 'שגוי' || r.status === 'שורה ריקה').length;
    if (invalidRows > 0) {
      warnings.push(`${invalidRows} שורות בעייתיות`);
    }

    res.json({
      success: true,
      fileName,
      totalRows: rawData.length,
      validRows: previewData.filter(r => r.status === 'תקין').length,
      invalidRows,
      duplicates: duplicatesInFile.size,
      warnings,
      preview: previewData,
    });

  } catch (error: any) {
    console.error('Error previewing cities/streets:', error);
    
    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
    }

    res.status(500).json({ error: 'שגיאה בקריאת הקובץ' });
  }
});

// ========================================
// CITIES & STREETS IMPORT - COMMIT
// ========================================
router.post('/cities-streets/commit', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const { data, options } = req.body;

    if (!data || !Array.isArray(data)) {
      res.status(400).json({ error: 'נתונים לא תקינים' });
      return;
    }

    const { deleteExisting = false, mergeMode = true } = options || {};

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Use transaction with extended timeout for large imports
    await prisma.$transaction(async (tx) => {
      // Delete existing data if requested
      if (deleteExisting) {
        await tx.street.deleteMany({});
        await tx.neighborhood.deleteMany({});
        await tx.city.deleteMany({});
      }

      // Process each row
      for (const row of data) {
        try {
          const { city: cityName, street: streetName, neighborhood: neighborhoodName, code: streetCode } = row;

          if (!cityName || !streetName) {
            failedCount++;
            errors.push({ row, error: 'חסרים נתונים חובה' });
            continue;
          }

          // Check if city exists first
          let city = await tx.city.findUnique({
            where: { name: cityName },
          });

          if (!city) {
            // Create new city only if it doesn't exist
            const citySlug = `${cityName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            city = await tx.city.create({
              data: {
                id: `city-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: cityName,
                nameHe: cityName,
                slug: citySlug,
                updatedAt: new Date(),
              },
            });
          } else if (!mergeMode) {
            // Update existing city if not in merge mode
            city = await tx.city.update({
              where: { id: city.id },
              data: {
                nameHe: cityName,
                updatedAt: new Date(),
              },
            });
          }

          // Handle neighborhood if provided
          let neighborhood = null;
          if (neighborhoodName && neighborhoodName.trim()) {
            // Check if neighborhood exists in this city
            neighborhood = await tx.neighborhood.findFirst({
              where: {
                cityId: city.id,
                name: neighborhoodName.trim(),
              },
            });

            if (!neighborhood) {
              // Create new neighborhood
              neighborhood = await tx.neighborhood.create({
                data: {
                  id: `neighborhood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: neighborhoodName.trim(),
                  cityId: city.id,
                  updatedAt: new Date(),
                },
              });
            }
          }

          // Check if street exists (by code OR by name in the same city)
          let existingStreet = await tx.street.findUnique({
            where: {
              cityId_code: {
                cityId: city.id,
                code: streetCode,
              },
            },
          });

          // If not found by code, check by name to prevent duplicates
          if (!existingStreet) {
            existingStreet = await tx.street.findFirst({
              where: {
                cityId: city.id,
                name: streetName,
              },
            });
          }

          if (!existingStreet) {
            // Create new street only if it doesn't exist
            await tx.street.create({
              data: {
                id: `street-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: streetName,
                code: streetCode,
                cityId: city.id,
                neighborhoodId: neighborhood?.id || null,
                updatedAt: new Date(),
              },
            });
            successCount++;
          } else if (!mergeMode) {
            // Update existing street if not in merge mode
            await tx.street.update({
              where: { id: existingStreet.id },
              data: {
                name: streetName,
                code: streetCode,
                neighborhoodId: neighborhood?.id || null,
                updatedAt: new Date(),
              },
            });
            successCount++;
          } else {
            // In merge mode, skip existing streets
            successCount++;
          }
        } catch (error: any) {
          console.error('Error processing row:', row, error);
          failedCount++;
          errors.push({ row, error: error.message });
        }
      }
    }, {
      maxWait: 30000, // 30 seconds max wait
      timeout: 60000, // 60 seconds timeout
    });

    // Log import outside transaction to avoid timeout issues
    try {
      await prisma.importLog.create({
        data: {
          adminId,
          importType: 'CITIES_STREETS',
          fileName: `import-${new Date().toISOString()}`,
          totalRows: data.length,
          successRows: successCount,
          failedRows: failedCount,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (logError) {
      console.error('Error creating import log:', logError);
      // Don't fail the whole import if logging fails
    }

    res.json({
      success: true,
      totalRows: data.length,
      successRows: successCount,
      failedRows: failedCount,
      errors: errors.slice(0, 10),
    });

  } catch (error: any) {
    console.error('Error committing cities/streets:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: 'שגיאה בשמירת הנתונים',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================
// PROPERTIES IMPORT - PREVIEW
// ========================================
router.post('/properties/preview', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Pre-Validation: Only XLSX allowed for properties
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext !== 'xlsx' && ext !== 'xls') {
      await fs.unlink(filePath);
      res.status(400).json({ 
        error: 'ייבוא נכסים דורש קובץ XLSX בלבד',
        validationErrors: ['INVALID_FILE_FORMAT']
      });
      return;
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // Clean up uploaded file
    await fs.unlink(filePath);

    // Pre-Validation: Check if file is empty
    if (rawData.length === 0) {
      res.status(400).json({ 
        error: 'הקובץ ריק',
        validationErrors: ['EMPTY_FILE']
      });
      return;
    }

    // Pre-Validation: Check required columns
    const firstRow: any = rawData[0];
    const requiredColumns = ['title', 'description', 'categorySlug'];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      res.status(400).json({ 
        error: `חסרות עמודות חובה: ${missingColumns.join(', ')}`,
        validationErrors: ['MISSING_REQUIRED_COLUMNS'],
        missingColumns
      });
      return;
    }

    // Process rows for preview
    const previewData: any[] = [];
    const warnings: string[] = [];
    const duplicatesInFile = new Set<string>();
    const titleKeys = new Set<string>();

    for (let i = 0; i < rawData.length; i++) {
      const row: any = rawData[i];
      
      const title = row.title || '';
      const description = row.description || '';
      const price = row.price;
      const categorySlug = row.categorySlug || '';
      const cityName = row.cityName || row.city || '';
      const address = row.address || '';

      let status = 'תקין';
      let rowErrors: string[] = [];

      // Required fields validation
      if (!title.trim()) {
        status = 'שגוי';
        rowErrors.push('חסר כותרת');
      }
      if (!description.trim()) {
        status = 'שגוי';
        rowErrors.push('חסר תיאור');
      }
      if (!categorySlug.trim()) {
        status = 'שגוי';
        rowErrors.push('חסרה קטגוריה');
      }

      // Type validation
      if (price && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
        status = 'שגוי';
        rowErrors.push('מחיר לא תקין');
      }

      // Duplicate check (by title)
      const key = title.trim().toLowerCase();
      if (titleKeys.has(key)) {
        status = 'כפול';
        rowErrors.push('כפילות בקובץ');
        duplicatesInFile.add(key);
      } else {
        titleKeys.add(key);
      }

      previewData.push({
        rowNumber: i + 2,
        title,
        description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
        price: price ? parseFloat(price) : null,
        categorySlug,
        city: cityName,
        address,
        status,
        errors: rowErrors
      });
    }

    // Generate warnings
    if (duplicatesInFile.size > 0) {
      warnings.push(`נמצאו ${duplicatesInFile.size} כפילויות בקובץ`);
    }

    const invalidRows = previewData.filter(r => r.status === 'שגוי').length;
    if (invalidRows > 0) {
      warnings.push(`${invalidRows} שורות בעייתיות`);
    }

    res.json({
      success: true,
      fileName,
      totalRows: rawData.length,
      validRows: previewData.filter(r => r.status === 'תקין').length,
      invalidRows,
      duplicates: duplicatesInFile.size,
      warnings,
      preview: previewData,
    });

  } catch (error: any) {
    console.error('Error previewing properties:', error);
    
    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
    }

    res.status(500).json({ error: 'שגיאה בקריאת הקובץ' });
  }
});

// ========================================
// PROPERTIES IMPORT - COMMIT
// ========================================
router.post('/properties/commit', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const { data, options } = req.body;

    if (!data || !Array.isArray(data)) {
      res.status(400).json({ error: 'נתונים לא תקינים' });
      return;
    }

    const { initialStatus = 'PENDING' } = options || {}; // PENDING or DRAFT

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Use transaction
    await prisma.$transaction(async (tx) => {
      for (const row of data) {
        try {
          const { title, description, price, categorySlug, city, address, userEmail, rooms, floor, size } = row;

          if (!title || !description || !categorySlug) {
            failedCount++;
            errors.push({ row, error: 'חסרים שדות חובה' });
            continue;
          }

          // Find category
          const category = await tx.category.findUnique({
            where: { slug: categorySlug },
          });

          if (!category) {
            failedCount++;
            errors.push({ row, error: `קטגוריה לא נמצאה: ${categorySlug}` });
            continue;
          }

          // Find user (default to first admin if not provided)
          let user;
          if (userEmail) {
            user = await tx.user.findUnique({ where: { email: userEmail } });
          }
          if (!user) {
            user = await tx.user.findFirst({ where: { role: 'ADMIN' } });
          }

          if (!user) {
            failedCount++;
            errors.push({ row, error: 'משתמש לא נמצא' });
            continue;
          }

          // Find city
          let cityRecord = null;
          if (city) {
            cityRecord = await tx.city.findFirst({
              where: { name: { contains: city, mode: 'insensitive' } },
            });
          }

          // Create ad (as draft/pending - NO auto-publish)
          const customFields: any = {};
          if (rooms) customFields.rooms = rooms;
          if (floor) customFields.floor = floor;
          if (size) customFields.size = size;

          await tx.ad.create({
            data: {
              id: `ad-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              description,
              price: price ? parseFloat(price) : null,
              userId: user.id,
              categoryId: category.id,
              cityId: cityRecord?.id,
              address,
              customFields: Object.keys(customFields).length > 0 ? customFields : null,
              status: initialStatus as any, // DRAFT or PENDING
              updatedAt: new Date(),
            },
          });

          successCount++;
        } catch (error: any) {
          failedCount++;
          errors.push({ row, error: error.message });
        }
      }

      // Log import
      await tx.importLog.create({
        data: {
          adminId,
          importType: 'PROPERTIES',
          fileName: `import-${new Date().toISOString()}`,
          totalRows: data.length,
          successRows: successCount,
          failedRows: failedCount,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    });

    res.json({
      success: true,
      totalRows: data.length,
      successRows: successCount,
      failedRows: failedCount,
      errors: errors.slice(0, 10),
    });

  } catch (error: any) {
    console.error('Error committing properties:', error);
    res.status(500).json({ error: 'שגיאה בשמירת הנתונים' });
  }
});

// Get import history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const imports = await prisma.importLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    res.json(imports);
  } catch (error: any) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
