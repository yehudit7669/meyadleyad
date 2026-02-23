import { Request, Response, NextFunction } from 'express';
import { brandingService } from './branding.service';
import { watermarkService } from './watermark.service';
import { AuthRequest } from '../../middlewares/auth';
import { z } from 'zod';
import { ValidationError } from '../../utils/errors';
import path from 'path';
import fs from 'fs/promises';
import { AdminAuditService } from '../admin/admin-audit.service';

// Zod schemas
const brandingUpdateSchema = z.object({
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'center-top', 'center-bottom']).optional(),
  opacity: z.number().min(0).max(100).optional(),
  sizePct: z.number().min(5).max(30).optional(),
});

export class BrandingController {
  /**
   * GET /api/admin/branding
   * קבלת הגדרות המיתוג הנוכחיות
   */
  async getBranding(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const config = await brandingService.getBrandingConfig();
      
      // Audit Log - כניסה למסך
      await AdminAuditService.log({
        adminId: req.user!.id,
        action: 'VIEW_BRANDING_SETTINGS',
        entityType: 'BrandingConfig',
        targetId: config.id,
        ip: req.ip,
      });

      res.json({
        status: 'success',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/branding
   * עדכון הגדרות המיתוג
   */
  async updateBranding(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // ולידציה
      const validatedData = brandingUpdateSchema.parse(req.body);

      const updated = await brandingService.updateBrandingConfig(
        validatedData,
        req.user!.id
      );

      res.json({
        status: 'success',
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('נתונים לא תקינים: ' + error.errors.map(e => e.message).join(', ')));
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/admin/branding/logo
   * העלאת לוגו חדש
   */
  async uploadLogo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;

      if (!file) {
        throw new ValidationError('לא הועלה קובץ');
      }

      const updated = await brandingService.saveLogo(file, req.user!.id);

      res.json({
        status: 'success',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/branding/preview
   * יצירת תצוגה מקדימה
   */
  async generatePreview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { position, opacity, sizePct, sampleImageData } = req.body;

      // ולידציה
      if (!position || opacity === undefined || sizePct === undefined) {
        throw new ValidationError('חסרים פרמטרים נדרשים');
      }

      if (!sampleImageData) {
        throw new ValidationError('יש להעלות תמונת דוגמה לתצוגה מקדימה');
      }

      // קבל את הקונפיג הנוכחי
      const config = await brandingService.getBrandingConfig();

      if (!config.logoUrl || config.logoUrl === '') {
        throw new ValidationError('לא הועלה לוגו');
      }

      // בנה נתיב ללוגו
      const logoPath = path.join(process.cwd(), 'uploads', path.basename(config.logoUrl));

      // בדוק שהלוגו קיים
      try {
        await fs.access(logoPath);
      } catch {
        throw new ValidationError('קובץ לוגו לא נמצא');
      }

      // המר base64 ל-buffer
      const base64Data = sampleImageData.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // כתוב את התמונה לקובץ זמני
      const tempImagePath = path.join(process.cwd(), 'uploads', `temp-preview-${Date.now()}.jpg`);
      await fs.writeFile(tempImagePath, imageBuffer);

      try {
        // צור preview
        const previewBuffer = await watermarkService.generatePreview(
          tempImagePath,
          logoPath,
          {
            position,
            opacity,
            sizePct,
          }
        );

        // מחק את הקובץ הזמני
        await fs.unlink(tempImagePath);

        // שלח כ-base64
        const base64 = previewBuffer.toString('base64');
        res.json({
          status: 'success',
          data: {
            preview: `data:image/jpeg;base64,${base64}`,
          },
        });
      } catch (error) {
        // מחק את הקובץ הזמני במקרה של שגיאה
        try {
          await fs.unlink(tempImagePath);
        } catch {}
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/branding/reset
   * איפוס להגדרות ברירת מחדל
   */
  async resetToDefaults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await brandingService.resetToDefaults(req.user!.id);

      res.json({
        status: 'success',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandingController = new BrandingController();
