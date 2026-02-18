import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import multer from 'multer';
import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateUploadedFile } from '../../utils/fileValidation';
import { securityLogger } from '../../utils/securityLogger';
import { validateAndSaveFile } from '../../middlewares/upload';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Configure multer for file uploads (use memory storage for validation)
const upload = multer({
  storage: multer.memoryStorage(),
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

// Note: validateAndSaveFile from upload middleware handles magic bytes validation
// and file saving, so we don't need a separate validateImportFile function

// ========================================
// CITIES & STREETS IMPORT - PREVIEW
// ========================================
router.post('/cities-streets/preview', upload.single('file'), validateAndSaveFile, async (req: Request, res: Response): Promise<void> => {
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
    const createdCityIds: string[] = [];
    const createdStreetIds: string[] = [];
    const createdCities: Array<{id: string, name: string}> = [];
    const createdStreets: Array<{id: string, name: string, cityName: string}> = [];

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

          // Check if city exists - search by both name and nameHe
          let city = await tx.city.findFirst({
            where: {
              OR: [
                { name: cityName },
                { nameHe: cityName },
              ],
            },
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
            createdCityIds.push(city.id);
            createdCities.push({ id: city.id, name: cityName });
            console.log(`✅ Created new city: ${cityName} (${city.id})`);
          } else {
            console.log(`ℹ️ City already exists: ${cityName} (${city.id})`);
            if (!mergeMode) {
              // Update existing city if not in merge mode
              city = await tx.city.update({
                where: { id: city.id },
                data: {
                  nameHe: cityName,
                  updatedAt: new Date(),
                },
              });
            }
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
            const newStreet = await tx.street.create({
              data: {
                id: `street-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: streetName,
                code: streetCode,
                cityId: city.id,
                neighborhoodId: neighborhood?.id || null,
                updatedAt: new Date(),
              },
            });
            createdStreetIds.push(newStreet.id);
            createdStreets.push({ id: newStreet.id, name: streetName, cityName: city.nameHe || city.name });
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
          metadata: {
            createdCityIds,
            createdStreetIds,
            createdCities, // List of created cities with names
            createdStreets, // List of created streets with names
            importedData: data.slice(0, 100), // Save first 100 rows for preview
          },
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
router.post('/properties/preview', upload.single('file'), validateAndSaveFile, async (req: Request, res: Response): Promise<void> => {
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
    const createdAdIds: string[] = [];

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

          const newAd = await tx.ad.create({
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

          createdAdIds.push(newAd.id);
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
          importedItemIds: createdAdIds,
          metadata: {
            importedData: data.slice(0, 100), // Save first 100 rows for preview
          },
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

// ========================================
// PROPERTIES FROM FILE - PREVIEW
// ========================================
router.post('/properties-file/preview', upload.single('file'), validateAndSaveFile, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const categoryId = req.body.categoryId;
    const adType = req.body.adType || 'REGULAR'; // Get adType from request
    
    if (!categoryId) {
      await fs.unlink(req.file.path);
      res.status(400).json({ error: 'נדרש מזהה קטגוריה' });
      return;
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Validate XLSX only
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext !== 'xlsx' && ext !== 'xls') {
      await fs.unlink(filePath);
      res.status(400).json({ 
        error: 'ייבוא נכסים דורש קובץ XLSX בלבד',
        validationErrors: ['INVALID_FILE_FORMAT']
      });
      return;
    }

    // Find category
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      await fs.unlink(filePath);
      res.status(400).json({ error: 'קטגוריה לא נמצאה' });
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

    if (rawData.length === 0) {
      res.status(400).json({ 
        error: 'הקובץ ריק',
        validationErrors: ['EMPTY_FILE']
      });
      return;
    }

    // Get schema for category AND adType
    const schema = getSchemaForCategory(category.slug, adType);
    
    // Validate headers - check if any of the required fields exist (with aliases)
    const firstRow: any = rawData[0];
    const missingFields: string[] = [];
    
    for (const field of schema.fields.filter(f => f.required)) {
      const hasField = field.aliases.some(alias => alias in firstRow);
      if (!hasField) {
        missingFields.push(field.hebrewName);
      }
    }
    
    if (missingFields.length > 0) {
      res.status(400).json({ 
        error: `חסרות עמודות חובה: ${missingFields.join(', ')}`,
        validationErrors: ['MISSING_REQUIRED_COLUMNS'],
        missingFields
      });
      return;
    }

    // Process rows
    const previewData: any[] = [];
    const warnings: string[] = [];
    const duplicatesInFile = new Set<string>();
    const uniqueKeys = new Set<string>();

    for (let i = 0; i < rawData.length; i++) {
      const row: any = rawData[i];
      const rowData: any = {};
      let status = 'תקין';
      const rowErrors: string[] = [];

      // Parse each field
      for (const field of schema.fields) {
        // Try to find value using any of the field's aliases
        let value = null;
        for (const alias of field.aliases) {
          if (alias in row) {
            value = row[alias];
            break;
          }
        }
        
        try {
          rowData[field.name] = field.parser(value);
        } catch (error: any) {
          if (field.required && !value) {
            status = 'שגוי';
            rowErrors.push(`חסר ${field.hebrewName}`);
          } else if (value) {
            status = 'שגוי';
            rowErrors.push(`${field.hebrewName}: ${error.message}`);
          }
        }
      }

      // Duplicate check
      const duplicateKey = schema.getDuplicateKey(rowData);
      if (duplicateKey && uniqueKeys.has(duplicateKey)) {
        status = 'כפול';
        rowErrors.push('כפילות בקובץ');
        duplicatesInFile.add(duplicateKey);
      } else if (duplicateKey) {
        uniqueKeys.add(duplicateKey);
      }

      previewData.push({
        rowNumber: i + 2,
        ...rowData,
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
    console.error('Error previewing properties from file:', error);
    
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
    }

    res.status(500).json({ error: 'שגיאה בקריאת הקובץ' });
  }
});

// ========================================
// PROPERTIES FROM FILE - COMMIT
// ========================================
router.post('/properties-file/commit', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const { categoryId, data, options } = req.body;
    const adType = req.body.adType || 'REGULAR'; // Get adType

    if (!categoryId || !data || !Array.isArray(data)) {
      res.status(400).json({ error: 'נתונים לא תקינים' });
      return;
    }

    const { initialStatus = 'PENDING' } = options || {};
    const isWanted = adType && adType.includes('WANTED');

    // Find category
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      res.status(400).json({ error: 'קטגוריה לא נמצאה' });
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];
    const results: any[] = [];
    const createdAdIds: string[] = [];
    const createdAds: any[] = [];

    // Use transaction
    await prisma.$transaction(async (tx) => {
      for (const row of data) {
        try {
          // Find or create user (default to admin)
          let user = await tx.user.findFirst({ where: { role: 'ADMIN' } });
          if (!user) {
            user = await tx.user.findFirst({});
          }

          if (!user) {
            failedCount++;
            errors.push({ row, error: 'משתמש לא נמצא' });
            continue;
          }

          // Build custom fields (with adType)
          const customFields = buildCustomFields(row, category.slug, adType);

          // Build title (with adType)
          const title = buildTitle(row, category.slug, adType);
          
          // Build address/location (with adType)
          const address = buildAddress(row, adType);

          // For wanted ads: requestedLocationText
          const requestedLocationText = isWanted ? row.requestedLocation : null;

          // Find city if provided (for regular ads)
          let cityRecord = null;
          let streetRecord = null;
          let neighborhood = null;
          
          if (!isWanted && row.city) {
            const cityName = row.city.toString().trim();
            console.log('🔍 ADMIN: Searching for city:', cityName);
            
            cityRecord = await tx.city.findFirst({
              where: { 
                OR: [
                  { name: { equals: cityName, mode: 'insensitive' } },
                  { nameHe: { equals: cityName, mode: 'insensitive' } },
                  { name: { contains: cityName, mode: 'insensitive' } },
                  { nameHe: { contains: cityName, mode: 'insensitive' } },
                ]
              },
            });
            console.log('🏙️ ADMIN: City found:', cityRecord ? `${cityRecord.nameHe} (ID: ${cityRecord.id})` : 'NOT FOUND');
            
            // Get neighborhood from row data (required field)
            if (row.neighborhood) {
              neighborhood = row.neighborhood.toString().trim();
              console.log('🏘️ ADMIN: Neighborhood from file:', neighborhood);
            }
            
            // Find street if city found and street provided
            if (cityRecord && row.street) {
              const streetName = row.street.toString().trim();
              console.log('🔍 ADMIN: Searching for street:', streetName, 'in city:', cityRecord.nameHe);
              
              streetRecord = await tx.street.findFirst({
                where: {
                  OR: [
                    { name: { equals: streetName, mode: 'insensitive' } },
                    { name: { contains: streetName, mode: 'insensitive' } },
                  ],
                  cityId: cityRecord.id,
                },
                include: {
                  Neighborhood: true,
                },
              });
              console.log('🛣️ ADMIN: Street found:', streetRecord ? `${streetRecord.name} (ID: ${streetRecord.id})` : 'NOT FOUND');
              
              // If street has neighborhood and we don't have one from file, use street's neighborhood
              if (!neighborhood && streetRecord?.Neighborhood) {
                neighborhood = streetRecord.Neighborhood.name;
                console.log('🏘️ ADMIN: Neighborhood from street:', neighborhood);
              }
            }
          }

          // Create ad
          const newAd = await tx.ad.create({
            data: {
              id: `ad-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              description: row.description || row.contactName || 'נכס מיובא',
              price: row.price ? parseFloat(row.price.toString()) : null,
              userId: user.id,
              categoryId: category.id,
              cityId: cityRecord?.id,
              streetId: streetRecord?.id,
              neighborhood: neighborhood,
              address,
              requestedLocationText,
              isWanted,
              adType,
              customFields,
              status: initialStatus as any,
              updatedAt: new Date(),
            },
          });

          createdAdIds.push(newAd.id);
          createdAds.push(newAd);
          successCount++;
          results.push({
            rowIndex: row.rowNumber,
            status: 'success',
            id: newAd.id,
          });
        } catch (error: any) {
          failedCount++;
          errors.push({ 
            rowIndex: row.rowNumber, 
            error: error.message 
          });
          results.push({
            rowIndex: row.rowNumber,
            status: 'failed',
            errors: [error.message],
          });
        }
      }

      // Log import
      await tx.importLog.create({
        data: {
          adminId,
          importType: 'PROPERTIES_FILE',
          fileName: `import-properties-${adType}-${new Date().toISOString()}`,
          totalRows: data.length,
          successRows: successCount,
          failedRows: failedCount,
          errors: errors.length > 0 ? errors : undefined,
          importedItemIds: createdAdIds,
          metadata: {
            importedData: data.slice(0, 100), // Save first 100 rows for preview
          },
        },
      });
    });

    res.json({
      success: true,
      totalRows: data.length,
      successRows: successCount,
      failedRows: failedCount,
      results,
      errors: errors.slice(0, 10),
      createdAds: createdAds,
    });

  } catch (error: any) {
    console.error('Error committing properties from file:', error);
    res.status(500).json({ error: 'שגיאה בשמירת הנתונים' });
  }
});

