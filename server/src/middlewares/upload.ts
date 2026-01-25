import multer from 'multer';
import path from 'path';
import { config } from '../config';
import { ValidationError } from '../utils/errors';

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, config.upload.dir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`סוג קובץ לא תקין. מותר רק: JPG, JPEG, PNG`));
  }
};

const floorPlanFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`סוג קובץ לא תקין. מותר: JPG, JPEG, PNG, PDF`));
  }
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
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('סוג קובץ לא תקין. מותר: PDF, JPG, JPEG, PNG'));
  }
};

// File upload (PDF or image, up to 20MB)
export const uploadFile = multer({
  storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});
