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

// Import cities and streets
router.post('/cities-streets', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const adminId = (req as any).user.id;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Process each row
    for (const row of data as any[]) {
      try {
        // Expected columns: cityName, cityNameHe, streetName, streetCode, neighborhood
        const { cityName, cityNameHe, streetName, streetCode, neighborhood } = row;

        if (!cityName || !cityNameHe) {
          failedCount++;
          errors.push({ row, error: 'Missing city name' });
          continue;
        }

        // Upsert city
        const city = await prisma.city.upsert({
          where: { name: cityName },
          update: { 
            nameHe: cityNameHe,
            updatedAt: new Date(),
          },
          create: {
            id: `city-${cityName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: cityName,
            nameHe: cityNameHe,
            slug: cityName.toLowerCase().replace(/\s+/g, '-'),
            updatedAt: new Date(),
          },
        });

        // If street data exists, upsert street
        if (streetName && streetCode) {
          let neighborhoodId = null;

          // Create neighborhood if provided
          if (neighborhood) {
            const nbh = await prisma.neighborhood.upsert({
              where: {
                cityId_name: {
                  cityId: city.id,
                  name: neighborhood,
                },
              },
              update: {
                updatedAt: new Date(),
              },
              create: {
                id: `nbh-${city.id}-${neighborhood}-${Date.now()}`,
                name: neighborhood,
                cityId: city.id,
                updatedAt: new Date(),
              },
            });
            neighborhoodId = nbh.id;
          }

          await prisma.street.upsert({
            where: {
              cityId_code: {
                cityId: city.id,
                code: streetCode,
              },
            },
            update: {
              name: streetName,
              neighborhoodId,
              updatedAt: new Date(),
            },
            create: {
              id: `street-${city.id}-${streetCode}-${Date.now()}`,
              name: streetName,
              code: streetCode,
              cityId: city.id,
              neighborhoodId,
              updatedAt: new Date(),
            },
          });
        }

        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push({ row, error: error.message });
      }
    }

    // Clean up uploaded file
    await fs.unlink(filePath);

    // Log import
    await prisma.importLog.create({
      data: {
        adminId,
        importType: 'CITIES_STREETS',
        fileName,
        totalRows: data.length,
        successRows: successCount,
        failedRows: failedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    res.json({
      success: true,
      totalRows: data.length,
      successRows: successCount,
      failedRows: failedCount,
      errors: errors.slice(0, 10), // Return first 10 errors only
    });

  } catch (error: any) {
    console.error('Error importing cities/streets:', error);
    
    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
    }

    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Import properties
router.post('/properties', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const adminId = (req as any).user.id;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Process each row
    for (const row of data as any[]) {
      try {
        // Expected columns: title, description, price, categorySlug, cityName, address, userId (email)
        const { title, description, price, categorySlug, cityName, address, userEmail, rooms, floor, size } = row;

        if (!title || !description || !categorySlug) {
          failedCount++;
          errors.push({ row, error: 'Missing required fields' });
          continue;
        }

        // Find category
        const category = await prisma.category.findUnique({
          where: { slug: categorySlug },
        });

        if (!category) {
          failedCount++;
          errors.push({ row, error: `Category not found: ${categorySlug}` });
          continue;
        }

        // Find user (default to first admin if not provided)
        let user;
        if (userEmail) {
          user = await prisma.user.findUnique({ where: { email: userEmail } });
        }
        if (!user) {
          user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        }

        if (!user) {
          failedCount++;
          errors.push({ row, error: 'No user found' });
          continue;
        }

        // Find city
        let city = null;
        if (cityName) {
          city = await prisma.city.findFirst({
            where: { name: { contains: cityName, mode: 'insensitive' } },
          });
        }

        // Create ad (as draft/pending)
        const customFields: any = {};
        if (rooms) customFields.rooms = rooms;
        if (floor) customFields.floor = floor;
        if (size) customFields.size = size;

        await prisma.ad.create({
          data: {
            id: `ad-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title,
            description,
            price: price ? parseFloat(price) : null,
            userId: user.id,
            categoryId: category.id,
            cityId: city?.id,
            address,
            customFields: Object.keys(customFields).length > 0 ? customFields : null,
            status: 'PENDING', // All imported ads need approval
            updatedAt: new Date(),
          },
        });

        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push({ row, error: error.message });
      }
    }

    // Clean up uploaded file
    await fs.unlink(filePath);

    // Log import
    await prisma.importLog.create({
      data: {
        adminId,
        importType: 'PROPERTIES',
        fileName,
        totalRows: data.length,
        successRows: successCount,
        failedRows: failedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    res.json({
      success: true,
      totalRows: data.length,
      successRows: successCount,
      failedRows: failedCount,
      errors: errors.slice(0, 10),
    });

  } catch (error: any) {
    console.error('Error importing properties:', error);
    
    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
    }

    res.status(500).json({ error: 'Failed to import data' });
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