// ========================================
// HELPER TYPES & INTERFACES
// ========================================
interface FieldSchema {
  name: string;
  hebrewName: string;
  aliases: string[];
  required: boolean;
  parser: (value: any) => any;
}

interface CategorySchema {
  fields: FieldSchema[];
  getDuplicateKey: (row: any) => string | null;
}

// ========================================
// SCHEMA DEFINITIONS
// ========================================
function getSchemaForCategory(categorySlug: string, adType?: string): CategorySchema {
  // Determine which schema to use based on category AND adType
  const slug = categorySlug.toLowerCase();
  const type = adType?.toUpperCase() || '';
  
  // SHARED OWNERSHIP (TABU)
  if (slug.includes('shared') || slug.includes('tabu') || slug.includes('טאבו')) {
    if (type.includes('WANTED')) {
      return getWantedSharedOwnershipSchema();
    }
    return getSharedOwnershipSchema();
  }
  
  // APARTMENTS FOR SALE
  if (slug.includes('sale') || slug.includes('למכירה')) {
    if (type.includes('WANTED')) {
      return getWantedForSaleSchema();
    }
    return getApartmentsForSaleSchema();
  }
  
  // APARTMENTS FOR RENT
  if (slug.includes('rent') || slug.includes('להשכרה')) {
    if (type.includes('WANTED')) {
      return getWantedForRentSchema();
    }
    return getApartmentsForRentSchema();
  }
  
  // HOUSING UNITS - Same as apartments for rent
  if (slug.includes('housing') || slug.includes('יחידות דיור')) {
    if (type.includes('WANTED')) {
      return getWantedForRentSchema();
    }
    return getApartmentsForRentSchema();
  }
  
  // SHABBAT APARTMENTS
  if (slug.includes('shabbat') || slug.includes('שבת') || slug.includes('holiday')) {
    if (type.includes('WANTED')) {
      return getWantedForShabbatSchema();
    }
    return getShabbatApartmentSchema();
  }
  
  // COMMERCIAL REAL ESTATE
  if (slug.includes('commercial') || slug.includes('מסחרי')) {
    if (type.includes('WANTED')) {
      return getWantedCommercialSchema();
    }
    return getCommercialSchema();
  }
  
  // Fallback
  return getBasicSchema();
}

