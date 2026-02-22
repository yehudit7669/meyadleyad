import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';

/**
 * Upload Controller
 * מטפל בהעלאת קבצים (תמונות)
 */
export class UploadController {
  /**
   * POST /api/upload/image
   * העלאת תמונה בודדת
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'לא הועלתה תמונה' });
        return;
      }

      // החזרת URL של התמונה
      const imageUrl = `/api/uploads/${req.file.filename}`;
      
      res.json({
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/upload/images
   * העלאת מספר תמונות
   */
  static async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ error: 'לא הועלו תמונות' });
        return;
      }

      const uploadedImages = (req.files as Express.Multer.File[]).map(file => ({
        url: `/api/uploads/${file.filename}`,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      }));

      res.json({
        images: uploadedImages,
        count: uploadedImages.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/upload/file
   * העלאת קובץ כללי (PDF, תמונה)
   */
  static async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'לא הועלה קובץ' });
        return;
      }

      // החזרת URL של הקובץ
      const fileUrl = `${config.appUrl}/api/uploads/${req.file.filename}`;
      
      res.json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      next(error);
    }
  }
}
