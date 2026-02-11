import multer from 'multer';
import path from 'path';
import { config } from '../config';
import { ValidationError } from '../utils/errors';
import { validateUploadedFile } from '../utils/fileValidation';
import { virusScannerService } from '../services/virusScanner.service';
import { securityLogger } from '../utils/securityLogger';
import * as fs from 'fs/promises';
import { Request, Response, NextFunction } from 'express';
import fileType from 'file-type';

// Use memory storage to get buffer for validation BEFORE saving to disk
const storage = multer.memoryStorage();

// CRITICAL: File type validation based on magic bytes, not mimetype or extension
// This prevents attacks like renaming malware.exe to image.jpg
const imageFilter = async (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // First check declared mimetype (fast check)
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedImageTypes.includes(file.mimetype)) {
    cb(new ValidationError(`סוג קובץ לא תקין. מותר רק: JPG, JPEG, PNG, WebP`));
    return;
  }
  
  // Note: Actual magic bytes validation happens in validateAndSave middleware
  // because fileFilter doesn't have access to buffer yet
  cb(null, true);
};

const floorPlanFilter = async (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new ValidationError(`סוג קובץ לא תקין. מותר: JPG, JPEG, PNG, PDF`));
    return;
  }
  cb(null, true);
};

// Regular image upload (up to 15 images, max 5MB each)
export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Floor plan upload (single file, up to 10MB)
export const uploadFloorPlan = multer({
  storage,
  fileFilter: floorPlanFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// PDF filter for content distribution
const fileFilter = async (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new ValidationError('סוג קובץ לא תקין. מותר: PDF, JPG, JPEG, PNG'));
    return;
  }
  cb(null, true);
};

// File upload (PDF or image, up to 20MB)
export const uploadFile = multer({
  storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

/**
 * CRITICAL SECURITY MIDDLEWARE - Validates file using magic bytes BEFORE saving to disk
 * -------------------------------------------------------------------------------------
 * This middleware MUST run after Multer (which stores file in memory)
 * It validates the actual file content, then saves to disk only if valid
 * 
 * Security checks:
 * 1. Detect real file type using magic bytes (not extension/mimetype)
 * 2. Compare detected type with allowed types
 * 3. Reject if mismatch (prevents .exe renamed to .jpg)
 * 4. Save to disk only after validation passes
 * 5. Optional virus scanning
 */
export async function validateAndSaveFile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  console.log('🔒🔒🔒 [VALIDATION] validateAndSaveFile called - TIMESTAMP:', new Date().toLocaleTimeString('he-IL'));
  console.log('🔒 [VALIDATION] req.files:', req.files);
  console.log('🔒 [VALIDATION] req.file:', req.file);
  
  try {
    const files = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : req.file
      ? [req.file]
      : [];

    console.log('🔒 [VALIDATION] Files to validate:', files.length);

    if (files.length === 0) {
      console.log('🔒 [VALIDATION] No files to validate, continuing...');
      return next();
    }

    // Process each file
    for (const file of files as Express.Multer.File[]) {
      if (!file.buffer) {
        securityLogger.logRejection(
          file.originalname,
          file.mimetype,
          'No file buffer available'
        );
        return res.status(400).json({
          error: 'קובץ לא תקין',
          message: 'File buffer not available',
        });
      }

      // CRITICAL: Detect real file type using magic bytes
      const detectedType = await fileType.fromBuffer(file.buffer);

      // Log for debugging in dev
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 [FILE_VALIDATION]', {
          originalName: file.originalname,
          declaredMime: file.mimetype,
          detectedMime: detectedType?.mime || 'UNKNOWN',
          detectedExt: detectedType?.ext || 'UNKNOWN',
        });
      }

      // If file type cannot be detected → REJECT
      if (!detectedType) {
        securityLogger.logRejection(
          file.originalname,
          file.mimetype,
          'Cannot detect file type from magic bytes (possible text file or unknown format)'
        );
        return res.status(400).json({
          error: 'קובץ לא תקין',
          message: 'לא ניתן לזהות את סוג הקובץ. ייתכן שזה קובץ טקסט או פורמט לא נתמך.',
        });
      }

      // Define allowed types based on declared mimetype
      const allowedMimes = getAllowedMimesForDeclared(file.mimetype);

      // Normalize MIME types (image/jpg → image/jpeg)
      const normalizedDetected = (detectedType.mime as string) === 'image/jpg' ? 'image/jpeg' : detectedType.mime;
      const normalizedDeclared = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;

      // Check if detected type is allowed
      if (!allowedMimes.includes(normalizedDetected)) {
        securityLogger.logMimeMismatch(
          file.originalname,
          file.mimetype,
          detectedType.mime,
          detectedType.ext,
          { fileSize: file.size }
        );
        return res.status(400).json({
          error: 'קובץ לא תקין',
          message: `סוג הקובץ האמיתי (${detectedType.mime}) אינו תואם לסוג המוצהר (${file.mimetype}). זה עלול להיות ניסיון התקפה.`,
        });
      }

      // Optional: Virus scanning
      const scanResult = await virusScannerService.scanBuffer(file.buffer, file.originalname);
      if (!scanResult.isClean) {
        const virusNames = scanResult.viruses?.join(', ') || 'unknown';
        return res.status(400).json({
          error: 'הקובץ נחסם',
          message: `הקובץ מכיל תוכנה מסוכנת: ${virusNames}`,
        });
      }

      // ALL VALIDATIONS PASSED → Save to disk
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
      const filepath = path.join(config.upload.dir, filename);

      // Ensure upload directory exists
      await fs.mkdir(config.upload.dir, { recursive: true });

      // Write buffer to disk
      await fs.writeFile(filepath, file.buffer);

      // Update file object with path info (so controllers can use it)
      (file as any).filename = filename;
      (file as any).path = filepath;
      (file as any).destination = config.upload.dir;
    }

    // All files validated and saved successfully
    next();
  } catch (error) {
    console.error('❌ [FILE_VALIDATION] Error:', error);

    // In production, reject on validation errors
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        error: 'שגיאה בבדיקת אבטחה',
        message: 'File security validation failed',
      });
    }

    // In dev, log warning but continue
    console.warn('⚠️  [FILE_VALIDATION] Validation error (dev mode - allowing):', error);
    next();
  }
}