// ===== REGULAR APARTMENTS FOR SALE =====
function getApartmentsForSaleSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'hasBroker', hebrewName: 'תיווך', aliases: ['תיווך'], required: true, parser: requiredBoolean },
    { name: 'city', hebrewName: 'עיר', aliases: ['עיר'], required: true, parser: requiredString },
    { name: 'street', hebrewName: 'רחוב', aliases: ['רחוב'], required: false, parser: optionalString },
    { name: 'neighborhood', hebrewName: 'שכונה', aliases: ['שכונה'], required: true, parser: requiredString },
    { name: 'houseNumber', hebrewName: 'מספר בית', aliases: ['מספר בית'], required: false, parser: optionalString },
    { name: 'addressSupplement', hebrewName: 'תוספת כתובת', aliases: ['תוספת כתובת', 'דירה', 'כניסה'], required: false, parser: optionalString },
    { name: 'propertyType', hebrewName: 'סוג הנכס', aliases: ['סוג הנכס'], required: true, parser: parsePropertyType },
    { name: 'rooms', hebrewName: 'מספר חדרים', aliases: ['מספר חדרים'], required: true, parser: parseRoomsRequired },
    { name: 'squareMeters', hebrewName: 'שטח במר', aliases: ['שטח במר', 'שטח'], required: false, parser: parseOptionalNumberWithDecimals },
    { name: 'condition', hebrewName: 'מצב הנכס', aliases: ['מצב הנכס'], required: false, parser: optionalString },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptionalOrText },
    { name: 'balconies', hebrewName: 'מספר מרפסות', aliases: ['מספר מרפסות'], required: false, parser: parseOptionalInt },
    { name: 'furniture', hebrewName: 'ריהוט', aliases: ['ריהוט'], required: false, parser: parseFurnitureOptional },
    { name: 'entryDate', hebrewName: 'תאריך כניסה', aliases: ['תאריך כניסה'], required: false, parser: parseEntryDateOptional },
    { name: 'price', hebrewName: 'מחיר', aliases: ['מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'arnona', hebrewName: 'ארנונה', aliases: ['ארנונה'], required: false, parser: parseOptionalNumber },
    { name: 'vaad', hebrewName: 'ועד בית', aliases: ['ועד בית'], required: false, parser: parseOptionalNumber },
    { name: 'parking', hebrewName: 'חניה', aliases: ['חניה'], required: false, parser: normalizeBoolean },
    { name: 'storage', hebrewName: 'מחסן', aliases: ['מחסן'], required: false, parser: normalizeBoolean },
    { name: 'safeRoom', hebrewName: 'ממד', aliases: ['ממד'], required: false, parser: normalizeBoolean },
    { name: 'sukkaBalcony', hebrewName: 'מרפסת סוכה', aliases: ['מרפסת סוכה'], required: false, parser: normalizeBoolean },
    { name: 'elevator', hebrewName: 'מעלית', aliases: ['מעלית'], required: false, parser: normalizeBoolean },
    { name: 'view', hebrewName: 'נוף', aliases: ['נוף'], required: false, parser: normalizeBoolean },
    { name: 'parentalUnit', hebrewName: 'יחידת הורים', aliases: ['יחידת הורים'], required: false, parser: normalizeBoolean },
    { name: 'housingUnit', hebrewName: 'יחידת דיור', aliases: ['יחידת דיור'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'garden', hebrewName: 'גינה', aliases: ['גינה'], required: false, parser: normalizeBoolean },
    { name: 'frontFacing', hebrewName: 'חזית', aliases: ['חזית'], required: false, parser: normalizeBoolean },
    { name: 'upgradedKitchen', hebrewName: 'מטבח משודרג', aliases: ['מטבח משודרג'], required: false, parser: normalizeBoolean },
    { name: 'accessibleForDisabled', hebrewName: 'נגישה לנכים', aliases: ['נגישה לנכים'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'hasOption', hebrewName: 'אופציה', aliases: ['אופציה'], required: false, parser: normalizeBoolean },
    { name: 'description', hebrewName: 'תיאור הנכס', aliases: ['תיאור הנכס'], required: false, parser: requiredString },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
    { name: 'image1', hebrewName: 'תמונה 1', aliases: ['תמונה 1'], required: false, parser: parseUrl },
    { name: 'image2', hebrewName: 'תמונה 2', aliases: ['תמונה 2'], required: false, parser: parseUrl },
    { name: 'image3', hebrewName: 'תמונה 3', aliases: ['תמונה 3'], required: false, parser: parseUrl },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => row.city && row.street && row.houseNumber ?
      `${row.city}-${row.street}-${row.houseNumber}`.toLowerCase() : null
  };
}

// ===== REGULAR APARTMENTS FOR RENT =====
function getApartmentsForRentSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'hasBroker', hebrewName: 'תיווך', aliases: ['תיווך'], required: true, parser: requiredBoolean },
    { name: 'city', hebrewName: 'עיר', aliases: ['עיר'], required: true, parser: requiredString },
    { name: 'street', hebrewName: 'רחוב', aliases: ['רחוב'], required: false, parser: optionalString },
    { name: 'neighborhood', hebrewName: 'שכונה', aliases: ['שכונה'], required: true, parser: requiredString },
    { name: 'houseNumber', hebrewName: 'מספר בית', aliases: ['מספר בית'], required: false, parser: optionalString },
    { name: 'addressSupplement', hebrewName: 'תוספת כתובת', aliases: ['תוספת כתובת', 'דירה', 'כניסה'], required: false, parser: optionalString },
    { name: 'propertyType', hebrewName: 'סוג הנכץ', aliases: ['סוג הנכס'], required: true, parser: parsePropertyType },
    { name: 'rooms', hebrewName: 'מספר חדרים', aliases: ['מספר חדרים'], required: true, parser: parseRoomsRequired },
    { name: 'squareMeters', hebrewName: 'שטח במר', aliases: ['שטח במר', 'שטח'], required: false, parser: parseOptionalNumberWithDecimals },
    { name: 'condition', hebrewName: 'מצב הנכס', aliases: ['מצב הנכס'], required: false, parser: optionalString },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptionalOrText },
    { name: 'balconies', hebrewName: 'מספר מרפסות', aliases: ['מספר מרפסות'], required: false, parser: parseOptionalInt },
    { name: 'furniture', hebrewName: 'ריהוט', aliases: ['ריהוט'], required: false, parser: parseFurnitureOptional },
    { name: 'entryDate', hebrewName: 'תאריך כניסה', aliases: ['תאריך כניסה'], required: false, parser: parseEntryDateOptional },
    { name: 'price', hebrewName: 'מחיר', aliases: ['מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'arnona', hebrewName: 'ארנונה', aliases: ['ארנונה'], required: false, parser: parseOptionalNumber },
    { name: 'vaad', hebrewName: 'ועד בית', aliases: ['ועד בית'], required: false, parser: parseOptionalNumber },
    { name: 'parking', hebrewName: 'חניה', aliases: ['חניה'], required: false, parser: normalizeBoolean },
    { name: 'storage', hebrewName: 'מחסן', aliases: ['מחסן'], required: false, parser: normalizeBoolean },
    { name: 'safeRoom', hebrewName: 'ממד', aliases: ['ממד'], required: false, parser: normalizeBoolean },
    { name: 'sukkaBalcony', hebrewName: 'מרפסת סוכה', aliases: ['מרפסת סוכה'], required: false, parser: normalizeBoolean },
    { name: 'elevator', hebrewName: 'מעלית', aliases: ['מעלית'], required: false, parser: normalizeBoolean },
    { name: 'view', hebrewName: 'נוף', aliases: ['נוף'], required: false, parser: normalizeBoolean },
    { name: 'parentalUnit', hebrewName: 'יחידת הורים', aliases: ['יחידת הורים'], required: false, parser: normalizeBoolean },
    { name: 'housingUnit', hebrewName: 'יחידת דיור', aliases: ['יחידת דיור'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'garden', hebrewName: 'גינה', aliases: ['גינה'], required: false, parser: normalizeBoolean },
    { name: 'frontFacing', hebrewName: 'חזית', aliases: ['חזית'], required: false, parser: normalizeBoolean },
    { name: 'upgradedKitchen', hebrewName: 'מטבח משודרג', aliases: ['מטבח משודרג'], required: false, parser: normalizeBoolean },
    { name: 'accessibleForDisabled', hebrewName: 'נגישה לנכים', aliases: ['נגישה לנכים'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'description', hebrewName: 'תיאור הנכס', aliases: ['תיאור הנכס'], required: false, parser: requiredString },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
    { name: 'image1', hebrewName: 'תמונה 1', aliases: ['תמונה 1'], required: false, parser: parseUrl },
    { name: 'image2', hebrewName: 'תמונה 2', aliases: ['תמונה 2'], required: false, parser: parseUrl },
    { name: 'image3', hebrewName: 'תמונה 3', aliases: ['תמונה 3'], required: false, parser: parseUrl },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => row.city && row.street && row.houseNumber ?
      `${row.city}-${row.street}-${row.houseNumber}`.toLowerCase() : null
  };
}

// ===== WANTED FOR SALE (דרושים - לקניה) =====
function getWantedForSaleSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'hasBroker', hebrewName: 'תיווך', aliases: ['תיווך'], required: true, parser: requiredBoolean },
    { name: 'desiredStreet', hebrewName: 'רחוב / אזור מבוקש', aliases: ['רחוב / אזור מבוקש', 'רחוב מבוקש'], required: true, parser: requiredString },
    { name: 'propertyType', hebrewName: 'סוג הנכס', aliases: ['סוג הנכס'], required: true, parser: requiredString },
    { name: 'rooms', hebrewName: 'מספר חדרים', aliases: ['מספר חדרים'], required: true, parser: parseRoomsRequired },
    { name: 'squareMeters', hebrewName: 'שטח במר', aliases: ['שטח במר', 'שטח'], required: false, parser: parseOptionalNumber },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptional },
    { name: 'balconies', hebrewName: 'מרפסות', aliases: ['מרפסות'], required: false, parser: parseOptionalInt },
    { name: 'condition', hebrewName: 'מצב הנכס', aliases: ['מצב הנכס'], required: false, parser: optionalString },
    { name: 'furniture', hebrewName: 'ריהוט', aliases: ['ריהוט'], required: false, parser: parseFurnitureOptional },
    { name: 'price', hebrewName: 'מחיר', aliases: ['מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'arnona', hebrewName: 'ארנונה', aliases: ['ארנונה'], required: false, parser: parseOptionalNumber },
    { name: 'vaad', hebrewName: 'ועד בית', aliases: ['ועד בית'], required: false, parser: parseOptionalNumber },
    { name: 'entryDate', hebrewName: 'תאריך כניסה', aliases: ['תאריך כניסה'], required: false, parser: parseDateOptional },
    { name: 'parking', hebrewName: 'חניה', aliases: ['חניה'], required: false, parser: normalizeBoolean },
    { name: 'storage', hebrewName: 'מחסן', aliases: ['מחסן'], required: false, parser: normalizeBoolean },
    { name: 'view', hebrewName: 'נוף', aliases: ['נוף'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'sukkaBalcony', hebrewName: 'מרפסת סוכה', aliases: ['מרפסת סוכה'], required: false, parser: normalizeBoolean },
    { name: 'parentalUnit', hebrewName: 'יחידת הורים', aliases: ['יחידת הורים'], required: false, parser: normalizeBoolean },
    { name: 'safeRoom', hebrewName: 'ממד', aliases: ['ממד'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'housingUnit', hebrewName: 'יחידת דיור', aliases: ['יחידת דיור'], required: false, parser: normalizeBoolean },
    { name: 'elevator', hebrewName: 'מעלית', aliases: ['מעלית'], required: false, parser: normalizeBoolean },
    { name: 'hasOption', hebrewName: 'אופציה', aliases: ['אופציה'], required: false, parser: normalizeBoolean },
    { name: 'garden', hebrewName: 'גינה', aliases: ['גינה'], required: false, parser: normalizeBoolean },
    { name: 'frontFacing', hebrewName: 'חזית', aliases: ['חזית'], required: false, parser: normalizeBoolean },
    { name: 'upgradedKitchen', hebrewName: 'מטבח משודרג', aliases: ['מטבח משודרג'], required: false, parser: normalizeBoolean },
    { name: 'accessibleForDisabled', hebrewName: 'נגישה לנכים', aliases: ['נגישה לנכים'], required: false, parser: normalizeBoolean },
    { name: 'description', hebrewName: 'תיאור', aliases: ['תיאור'], required: false, parser: optionalString },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => null // No duplicate check for wanted ads
  };
}

// ===== WANTED FOR RENT (דרושים - להשכרה) =====
function getWantedForRentSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'hasBroker', hebrewName: 'תיווך', aliases: ['תיווך'], required: true, parser: requiredBoolean },
    { name: 'desiredStreet', hebrewName: 'רחוב / אזור מבוקש', aliases: ['רחוב / אזור מבוקש', 'רחוב מבוקש'], required: true, parser: requiredString },
    { name: 'propertyType', hebrewName: 'סוג הנכס', aliases: ['סוג הנכס'], required: true, parser: requiredString },
    { name: 'rooms', hebrewName: 'מספר חדרים', aliases: ['מספר חדרים'], required: true, parser: parseRoomsRequired },
    { name: 'squareMeters', hebrewName: 'שטח במר', aliases: ['שטח במר', 'שטח'], required: false, parser: parseOptionalNumber },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptional },
    { name: 'balconies', hebrewName: 'מרפסות', aliases: ['מרפסות'], required: false, parser: parseOptionalInt },
    { name: 'condition', hebrewName: 'מצב הנכס', aliases: ['מצב הנכס'], required: false, parser: optionalString },
    { name: 'furniture', hebrewName: 'ריהוט', aliases: ['ריהוט'], required: false, parser: parseFurnitureOptional },
    { name: 'price', hebrewName: 'מחיר', aliases: ['מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'arnona', hebrewName: 'ארנונה', aliases: ['ארנונה'], required: false, parser: parseOptionalNumber },
    { name: 'vaad', hebrewName: 'ועד בית', aliases: ['ועד בית'], required: false, parser: parseOptionalNumber },
    { name: 'entryDate', hebrewName: 'תאריך כניסה', aliases: ['תאריך כניסה'], required: false, parser: parseDateOptional },
    { name: 'parking', hebrewName: 'חניה', aliases: ['חניה'], required: false, parser: normalizeBoolean },
    { name: 'storage', hebrewName: 'מחסן', aliases: ['מחסן'], required: false, parser: normalizeBoolean },
    { name: 'view', hebrewName: 'נוף', aliases: ['נוף'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'sukkaBalcony', hebrewName: 'מרפסת סוכה', aliases: ['מרפסת סוכה'], required: false, parser: normalizeBoolean },
    { name: 'parentalUnit', hebrewName: 'יחידת הורים', aliases: ['יחידת הורים'], required: false, parser: normalizeBoolean },
    { name: 'safeRoom', hebrewName: 'ממד', aliases: ['ממד'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'housingUnit', hebrewName: 'יחידת דיור', aliases: ['יחידת דיור'], required: false, parser: normalizeBoolean },
    { name: 'elevator', hebrewName: 'מעלית', aliases: ['מעלית'], required: false, parser: normalizeBoolean },
    { name: 'hasOption', hebrewName: 'אופציה', aliases: ['אופציה'], required: false, parser: normalizeBoolean },
    { name: 'garden', hebrewName: 'גינה', aliases: ['גינה'], required: false, parser: normalizeBoolean },
    { name: 'frontFacing', hebrewName: 'חזית', aliases: ['חזית'], required: false, parser: normalizeBoolean },
    { name: 'upgradedKitchen', hebrewName: 'מטבח משודרג', aliases: ['מטבח משודרג'], required: false, parser: normalizeBoolean },
    { name: 'accessibleForDisabled', hebrewName: 'נגישה לנכים', aliases: ['נגישה לנכים'], required: false, parser: normalizeBoolean },
    { name: 'description', hebrewName: 'תיאור', aliases: ['תיאור'], required: false, parser: optionalString },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => null
  };
}

// ===== SHABBAT APARTMENTS (NO IMAGES!) =====
function getShabbatApartmentSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'city', hebrewName: 'עיר', aliases: ['עיר'], required: true, parser: requiredString },
    { name: 'neighborhood', hebrewName: 'שכונה', aliases: ['שכונה'], required: true, parser: requiredString },
    { name: 'street', hebrewName: 'רחוב', aliases: ['רחוב'], required: false, parser: optionalString },
    { name: 'houseNumber', hebrewName: 'מספר בית', aliases: ['מספר בית'], required: false, parser: optionalString },
    { name: 'isPaid', hebrewName: 'בתשלום', aliases: ['בתשלום'], required: true, parser: requiredBoolean },
    { name: 'parasha', hebrewName: 'פרשה', aliases: ['פרשה'], required: true, parser: requiredString },
    { name: 'propertyType', hebrewName: 'סוג הנכס', aliases: ['סוג הנכס'], required: true, parser: requiredString },
    { name: 'rooms', hebrewName: 'מספר חדרים', aliases: ['מספר חדרים'], required: true, parser: parseRoomsRequired },
    { name: 'purpose', hebrewName: 'מטרה', aliases: ['מטרה'], required: true, parser: parsePurpose },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptional },
    { name: 'balconies', hebrewName: 'מספר מרפסות', aliases: ['מספר מרפסות'], required: false, parser: parseOptionalInt },
    { name: 'plate', hebrewName: 'פלטה', aliases: ['פלטה'], required: false, parser: normalizeBoolean },
    { name: 'waterHeater', hebrewName: 'מיחם', aliases: ['מיחם'], required: false, parser: normalizeBoolean },
    { name: 'view', hebrewName: 'נוף', aliases: ['נוף'], required: false, parser: normalizeBoolean },
    { name: 'bedding', hebrewName: 'מצעים', aliases: ['מצעים'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'balcony', hebrewName: 'מרפסת', aliases: ['מרפסת'], required: false, parser: normalizeBoolean },
    { name: 'pool', hebrewName: 'בריכה', aliases: ['בריכה'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'playground', hebrewName: 'משחקי ילדים', aliases: ['משחקי ילדים'], required: false, parser: normalizeBoolean },
    { name: 'crib', hebrewName: 'מיטת תינוק', aliases: ['מיטת תינוק'], required: false, parser: normalizeBoolean },
    { name: 'parentalUnit', hebrewName: 'יחידת הורים', aliases: ['יחידת הורים'], required: false, parser: normalizeBoolean },
    { name: 'lodgingOnly', hebrewName: 'לינה בלבד', aliases: ['לינה בלבד'], required: false, parser: normalizeBoolean },
    { name: 'price', hebrewName: 'מחיר', aliases: ['מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => null
  };
}

// ===== WANTED FOR SHABBAT (דרושים - שבת) =====
function getWantedForShabbatSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'requestedLocation', hebrewName: 'רחוב / אזור מבוקש', aliases: ['רחוב / אזור מבוקש'], required: true, parser: requiredString },
    { name: 'isPaid', hebrewName: 'בתשלום', aliases: ['בתשלום'], required: true, parser: requiredBoolean },
    { name: 'parasha', hebrewName: 'פרשה', aliases: ['פרשה'], required: true, parser: requiredString },
    { name: 'propertyType', hebrewName: 'סוג הנכס', aliases: ['סוג הנכס'], required: true, parser: requiredString },
    { name: 'rooms', hebrewName: 'מספר חדרים', aliases: ['מספר חדרים'], required: true, parser: parseRoomsRequired },
    { name: 'purpose', hebrewName: 'מטרה', aliases: ['מטרה'], required: false, parser: parsePurposeOptional },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptional },
    { name: 'balconies', hebrewName: 'מספר מרפסות', aliases: ['מספר מרפסות'], required: false, parser: parseOptionalInt },
    { name: 'plate', hebrewName: 'פלטה', aliases: ['פלטה'], required: false, parser: normalizeBoolean },
    { name: 'waterHeater', hebrewName: 'מיחם', aliases: ['מיחם'], required: false, parser: normalizeBoolean },
    { name: 'view', hebrewName: 'נוף', aliases: ['נוף'], required: false, parser: normalizeBoolean },
    { name: 'bedding', hebrewName: 'מצעים', aliases: ['מצעים'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'balcony', hebrewName: 'מרפסת', aliases: ['מרפסת'], required: false, parser: normalizeBoolean },
    { name: 'pool', hebrewName: 'בריכה', aliases: ['בריכה'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'playground', hebrewName: 'משחקי ילדים', aliases: ['משחקי ילדים'], required: false, parser: normalizeBoolean },
    { name: 'crib', hebrewName: 'מיטת תינוק', aliases: ['מיטת תינוק'], required: false, parser: normalizeBoolean },
    { name: 'parentalUnit', hebrewName: 'יחידת הורים', aliases: ['יחידת הורים'], required: false, parser: normalizeBoolean },
    { name: 'lodgingOnly', hebrewName: 'לינה בלבד', aliases: ['לינה בלבד'], required: false, parser: normalizeBoolean },
    { name: 'price', hebrewName: 'מחיר', aliases: ['מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => null
  };
}

// ===== COMMERCIAL REAL ESTATE - REGULAR =====
function getCommercialSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'hasBroker', hebrewName: 'תיווך', aliases: ['תיווך'], required: true, parser: requiredBoolean },
    { name: 'transactionType', hebrewName: 'סוג עסקה', aliases: ['סוג עסקה', 'למכירה/להשכרה'], required: true, parser: parseTransactionType },
    { name: 'city', hebrewName: 'עיר', aliases: ['עיר'], required: true, parser: requiredString },
    { name: 'street', hebrewName: 'רחוב', aliases: ['רחוב'], required: false, parser: optionalString },
    { name: 'neighborhood', hebrewName: 'שכונה', aliases: ['שכונה'], required: true, parser: requiredString },
    { name: 'houseNumber', hebrewName: 'מספר בית', aliases: ['מספר בית'], required: false, parser: optionalString },
    { name: 'commercialType', hebrewName: 'סוג הנכס', aliases: ['סוג הנכס'], required: true, parser: requiredString },
    { name: 'squareMeters', hebrewName: 'שטח במר', aliases: ['שטח במר', 'שטח'], required: false, parser: parseRequiredNumber },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptional },
    { name: 'condition', hebrewName: 'מצב הנכס', aliases: ['מצב הנכס'], required: false, parser: optionalString },
    { name: 'entryDate', hebrewName: 'תאריך כניסה', aliases: ['תאריך כניסה'], required: false, parser: parseDateOptional },
    { name: 'price', hebrewName: 'מחיר', aliases: ['מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'parking', hebrewName: 'חניה', aliases: ['חניה'], required: false, parser: normalizeBoolean },
    { name: 'elevator', hebrewName: 'מעלית', aliases: ['מעלית'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'gallery', hebrewName: 'גלריה', aliases: ['גלריה'], required: false, parser: normalizeBoolean },
    { name: 'storage', hebrewName: 'מחסון', aliases: ['מחסון'], required: false, parser: normalizeBoolean },
    { name: 'kitchenette', hebrewName: 'מטבחון', aliases: ['מטבחון'], required: false, parser: normalizeBoolean },
    { name: 'safeRoom', hebrewName: 'ממד', aliases: ['ממד'], required: false, parser: normalizeBoolean },
    { name: 'toilets', hebrewName: 'שירותים', aliases: ['שירותים'], required: false, parser: normalizeBoolean },
    { name: 'storefront', hebrewName: 'חלון ראווה לרחוב', aliases: ['חלון ראווה לרחוב', 'חלון ראווה'], required: false, parser: normalizeBoolean },
    { name: 'accessibleForDisabled', hebrewName: 'נגישות לנכים', aliases: ['נגישות לנכים'], required: false, parser: normalizeBoolean },
    { name: 'internet', hebrewName: 'אינטרנט', aliases: ['אינטרנט'], required: false, parser: normalizeBoolean },
    { name: 'upgraded', hebrewName: 'מושפץ', aliases: ['מושפץ'], required: false, parser: normalizeBoolean },
    { name: 'description', hebrewName: 'תיאור הנכס', aliases: ['תיאור הנכס'], required: false, parser: requiredString },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => row.city && row.street && row.houseNumber ?
      `${row.city}-${row.street}-${row.houseNumber}`.toLowerCase() : null
  };
}

// ===== WANTED FOR COMMERCIAL (דרושים - נדל"ן מסחרי) =====
function getWantedCommercialSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'hasBroker', hebrewName: 'תיווך', aliases: ['תיווך'], required: true, parser: requiredBoolean },
    { name: 'transactionType', hebrewName: 'סוג עסקה', aliases: ['סוג עסקה', 'למכירה/להשכרה'], required: false, parser: parseTransactionTypeOptional },
    { name: 'requestedLocation', hebrewName: 'רחוב / אזור מבוקש', aliases: ['רחוב / אזור מבוקש'], required: true, parser: requiredString },
    { name: 'commercialType', hebrewName: 'סוג הנכס', aliases: ['סוג הנכס'], required: true, parser: requiredString },
    { name: 'squareMeters', hebrewName: 'שטח במר', aliases: ['שטח במר', 'שטח'], required: false, parser: parseOptionalNumber },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptional },
    { name: 'condition', hebrewName: 'מצב הנכס', aliases: ['מצב הנכס'], required: false, parser: optionalString },
    { name: 'price', hebrewName: 'מחיר', aliases: ['מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'entryDate', hebrewName: 'תאריך כניסה', aliases: ['תאריך כניסה'], required: false, parser: parseDateOptional },
    { name: 'parking', hebrewName: 'חניה', aliases: ['חניה'], required: false, parser: normalizeBoolean },
    { name: 'elevator', hebrewName: 'מעלית', aliases: ['מעלית'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'gallery', hebrewName: 'גלריה', aliases: ['גלריה'], required: false, parser: normalizeBoolean },
    { name: 'storage', hebrewName: 'מחסון', aliases: ['מחסון'], required: false, parser: normalizeBoolean },
    { name: 'kitchenette', hebrewName: 'מטבחון', aliases: ['מטבחון'], required: false, parser: normalizeBoolean },
    { name: 'safeRoom', hebrewName: 'ממד', aliases: ['ממד'], required: false, parser: normalizeBoolean },
    { name: 'toilets', hebrewName: 'שירותים', aliases: ['שירותים'], required: false, parser: normalizeBoolean },
    { name: 'storefront', hebrewName: 'חלון ראווה לרחוב', aliases: ['חלון ראווה לרחוב', 'חלון ראווה'], required: false, parser: normalizeBoolean },
    { name: 'accessibleForDisabled', hebrewName: 'נגישות לנכים', aliases: ['נגישות לנכים'], required: false, parser: normalizeBoolean },
    { name: 'internet', hebrewName: 'אינטרנט', aliases: ['אינטרנט'], required: false, parser: normalizeBoolean },
    { name: 'upgraded', hebrewName: 'מושפץ', aliases: ['מושפץ'], required: false, parser: normalizeBoolean },
    { name: 'description', hebrewName: 'תיאור', aliases: ['תיאור', 'תיאור הנכס'], required: false, parser: optionalString },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => null
  };
}

// ===== SHARED OWNERSHIP (TABU) - REGULAR =====
function getSharedOwnershipSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'hasBroker', hebrewName: 'תיווך', aliases: ['תיווך'], required: true, parser: requiredBoolean },
    { name: 'city', hebrewName: 'עיר', aliases: ['עיר'], required: true, parser: requiredString },
    { name: 'street', hebrewName: 'רחוב', aliases: ['רחוב'], required: false, parser: optionalString },
    { name: 'neighborhood', hebrewName: 'שכונה', aliases: ['שכונה'], required: true, parser: requiredString },
    { name: 'houseNumber', hebrewName: 'מספר בית', aliases: ['מספר בית'], required: false, parser: optionalString },
    { name: 'propertyType', hebrewName: 'סוג הנכס', aliases: ['סוג הנכס'], required: true, parser: parsePropertyType },
    { name: 'rooms', hebrewName: 'מספר חדרים', aliases: ['מספר חדרים'], required: true, parser: parseRoomsRequired },
    { name: 'squareMeters', hebrewName: 'שטח במר', aliases: ['שטח במר', 'שטח'], required: false, parser: parseOptionalNumberWithDecimals },
    { name: 'condition', hebrewName: 'מצב הנכס', aliases: ['מצב הנכס'], required: false, parser: optionalString },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptionalOrText },
    { name: 'balconies', hebrewName: 'מספר מרפסות', aliases: ['מספר מרפסות'], required: false, parser: parseOptionalInt },
    { name: 'priceRequested', hebrewName: 'מחיר מבוקש', aliases: ['מחיר מבוקש', 'מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'arnona', hebrewName: 'ארנונה', aliases: ['ארנונה'], required: false, parser: parseOptionalNumber },
    { name: 'vaad', hebrewName: 'ועד בית', aliases: ['ועד בית'], required: false, parser: parseOptionalNumber },
    { name: 'requiredEquity', hebrewName: 'הון עצמי נדרש', aliases: ['הון עצמי נדרש'], required: false, parser: parseRequiredNumber },
    { name: 'numberOfPartners', hebrewName: 'מספר שותפים', aliases: ['מספר שותפים'], required: false, parser: parseRequiredInt },
    { name: 'entryDate', hebrewName: 'תאריך כניסה', aliases: ['תאריך כניסה'], required: false, parser: parseEntryDateOptional },
    { name: 'parking', hebrewName: 'חניה', aliases: ['חניה'], required: false, parser: normalizeBoolean },
    { name: 'storage', hebrewName: 'מחסן', aliases: ['מחסן'], required: false, parser: normalizeBoolean },
    { name: 'view', hebrewName: 'נוף', aliases: ['נוף'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'sukkaBalcony', hebrewName: 'מרפסת סוכה', aliases: ['מרפסת סוכה'], required: false, parser: normalizeBoolean },
    { name: 'safeRoom', hebrewName: 'ממד', aliases: ['ממד'], required: false, parser: normalizeBoolean },
    { name: 'parentalUnit', hebrewName: 'יחידת הורים', aliases: ['יחידת הורים'], required: false, parser: normalizeBoolean },
    { name: 'elevator', hebrewName: 'מעלית', aliases: ['מעלית'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'garden', hebrewName: 'גינה', aliases: ['גינה'], required: false, parser: normalizeBoolean },
    { name: 'frontFacing', hebrewName: 'חזית', aliases: ['חזית'], required: false, parser: normalizeBoolean },
    { name: 'upgradedKitchen', hebrewName: 'מטבח משודרג', aliases: ['מטבח משודרג'], required: false, parser: normalizeBoolean },
    { name: 'accessibleForDisabled', hebrewName: 'נגישה לנכים', aliases: ['נגישה לנכים'], required: false, parser: normalizeBoolean },
    { name: 'description', hebrewName: 'תיאור', aliases: ['תיאור', 'תיאור הנכס'], required: false, parser: optionalString },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => row.city && row.street && row.houseNumber ?
      `${row.city}-${row.street}-${row.houseNumber}`.toLowerCase() : null
  };
}

// ===== WANTED SHARED OWNERSHIP =====
function getWantedSharedOwnershipSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'hasBroker', hebrewName: 'תיווך', aliases: ['תיווך'], required: true, parser: requiredBoolean },
    { name: 'requestedLocation', hebrewName: 'רחוב / אזור מבוקש', aliases: ['רחוב / אזור מבוקש', 'אזור מבוקש'], required: true, parser: requiredString },
    { name: 'propertyType', hebrewName: 'סוג הנכס', aliases: ['סוג הנכס'], required: true, parser: parsePropertyType },
    { name: 'rooms', hebrewName: 'מספר חדרים', aliases: ['מספר חדרים'], required: true, parser: parseRoomsRequired },
    { name: 'squareMeters', hebrewName: 'שטח במר', aliases: ['שטח במר', 'שטח'], required: false, parser: parseOptionalNumberWithDecimals },
    { name: 'condition', hebrewName: 'מצב הנכס', aliases: ['מצב הנכס'], required: false, parser: optionalString },
    { name: 'floor', hebrewName: 'קומה', aliases: ['קומה'], required: false, parser: parseFloorOptionalOrText },
    { name: 'balconies', hebrewName: 'מספר מרפסות', aliases: ['מספר מרפסות'], required: false, parser: parseOptionalInt },
    { name: 'priceRequested', hebrewName: 'מחיר מבוקש', aliases: ['מחיר מבוקש', 'מחיר'], required: false, parser: parseOptionalNumber },
    { name: 'arnona', hebrewName: 'ארנונה', aliases: ['ארנונה'], required: false, parser: parseOptionalNumber },
    { name: 'vaad', hebrewName: 'ועד בית', aliases: ['ועד בית'], required: false, parser: parseOptionalNumber },
    { name: 'requiredEquity', hebrewName: 'הון עצמי נדרש', aliases: ['הון עצמי נדרש'], required: false, parser: parseOptionalNumber },
    { name: 'numberOfPartners', hebrewName: 'מספר שותפים', aliases: ['מספר שותפים'], required: false, parser: parseOptionalInt },
    { name: 'entryDate', hebrewName: 'תאריך כניסה', aliases: ['תאריך כניסה'], required: false, parser: parseEntryDateOptional },
    { name: 'parking', hebrewName: 'חניה', aliases: ['חניה'], required: false, parser: normalizeBoolean },
    { name: 'storage', hebrewName: 'מחסן', aliases: ['מחסן'], required: false, parser: normalizeBoolean },
    { name: 'view', hebrewName: 'נוף', aliases: ['נוף'], required: false, parser: normalizeBoolean },
    { name: 'airConditioning', hebrewName: 'מיזוג', aliases: ['מיזוג'], required: false, parser: normalizeBoolean },
    { name: 'sukkaBalcony', hebrewName: 'מרפסת סוכה', aliases: ['מרפסת סוכה'], required: false, parser: normalizeBoolean },
    { name: 'safeRoom', hebrewName: 'ממד', aliases: ['ממד'], required: false, parser: normalizeBoolean },
    { name: 'parentalUnit', hebrewName: 'יחידת הורים', aliases: ['יחידת הורים'], required: false, parser: normalizeBoolean },
    { name: 'elevator', hebrewName: 'מעלית', aliases: ['מעלית'], required: false, parser: normalizeBoolean },
    { name: 'yard', hebrewName: 'חצר', aliases: ['חצר'], required: false, parser: normalizeBoolean },
    { name: 'garden', hebrewName: 'גינה', aliases: ['גינה'], required: false, parser: normalizeBoolean },
    { name: 'frontFacing', hebrewName: 'חזית', aliases: ['חזית'], required: false, parser: normalizeBoolean },
    { name: 'upgradedKitchen', hebrewName: 'מטבח משודרג', aliases: ['מטבח משודרג'], required: false, parser: normalizeBoolean },
    { name: 'accessibleForDisabled', hebrewName: 'נגישה לנכים', aliases: ['נגישה לנכים'], required: false, parser: normalizeBoolean },
    { name: 'description', hebrewName: 'תיאור', aliases: ['תיאור', 'תיאור הנכס'], required: false, parser: optionalString },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => null
  };
}

