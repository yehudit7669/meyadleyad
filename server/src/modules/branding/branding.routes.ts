import { Router } from 'express';
import { brandingController } from './branding.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import multer from 'multer';
import path from 'path';
import { config } from '../../config';
import { ValidationError } from '../../utils/errors';

const router = Router();

// מיני-middleware להעלאת לוגו (PNG בלבד, עד 1MB)
const logoStorage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, config.upload.dir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const logoFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new ValidationError('הלוגו חייב להיות בפורמט PNG'));
  }
};

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: logoFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
  },
});

// כל הנתיבים דורשים אימות ו-ADMIN
router.use(authenticate);
router.use(authorize('ADMIN'));

// נתיבים
router.get('/', brandingController.getBranding);
router.patch('/', brandingController.updateBranding);
router.post('/logo', uploadLogo.single('logo'), brandingController.uploadLogo);
router.post('/preview', brandingController.generatePreview);
router.post('/reset', brandingController.resetToDefaults);

export default router;
