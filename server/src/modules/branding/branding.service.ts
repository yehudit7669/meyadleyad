import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '../../utils/errors';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { config } from '../../config';
import { AdminAuditService } from '../admin/admin-audit.service';

const prisma = new PrismaClient();

export interface BrandingConfigInput {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'center-top' | 'center-bottom';
  opacity?: number;
  sizePct?: number;
}

export class BrandingService {
  /**
   * קבלת הגדרות המיתוג הנוכחיות
   */
  async getBrandingConfig() {
    let config = await prisma.brandingConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // אם אין קונפיג, צור אחד חדש עם ברירות מחדל
    if (!config) {
      config = await prisma.brandingConfig.create({
        data: {
          id: 'default',
          logoUrl: '',
          position: 'bottom-left',
          opacity: 70,
          sizePct: 18,
        },
      });
    }

    return config;
  }

  /**
   * עדכון הגדרות המיתוג
   */
  async updateBrandingConfig(data: BrandingConfigInput, userId: string) {
    // ולידציה
    if (data.opacity !== undefined && (data.opacity < 0 || data.opacity > 100)) {
      throw new ValidationError('השקיפות חייבת להיות בין 0 ל-100');
    }

    if (data.sizePct !== undefined && (data.sizePct < 5 || data.sizePct > 30)) {
      throw new ValidationError('הגודל היחסי חייב להיות בין 5% ל-30%');
    }

    if (
      data.position &&
      !['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'center-top', 'center-bottom'].includes(data.position)
    ) {
      throw new ValidationError('מיקום לא חוקי');
    }

    // קבל את הקונפיג הנוכחי
    const currentConfig = await this.getBrandingConfig();

    // עדכן את הקונפיג
    const updated = await prisma.brandingConfig.update({
      where: { id: currentConfig.id },
      data: {
        ...data,
        updatedById: userId,
        updatedAt: new Date(),
      },
    });

    // Audit Log
    await AdminAuditService.log({
      adminId: userId,
      action: 'UPDATE_WATERMARK_SETTINGS',
      entityType: 'BrandingConfig',
      targetId: updated.id,
      meta: {
        position: updated.position,
        opacity: updated.opacity,
        sizePct: updated.sizePct,
      },
    });

    return updated;
  }

  /**
   * שמירת קובץ לוגו חדש
   */
  async saveLogo(file: Express.Multer.File, userId: string) {
    // ולידציה
    if (file.mimetype !== 'image/png') {
      throw new ValidationError('הלוגו חייב להיות בפורמט PNG');
    }

    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      throw new ValidationError('גודל הלוגו לא יכול לעלות על 1MB');
    }

    // בדיקת resolution ו-alpha channel
    const metadata = await sharp(file.path).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new ValidationError('לא ניתן לקרוא את מימדי התמונה');
    }

    if (metadata.width > 2500 || metadata.height > 2500) {
      throw new ValidationError('הלוגו לא יכול לעלות על 2500x2500 פיקסלים');
    }

    if (!metadata.hasAlpha) {
      throw new ValidationError('הלוגו חייב להיות PNG שקוף (עם ערוץ Alpha)');
    }

    // בדיקת יחס - warning בלבד, לא חסימה
    const aspectRatio = metadata.width / metadata.height;
    const warningData: any = {};
    if (aspectRatio < 0.25 || aspectRatio > 5) {
      warningData.aspectRatioWarning = `יחס התמונה (${aspectRatio.toFixed(2)}) חריג. מומלץ יחס בין 1:4 ל-4:1`;
    }

    // קבל את הקונפיג הנוכחי
    const currentConfig = await this.getBrandingConfig();

    // מחק לוגו ישן אם קיים
    if (currentConfig.logoUrl && currentConfig.logoUrl !== '') {
      try {
        const oldLogoPath = path.join(process.cwd(), 'uploads', path.basename(currentConfig.logoUrl));
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.log('Failed to delete old logo:', error);
      }
    }

    // שמור לוגו חדש
    const logoUrl = `/uploads/${file.filename}`;

    // עדכן את הקונפיג
    const updated = await prisma.brandingConfig.update({
      where: { id: currentConfig.id },
      data: {
        logoUrl,
        updatedById: userId,
        updatedAt: new Date(),
      },
    });

    // Audit Log
    await AdminAuditService.log({
      adminId: userId,
      action: 'UPLOAD_WATERMARK_LOGO',
      entityType: 'BrandingConfig',
      targetId: updated.id,
      meta: {
        filename: file.filename,
        size: file.size,
        dimensions: `${metadata.width}x${metadata.height}`,
        ...warningData,
      },
    });

    return updated;
  }

  /**
   * איפוס להגדרות ברירת מחדל (לא מוחק את הלוגו)
   */
  async resetToDefaults(userId: string) {
    const currentConfig = await this.getBrandingConfig();

    const updated = await prisma.brandingConfig.update({
      where: { id: currentConfig.id },
      data: {
        position: 'bottom-left',
        opacity: 70,
        sizePct: 18,
        updatedById: userId,
        updatedAt: new Date(),
      },
    });

    // Audit Log
    await AdminAuditService.log({
      adminId: userId,
      action: 'RESET_WATERMARK_SETTINGS',
      entityType: 'BrandingConfig',
      targetId: updated.id,
      meta: {
        position: 'bottom-left',
        opacity: 70,
        sizePct: 18,
      },
    });

    return updated;
  }
}

export const brandingService = new BrandingService();