// ===== FALLBACK BASIC SCHEMA =====
function getBasicSchema(): CategorySchema {
  const fields: FieldSchema[] = [
    { name: 'title', hebrewName: 'כותרת', aliases: ['כותרת'], required: true, parser: requiredString },
    { name: 'description', hebrewName: 'תיאור', aliases: ['תיאור'], required: false, parser: requiredString },
    { name: 'contactName', hebrewName: 'שם', aliases: ['שם'], required: false, parser: optionalString },
    { name: 'contactPhone', hebrewName: 'טלפון', aliases: ['טלפון'], required: true, parser: requiredString },
  ];
  
  return {
    fields,
    getDuplicateKey: (row) => null
  };
}

// ========================================
// HELPER PARSERS
// ========================================

// Required parsers
function requiredString(value: any): string {
  if (!value || !value.toString().trim()) throw new Error('שדה חובה');
  return value.toString().trim();
}

function requiredBoolean(value: any): boolean {
  if (!value) throw new Error('שדה חובה - יש לבחור כן או לא');
  const str = value.toString().trim().toLowerCase();
  if (str === 'כן' || str === 'yes' || str === 'true' || str === '1') return true;
  if (str === 'לא' || str === 'no' || str === 'false' || str === '0') return false;
  throw new Error('ערך לא תקין - יש להזין כן או לא');
}

