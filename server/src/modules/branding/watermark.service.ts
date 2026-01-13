import sharp from 'sharp';
import { PDFDocument, rgb } from 'pdf-lib';
import path from 'path';
import fs from 'fs/promises';
import { brandingService } from '../branding/branding.service';

export interface WatermarkOptions {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number; // 0-100
  sizePct: number; // 5-30
}

export class WatermarkService {
  /**
   * הוספת watermark לתמונה
   */
  async applyWatermarkToImage(
    imagePath: string,
    logoPath: string,
    options: WatermarkOptions
  ): Promise<string> {
    try {
      // טען את התמונה המקורית
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Failed to get image dimensions');
      }

      // טען את הלוגו
      const logo = sharp(logoPath);
      const logoMetadata = await logo.metadata();

      if (!logoMetadata.width || !logoMetadata.height) {
        throw new Error('Failed to get logo dimensions');
      }

      // חשב את גודל הלוגו
      const logoWidth = Math.floor((metadata.width * options.sizePct) / 100);
      const logoHeight = Math.floor(
        (logoMetadata.height / logoMetadata.width) * logoWidth
      );

      // וודא שהלוגו לא קטן מדי
      const minLogoSize = 64;
      const finalLogoWidth = Math.max(logoWidth, minLogoSize);
      const finalLogoHeight = Math.floor(
        (logoMetadata.height / logoMetadata.width) * finalLogoWidth
      );

      // שנה גודל והוסף שקיפות ללוגו
      const resizedLogo = await logo
        .resize(finalLogoWidth, finalLogoHeight, { fit: 'contain' })
        .ensureAlpha()
        .composite([
          {
            input: Buffer.from([255, 255, 255, Math.floor((options.opacity / 100) * 255)]),
            raw: {
              width: 1,
              height: 1,
              channels: 4,
            },
            tile: true,
            blend: 'dest-in',
          },
        ])
        .toBuffer();

      // חשב מיקום
      const margin = 16;
      let left = margin;
      let top = margin;

      switch (options.position) {
        case 'top-left':
          left = margin;
          top = margin;
          break;
        case 'top-right':
          left = metadata.width - finalLogoWidth - margin;
          top = margin;
          break;
        case 'bottom-left':
          left = margin;
          top = metadata.height - finalLogoHeight - margin;
          break;
        case 'bottom-right':
          left = metadata.width - finalLogoWidth - margin;
          top = metadata.height - finalLogoHeight - margin;
          break;
      }

      // יצירת הנתיב לקובץ הממותג
      const dir = path.dirname(imagePath);
      const ext = path.extname(imagePath);
      const basename = path.basename(imagePath, ext);
      const brandedPath = path.join(dir, 'branded', `${basename}${ext}`);

      // וודא שהתיקייה קיימת
      await fs.mkdir(path.join(dir, 'branded'), { recursive: true });

      // הוסף את הלוגו לתמונה
      await image
        .composite([
          {
            input: resizedLogo,
            top: Math.floor(top),
            left: Math.floor(left),
          },
        ])
        .toFile(brandedPath);

      return brandedPath;
    } catch (error) {
      console.error('Error applying watermark to image:', error);
      throw error;
    }
  }

  /**
   * הוספת watermark ל-PDF
   */
  async applyWatermarkToPDF(
    pdfPath: string,
    logoPath: string,
    options: WatermarkOptions
  ): Promise<string> {
    try {
      // טען את ה-PDF
      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // טען את הלוגו
      const logoBytes = await fs.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);

      const pages = pdfDoc.getPages();

      // הוסף את הלוגו לכל עמוד
      for (const page of pages) {
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // חשב גודל הלוגו
        const logoWidth = (pageWidth * options.sizePct) / 100;
        const logoHeight =
          (logoImage.height / logoImage.width) * logoWidth;

        // וודא שהלוגו לא קטן מדי
        const minLogoSize = 64;
        const finalLogoWidth = Math.max(logoWidth, minLogoSize);
        const finalLogoHeight =
          (logoImage.height / logoImage.width) * finalLogoWidth;

        // חשב מיקום
        const margin = 16;
        let x = margin;
        let y = margin;

        switch (options.position) {
          case 'top-left':
            x = margin;
            y = pageHeight - finalLogoHeight - margin;
            break;
          case 'top-right':
            x = pageWidth - finalLogoWidth - margin;
            y = pageHeight - finalLogoHeight - margin;
            break;
          case 'bottom-left':
            x = margin;
            y = margin;
            break;
          case 'bottom-right':
            x = pageWidth - finalLogoWidth - margin;
            y = margin;
            break;
        }

        // הוסף את הלוגו לעמוד עם שקיפות
        page.drawImage(logoImage, {
          x,
          y,
          width: finalLogoWidth,
          height: finalLogoHeight,
          opacity: options.opacity / 100,
        });
      }

      // שמור את ה-PDF החדש
      const dir = path.dirname(pdfPath);
      const ext = path.extname(pdfPath);
      const basename = path.basename(pdfPath, ext);
      const brandedPath = path.join(dir, 'branded', `${basename}${ext}`);

      // וודא שהתיקייה קיימת
      await fs.mkdir(path.join(dir, 'branded'), { recursive: true });

      const modifiedPdfBytes = await pdfDoc.save();
      await fs.writeFile(brandedPath, modifiedPdfBytes);

      return brandedPath;
    } catch (error) {
      console.error('Error applying watermark to PDF:', error);
      throw error;
    }
  }

  /**
   * הוספת watermark לקובץ (תמונה או PDF)
   */
  async applyWatermark(
    filePath: string,
    mimetype: string
  ): Promise<{ originalPath: string; brandedPath: string | null }> {
    try {
      // קבל את הגדרות המיתוג
      const config = await brandingService.getBrandingConfig();

      // אם אין לוגו, החזר את הקובץ המקורי בלבד
      if (!config.logoUrl || config.logoUrl === '') {
        console.log('No logo configured, skipping watermark');
        return {
          originalPath: filePath,
          brandedPath: null,
        };
      }

      // בנה את הנתיב המלא ללוגו
      const logoPath = path.join(process.cwd(), 'uploads', path.basename(config.logoUrl));

      // בדוק שהלוגו קיים
      try {
        await fs.access(logoPath);
      } catch {
        console.log('Logo file not found:', logoPath);
        return {
          originalPath: filePath,
          brandedPath: null,
        };
      }

      const options: WatermarkOptions = {
        position: config.position as any,
        opacity: config.opacity,
        sizePct: config.sizePct,
      };

      let brandedPath: string;

      // בחר שיטת עיבוד לפי סוג הקובץ
      if (mimetype === 'application/pdf') {
        brandedPath = await this.applyWatermarkToPDF(filePath, logoPath, options);
      } else if (
        mimetype === 'image/jpeg' ||
        mimetype === 'image/jpg' ||
        mimetype === 'image/png'
      ) {
        brandedPath = await this.applyWatermarkToImage(filePath, logoPath, options);
      } else {
        // סוג קובץ לא נתמך
        return {
          originalPath: filePath,
          brandedPath: null,
        };
      }

      console.log('Watermark applied successfully:', brandedPath);

      return {
        originalPath: filePath,
        brandedPath,
      };
    } catch (error) {
      console.error('Error in applyWatermark:', error);
      // במקרה של שגיאה, החזר את הקובץ המקורי
      return {
        originalPath: filePath,
        brandedPath: null,
      };
    }
  }

  /**
   * יצירת preview של תמונה עם watermark
   */
  async generatePreview(
    sampleImagePath: string,
    logoPath: string,
    options: WatermarkOptions
  ): Promise<Buffer> {
    try {
      // טען את התמונה המקורית
      const image = sharp(sampleImagePath);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Failed to get image dimensions');
      }

      // טען את הלוגו
      const logo = sharp(logoPath);
      const logoMetadata = await logo.metadata();

      if (!logoMetadata.width || !logoMetadata.height) {
        throw new Error('Failed to get logo dimensions');
      }

      // חשב את גודל הלוגו
      const logoWidth = Math.floor((metadata.width * options.sizePct) / 100);
      const logoHeight = Math.floor(
        (logoMetadata.height / logoMetadata.width) * logoWidth
      );

      // וודא שהלוגו לא קטן מדי
      const minLogoSize = 64;
      const finalLogoWidth = Math.max(logoWidth, minLogoSize);
      const finalLogoHeight = Math.floor(
        (logoMetadata.height / logoMetadata.width) * finalLogoWidth
      );

      // שנה גודל והוסף שקיפות ללוגו
      const resizedLogo = await logo
        .resize(finalLogoWidth, finalLogoHeight, { fit: 'contain' })
        .ensureAlpha()
        .composite([
          {
            input: Buffer.from([255, 255, 255, Math.floor((options.opacity / 100) * 255)]),
            raw: {
              width: 1,
              height: 1,
              channels: 4,
            },
            tile: true,
            blend: 'dest-in',
          },
        ])
        .toBuffer();

      // חשב מיקום
      const margin = 16;
      let left = margin;
      let top = margin;

      switch (options.position) {
        case 'top-left':
          left = margin;
          top = margin;
          break;
        case 'top-right':
          left = metadata.width - finalLogoWidth - margin;
          top = margin;
          break;
        case 'bottom-left':
          left = margin;
          top = metadata.height - finalLogoHeight - margin;
          break;
        case 'bottom-right':
          left = metadata.width - finalLogoWidth - margin;
          top = metadata.height - finalLogoHeight - margin;
          break;
      }

      // הוסף את הלוגו לתמונה והחזר כ-Buffer
      const result = await image
        .composite([
          {
            input: resizedLogo,
            top: Math.floor(top),
            left: Math.floor(left),
          },
        ])
        .jpeg()
        .toBuffer();

      return result;
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  }
}

export const watermarkService = new WatermarkService();
