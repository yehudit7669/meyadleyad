import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { BackupController } from './backup.controller';
import { authenticate } from '../../../middlewares/auth';
import { requireRole } from '../../../middleware/rbac.middleware';

const router = Router();

// Configure multer for file upload (restore)
const upload = multer({
  dest: path.join(process.cwd(), 'temp_restore'),
  limits: {
    fileSize: 1024 * 1024 * 1024 * 5 // 5GB max
  },
  fileFilter: (req, file, cb) => {
    // Only accept .zip files
    if (path.extname(file.originalname).toLowerCase() === '.zip') {
      cb(null, true);
    } else {
      cb(new Error('רק קבצי .zip מותרים'));
    }
  }
});

/**
 * POST /api/admin/backups/create
 * Create encrypted backup
 * 
 * RBAC: SUPER_ADMIN only
 * 
 * Body:
 * - password: string (min 12 chars)
 * 
 * Returns: Encrypted zip file download
 */
router.post(
  '/create',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  BackupController.createBackup
);

/**
 * POST /api/admin/backups/restore
 * Restore from encrypted backup
 * 
 * RBAC: SUPER_ADMIN only
 * 
 * Body (multipart/form-data):
 * - backupFile: File (.zip)
 * - password: string
 * 
 * WARNING: This will overwrite all existing data!
 */
router.post(
  '/restore',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  upload.single('backupFile'),
  BackupController.restoreBackup
);

export default router;