function parseRequiredNumber(value: any): number {
  if (!value) throw new Error('שדה חובה');
  const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
  if (isNaN(num)) throw new Error('מספר לא תקין');
  return num;
}

function parseRequiredInt(value: any): number {
  if (!value) throw new Error('שדה חובה');
  const num = parseInt(value.toString());
  if (isNaN(num)) throw new Error('מספר שלם לא תקין');
  return num;
}

function parseRoomsRequired(value: any): number {
  if (!value) throw new Error('מספר חדרים חובה');
  const num = parseFloat(value.toString().replace(',', '.'));
  if (isNaN(num) || num < 0) throw new Error('מספר חדרים לא תקין');
  return num;
}

function parseFloorRequired(value: any): number {
  if (!value && value !== 0) throw new Error('קומה חובה');
  const str = value.toString().toLowerCase();
  if (str.includes('קרקע') || str.includes('ground')) return 0;
  const num = parseInt(value);
  if (isNaN(num)) throw new Error('קומה לא תקינה');
  return num;
}

function parseFurnitureRequired(value: any): string {
  if (!value || !value.toString().trim()) throw new Error('ריהוט חובה');
  const str = value.toString().trim();
  const validOptions = ['מלא', 'חלקי', 'ללא'];
  if (!validOptions.includes(str)) {
    throw new Error(`ריהוט חייב להיות: ${validOptions.join(' / ')}`);
  }
  return str;
}

