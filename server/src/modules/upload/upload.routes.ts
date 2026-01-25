import { Router } from 'express';
import { UploadController } from './upload.controller';
import { authenticate } from '../../middlewares/auth';
import { upload, uploadFile } from '../../middlewares/upload';

const router = Router();

/**
 * Upload Routes
 * כל ה-routes דורשים אימות
 */

// העלאת תמונה בודדת
router.post('/image', authenticate, upload.single('image'), UploadController.uploadImage);

// העלאת מספר תמונות
router.post('/images', authenticate, upload.array('images', 15), UploadController.uploadImages);

// העלאת קובץ כללי (PDF או תמונה)
router.post('/file', authenticate, uploadFile.single('file'), UploadController.uploadFile);

export default router;