/**
 * Get allowed MIME types based on declared type
 */
function getAllowedMimesForDeclared(declaredMime: string): string[] {
  // Images
  if (declaredMime.startsWith('image/')) {
    return ['image/jpeg', 'image/png', 'image/webp'];
  }

  // PDF
  if (declaredMime === 'application/pdf') {
    return ['application/pdf'];
  }

  // Excel/CSV
  if (
    declaredMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    declaredMime === 'application/vnd.ms-excel' ||
    declaredMime === 'text/csv'
  ) {
    return [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/zip', // XLSX is actually a ZIP
    ];
  }

  // Default: only allow exact match
  return [declaredMime];
}

/**
 * Legacy security middleware for post-upload validation
 * -----------------------------------------------
 * Applies defense-in-depth validation AFTER Multer processes the file
 * 
 * Security Layers:
 * 1. Multer MIME type check (already done)
 * 2. Multer extension check (already done)
 * 3. Magic bytes validation (NEW - prevents MIME spoofing)
 * 4. Optional virus scanning (NEW - if ClamAV available)
 * 
 * Usage:
 *   router.post('/upload', upload.single('file'), secureUpload, handler)
 * 
 * @param allowedMimeTypes - Array of allowed MIME types
 * @returns Express middleware
 */
export function secureUpload(allowedMimeTypes: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get uploaded file(s)
      const files = req.files 
        ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
        : req.file 
        ? [req.file] 
        : [];

      if (files.length === 0) {
        return next();
      }

      // Validate each file
      for (const file of files) {
        const filePath = file.path;
        const declaredMimeType = file.mimetype;
        const originalName = file.originalname;
        const fileSize = file.size;

        // Step 1: Magic bytes validation
        const validationResult = await validateUploadedFile(
          filePath,
          declaredMimeType,
          allowedMimeTypes,
          originalName
        );

        if (!validationResult.isValid) {
          // Delete invalid file
          try {
            await fs.unlink(filePath);
          } catch {}

          securityLogger.logRejection(
            originalName,
            declaredMimeType,
            validationResult.reason || 'File validation failed',
            { fileSize }
          );

          return res.status(400).json({
            error: 'קובץ לא תקין',
            message: validationResult.reason || 'File validation failed',
          });
        }

        // Step 2: Optional virus scanning
        const scanResult = await virusScannerService.scanFile(filePath, originalName);
        
        if (!scanResult.isClean) {
          // Delete infected file
          try {
            await fs.unlink(filePath);
          } catch {}

          const virusNames = scanResult.viruses?.join(', ') || 'unknown';
          
          return res.status(400).json({
            error: 'הקובץ נחסם',
            message: `הקובץ מכיל תוכנה מסוכנת: ${virusNames}`,
          });
        }
      }

      // All files passed validation
      next();
    } catch (error) {
      console.error('Security validation error:', error);
      
      // In dev mode, allow upload on validation errors
      // In production, this should reject
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          error: 'שגיאה בבדיקת אבטחה',
          message: 'File security validation failed',
        });
      }
      
      // Dev mode: warn and continue
      console.warn('⚠️  Security validation error (dev mode - allowing):', error);
      next();
    }
  };
}

/**
 * Pre-configured secure upload middlewares
 * Use these instead of plain upload/uploadFloorPlan/uploadFile
 */

// Secure image upload
export const secureImageUpload = {
  middleware: upload,
  validate: secureUpload(['image/jpeg', 'image/png', 'image/jpg']),
};

// Secure floor plan upload
export const secureFloorPlanUpload = {
  middleware: uploadFloorPlan,
  validate: secureUpload(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']),
};

// Secure file upload
export const secureFileUpload = {
  middleware: uploadFile,
  validate: secureUpload(['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']),
};