function parseDateRequired(value: any): string {
  if (!value) throw new Error('תאריך חובה');
  const date = parseDate(value);
  if (!date) throw new Error('תאריך לא תקין');
  return date;
}

function parseTransactionType(value: any): string {
  if (!value || !value.toString().trim()) throw new Error('סוג עסקה חובה');
  const str = value.toString().trim().toUpperCase();
  
  // Accept variations
  if (str === 'FOR_RENT' || str === 'RENT' || str.includes('השכרה') || str.includes('להשכרה')) {
    return 'FOR_RENT';
  }
  if (str === 'FOR_SALE' || str === 'SALE' || str.includes('מכירה') || str.includes('למכירה')) {
    return 'FOR_SALE';
  }
  
  throw new Error('סוג עסקה חייב להיות: למכירה או להשכרה');
}

function parseTransactionTypeOptional(value: any): string | null {
  if (!value || !value.toString().trim()) return null;
  const str = value.toString().trim().toUpperCase();
  
  // Accept variations
  if (str === 'FOR_RENT' || str === 'RENT' || str.includes('השכרה') || str.includes('להשכרה')) {
    return 'FOR_RENT';
  }
  if (str === 'FOR_SALE' || str === 'SALE' || str.includes('מכירה') || str.includes('למכירה')) {
    return 'FOR_SALE';
  }
  
  throw new Error('סוג עסקה חייב להיות: למכירה או להשכרה');
}

