import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '../../utils/errors';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../../config';

const prisma = new PrismaClient();

export interface BrandingConfigInput {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
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
      !['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(data.position)
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

    return updated;
  }
}

export const brandingService = new BrandingService();