function parsePurpose(value: any): string {
  if (!value || !value.toString().trim()) throw new Error('מטרה חובה');
  const str = value.toString().trim();
  const validOptions = ['אירוח', 'לינה בלבד'];
  if (!validOptions.includes(str)) {
    throw new Error(`מטרה חייבת להיות: ${validOptions.join(' / ')}`);
  }
  return str;
}

function parsePurposeOptional(value: any): string | null {
  if (!value || !value.toString().trim()) return null;
  const str = value.toString().trim();
  const validOptions = ['אירוח', 'לינה בלבד'];
  if (!validOptions.includes(str)) {
    throw new Error(`מטרה חייבת להיות: ${validOptions.join(' / ')}`);
  }
  return str;
}

// Optional parsers
function optionalString(value: any): string | null {
  return value && value.toString().trim() ? value.toString().trim() : null;
}

function normalizeBoolean(value: any): boolean | null {
  if (!value) return null;
  const str = value.toString().trim().toLowerCase();
  if (str === 'כן' || str === 'yes' || str === 'true' || str === '1') return true;
  if (str === 'לא' || str === 'no' || str === 'false' || str === '0') return false;
  return null;
}

function parseDate(value: any): string | null {
  if (!value) return null;
  
  // Try DD/MM/YYYY format
  if (typeof value === 'string' && value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // Try ISO format
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {}
  
  return null;
}

function parseDateOptional(value: any): string | null {
  return value ? parseDate(value) : null;
}

function parseOptionalNumber(value: any): number | null {
  if (!value) return null;
  const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
  return isNaN(num) ? null : num;
}

function parseOptionalInt(value: any): number | null {
  if (!value) return null;
  const num = parseInt(value.toString());
  return isNaN(num) ? null : num;
}

function parseFloorOptional(value: any): number | null {
  if (!value && value !== 0) return null;
  const str = value.toString().toLowerCase();
  if (str.includes('קרקע') || str.includes('ground')) return 0;
  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

function parseFurnitureOptional(value: any): string | null {
  if (!value || !value.toString().trim()) return null;
  const str = value.toString().trim();
  const validOptions = ['מלא', 'חלקי', 'ללא'];
  if (!validOptions.includes(str)) return null;
  return str;
}

function parseUrl(value: any): string | null {
  if (!value || !value.toString().trim()) return null;
  const url = value.toString().trim();
  // Basic URL validation
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return null;
}

// ========================================
// NEW PARSERS FOR UPDATED REQUIREMENTS
// ========================================

// Parse property type with new types (פנטהאוז, דו קומתי, דו משפחתי)
function parsePropertyType(value: any): string {
  if (!value || !value.toString().trim()) throw new Error('סוג נכס חובה');
  const str = value.toString().trim();
  const validTypes = [
    'דירה',
    'דירת גן',
    'בית פרטי',
    'פנטהאוז',
    'דו קומתי',
    'דו משפחתי',
    'דופלקס',
    'מיני פנטהאוז',
    'סטודיו',
    'קוטג\'',
    'וילה',
    'משק עזר'
  ];
  
  // Try exact match first
  if (validTypes.includes(str)) return str;
  
  // Try case-insensitive match
  const lowerStr = str.toLowerCase();
  const found = validTypes.find(t => t.toLowerCase() === lowerStr);
  if (found) return found;
  
  // Return as-is if not in list (allow custom types)
  return str;
}

// Parse optional number with decimals (for rooms and area)
function parseOptionalNumberWithDecimals(value: any): number | null {
  if (!value) return null;
  const str = value.toString().replace(',', '.').replace(/[^\d.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

// Parse floor - can be number or "ללא"
function parseFloorOptionalOrText(value: any): string | null {
  if (!value && value !== 0) return null;
  const str = value.toString().trim();
  
  // Check if it's "ללא" or similar
  if (str === 'ללא' || str.toLowerCase() === 'none' || str === '') return null;
  
  // Check if it's ground floor
  if (str.toLowerCase().includes('קרקע') || str.toLowerCase().includes('ground')) return '0';
  
  // Try to parse as number
  const num = parseInt(str);
  if (!isNaN(num)) return num.toString();
  
  // Return as text if not a number
  return str;
}

// Parse entry date with flexible/immediate options
function parseEntryDateOptional(value: any): string | null {
  if (!value || !value.toString().trim()) return null;
  const str = value.toString().trim();
  
  // Check for special values
  if (str === 'גמיש' || str.toLowerCase() === 'flexible') return 'גמיש';
  if (str === 'מיידי' || str.toLowerCase() === 'immediate') return 'מיידי';
  
  // Try to parse as date
  return parseDate(value);
}

function buildCustomFields(row: any, categorySlug: string, adType?: string): any {
  const customFields: any = {};
  const isWanted = adType && adType.includes('WANTED');
  
  // Shabbat apartments
  if (categorySlug.includes('shabbat') || categorySlug.includes('holiday')) {
    if (row.isPaid !== undefined) customFields.isPaid = row.isPaid;
    if (row.parasha) customFields.parasha = row.parasha;
    if (row.propertyType) customFields.propertyType = row.propertyType;
    if (row.rooms) customFields.rooms = row.rooms;
    if (row.purpose) customFields.purpose = row.purpose;
    if (row.floor !== null) customFields.floor = row.floor;
    if (row.balconies) customFields.balconies = row.balconies;
    
    const features: any = {};
    if (row.plate !== null) features.plate = row.plate;
    if (row.waterHeater !== null) features.waterHeater = row.waterHeater;
    if (row.view !== null) features.view = row.view;
    if (row.bedding !== null) features.bedding = row.bedding;
    if (row.airConditioning !== null) features.airConditioning = row.airConditioning;
    if (row.balcony !== null) features.balcony = row.balcony;
    if (row.pool !== null) features.pool = row.pool;
    if (row.yard !== null) features.yard = row.yard;
    if (row.playground !== null) features.playground = row.playground;
    if (row.crib !== null) features.crib = row.crib;
    if (row.parentalUnit !== null) features.parentalUnit = row.parentalUnit;
    if (row.lodgingOnly !== null) features.lodgingOnly = row.lodgingOnly;
    
    if (Object.keys(features).length > 0) {
      customFields.features = features;
    }
    
    // Add contact info
    if (row.contactName) customFields.contactName = row.contactName;
    if (row.contactPhone) customFields.contactPhone = row.contactPhone;
    
    return customFields;
  }
  
  // Regular apartments (sale/rent)
  if (categorySlug.includes('apartment') || categorySlug.includes('sale') || categorySlug.includes('rent')) {
    if (row.hasBroker !== null) customFields.hasBroker = row.hasBroker;
    if (row.propertyType) customFields.propertyType = row.propertyType;
    if (row.rooms) customFields.rooms = row.rooms;
    if (row.squareMeters) customFields.squareMeters = row.squareMeters;
    if (row.condition) customFields.condition = row.condition;
    if (row.floor !== null && row.floor !== undefined) customFields.floor = row.floor;
    if (row.balconies) customFields.balconies = row.balconies;
    if (row.furniture) customFields.furniture = row.furniture;
    if (row.entryDate) customFields.entryDate = row.entryDate;
    if (row.arnona) customFields.arnona = row.arnona;
    if (row.vaad) customFields.vaad = row.vaad;
    
    // Wanted-specific: hasOption
    if (!isWanted || categorySlug.includes('sale')) {
      if (row.hasOption !== null) customFields.hasOption = row.hasOption;
    }
    
    const features: any = {};
    if (row.parking !== null) features.parking = row.parking;
    if (row.storage !== null) features.storage = row.storage;
    if (row.safeRoom !== null) features.safeRoom = row.safeRoom;
    if (row.sukkaBalcony !== null) features.sukkaBalcony = row.sukkaBalcony;
    if (row.elevator !== null) features.elevator = row.elevator;
    if (row.view !== null) features.view = row.view;
    if (row.parentalUnit !== null) features.parentalUnit = row.parentalUnit;
    if (row.housingUnit !== null) features.housingUnit = row.housingUnit;
    if (row.yard !== null) features.yard = row.yard;
    if (row.garden !== null) features.garden = row.garden;
    if (row.frontFacing !== null) features.frontFacing = row.frontFacing;
    if (row.upgradedKitchen !== null) features.upgradedKitchen = row.upgradedKitchen;
    if (row.accessibleForDisabled !== null) features.accessibleForDisabled = row.accessibleForDisabled;
    if (row.airConditioning !== null) features.airConditioning = row.airConditioning;
    
    if (Object.keys(features).length > 0) {
      customFields.features = features;
    }
    
    // Add contact info
    if (row.contactName) customFields.contactName = row.contactName;
    if (row.contactPhone) customFields.contactPhone = row.contactPhone;
  }
  
  // Commercial real estate
  if (categorySlug.includes('commercial') || categorySlug.includes('מסחרי')) {
    if (row.hasBroker !== null) customFields.hasBroker = row.hasBroker;
    if (row.transactionType) customFields.transactionType = row.transactionType;
    if (row.commercialType) customFields.commercialType = row.commercialType;
    if (row.squareMeters) customFields.squareMeters = row.squareMeters;
    if (row.floor !== null && row.floor !== undefined) customFields.floor = row.floor;
    if (row.condition) customFields.condition = row.condition;
    if (row.entryDate) customFields.entryDate = row.entryDate;
    
    const features: any = {};
    if (row.parking !== null) features.parking = row.parking;
    if (row.elevator !== null) features.elevator = row.elevator;
    if (row.airConditioning !== null) features.airConditioning = row.airConditioning;
    if (row.yard !== null) features.yard = row.yard;
    if (row.gallery !== null) features.gallery = row.gallery;
    if (row.storage !== null) features.storage = row.storage;
    if (row.kitchenette !== null) features.kitchenette = row.kitchenette;
    if (row.safeRoom !== null) features.safeRoom = row.safeRoom;
    if (row.toilets !== null) features.toilets = row.toilets;
    if (row.storefront !== null) features.storefront = row.storefront;
    if (row.accessibleForDisabled !== null) features.accessibleForDisabled = row.accessibleForDisabled;
    if (row.internet !== null) features.internet = row.internet;
    if (row.upgraded !== null) features.upgraded = row.upgraded;
    
    if (Object.keys(features).length > 0) {
      customFields.features = features;
    }
    
    // Add contact info
    if (row.contactName) customFields.contactName = row.contactName;
    if (row.contactPhone) customFields.contactPhone = row.contactPhone;
    if (row.description) customFields.description = row.description;
  }
  
  // Shared ownership (Tabu)
  if (categorySlug.includes('shared') || categorySlug.includes('משותף')) {
    if (row.hasBroker !== null) customFields.hasBroker = row.hasBroker;
    if (row.propertyType) customFields.propertyType = row.propertyType;
    if (row.rooms) customFields.rooms = row.rooms;
    if (row.squareMeters) customFields.squareMeters = row.squareMeters;
    if (row.condition) customFields.condition = row.condition;
    if (row.floor !== null && row.floor !== undefined) customFields.floor = row.floor;
    if (row.balconies) customFields.balconies = row.balconies;
    if (row.priceRequested) customFields.priceRequested = row.priceRequested;
    if (row.arnona) customFields.arnona = row.arnona;
    if (row.vaad) customFields.vaad = row.vaad;
    if (row.requiredEquity) customFields.requiredEquity = row.requiredEquity;
    if (row.numberOfPartners) customFields.numberOfPartners = row.numberOfPartners;
    if (row.entryDate) customFields.entryDate = row.entryDate;
    
    const features: any = {};
    if (row.parking !== null) features.parking = row.parking;
    if (row.storage !== null) features.storage = row.storage;
    if (row.view !== null) features.view = row.view;
    if (row.airConditioning !== null) features.airConditioning = row.airConditioning;
    if (row.sukkaBalcony !== null) features.sukkaBalcony = row.sukkaBalcony;
    if (row.safeRoom !== null) features.safeRoom = row.safeRoom;
    if (row.parentalUnit !== null) features.parentalUnit = row.parentalUnit;
    if (row.elevator !== null) features.elevator = row.elevator;
    if (row.yard !== null) features.yard = row.yard;
    if (row.garden !== null) features.garden = row.garden;
    if (row.frontFacing !== null) features.frontFacing = row.frontFacing;
    if (row.upgradedKitchen !== null) features.upgradedKitchen = row.upgradedKitchen;
    if (row.accessibleForDisabled !== null) features.accessibleForDisabled = row.accessibleForDisabled;
    
    if (Object.keys(features).length > 0) {
      customFields.features = features;
    }
    
    // Add contact info
    if (row.contactName) customFields.contactName = row.contactName;
    if (row.contactPhone) customFields.contactPhone = row.contactPhone;
  }
  
  return Object.keys(customFields).length > 0 ? customFields : null;
}

function buildTitle(row: any, categorySlug: string, adType?: string): string {
  const isWanted = adType && adType.includes('WANTED');
  
  // Shabbat
  if (categorySlug.includes('shabbat')) {
    const parts = [];
    if (row.propertyType) parts.push(row.propertyType);
    if (row.rooms) parts.push(`${row.rooms} חדרים`);
    if (row.requestedLocation) parts.push(`ב${row.requestedLocation}`);
    if (row.parasha) parts.push(`לשבת ${row.parasha}`);
    return parts.join(' ') || 'דירה לשבת';
  }
  
  // Regular / Wanted apartments
  if (categorySlug.includes('apartment') || categorySlug.includes('sale') || categorySlug.includes('rent')) {
    const parts = [];
    if (isWanted) parts.push('דרוש:');
    if (row.propertyType) parts.push(row.propertyType);
    if (row.rooms) parts.push(`${row.rooms} חדרים`);
    
    if (isWanted && row.requestedLocation) {
      parts.push(`ב${row.requestedLocation}`);
    } else {
      if (row.city) parts.push(`ב${row.city}`);
      if (row.street) parts.push(row.street);
    }
    
    return parts.join(' ') || 'נכס';
  }
  
  return 'מודעה';
}

function buildAddress(row: any, adType?: string): string | null {
  const isWanted = adType && adType.includes('WANTED');
  
  if (isWanted) {
    return row.requestedLocation || null;
  }
  
  // Build address: street + house number (NO city - city is stored separately in cityId)
  const parts = [];
  if (row.street) parts.push(row.street);
  if (row.houseNumber) parts.push(row.houseNumber);
  return parts.length > 0 ? parts.join(' ') : null;
}

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
