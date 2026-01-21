import puppeteer from 'puppeteer';
import { SheetWithListings, LayoutConfig } from './types';
import { brandingService } from '../branding/branding.service';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * PDF Service for Newspaper Sheets
 * יצירת PDF לגיליון עיתון שלם (קטגוריה + עיר)
 */
export class NewspaperSheetPDFService {
  /**
   * Generate PDF for complete newspaper sheet
   * רינדור תבנית עיתון מלאה עם כותרת, banner וגריד של כרטיסי נכסים
   */
  async generateSheetPDF(sheet: SheetWithListings): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    // טעינת תבנית HTML
    const html = await this.generateHTML(sheet);

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // יצירת PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  /**
   * Generate HTML template for the newspaper sheet
   */
  private async generateHTML(sheet: SheetWithListings): Promise<string> {
    const layoutConfig = (sheet.layoutConfig as LayoutConfig) || {
      gridColumns: 3,
      cardPositions: []
    };

    // טעינת תמונת כותרת (אם יש)
    let headerImageBase64 = '';
    if (sheet.headerImage) {
      headerImageBase64 = await this.imageToBase64(sheet.headerImage);
    }

    // יצירת כרטיסי נכסים
    const cardsHTML = this.generatePropertyCards(sheet);

    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', 'Segoe UI', 'Helvetica', sans-serif;
      background: white;
      padding: 20px;
      direction: rtl;
    }

    .newspaper-header {
      text-align: center;
      border-bottom: 4px solid #333;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }

    .newspaper-title {
      font-size: 42px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .newspaper-subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 15px;
    }

    .header-banner {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
      margin-top: 15px;
    }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(${layoutConfig.gridColumns}, 1fr);
      gap: 15px;
      margin-top: 25px;
    }

    .property-card {
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: #fafafa;
      break-inside: avoid;
    }

    .property-card img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 6px;
      margin-bottom: 10px;
    }

    .property-title {
      font-size: 18px;
      font-weight: bold;
      color: #222;
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .property-details {
      font-size: 14px;
      color: #555;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .property-price {
      font-size: 22px;
      font-weight: bold;
      color: #d32f2f;
      margin-top: 8px;
      text-align: center;
      background: #fff3e0;
      padding: 8px;
      border-radius: 4px;
    }

    .property-description {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
      margin-top: 8px;
      max-height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 2px solid #ddd;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="newspaper-header">
    <div class="newspaper-title">${this.escapeHtml(sheet.title)}</div>
    <div class="newspaper-subtitle">
      ${this.escapeHtml(sheet.category.nameHe)} | ${this.escapeHtml(sheet.city.nameHe)}
    </div>
    ${headerImageBase64 ? `<img src="${headerImageBase64}" alt="כותרת" class="header-banner" />` : ''}
  </div>

  <div class="properties-grid">
    ${cardsHTML}
  </div>

  <div class="footer">
    גרסה ${sheet.version} | ${new Date().toLocaleDateString('he-IL')}
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML for property cards
   */
  private generatePropertyCards(sheet: SheetWithListings): string {
    console.log(`📊 Generating cards for ${sheet.listings?.length || 0} listings`);
    
    if (!sheet.listings || sheet.listings.length === 0) {
      return '<p style="text-align: center; grid-column: 1/-1;">אין נכסים בגיליון זה</p>';
    }

    // מיון לפי positionIndex
    const sortedListings = [...sheet.listings].sort(
      (a, b) => a.positionIndex - b.positionIndex
    );

    console.log(`📋 Sorted listings:`, sortedListings.map(l => ({ 
      id: l.id, 
      listingId: l.listingId, 
      title: l.listing.title,
      positionIndex: l.positionIndex 
    })));

    return sortedListings
      .map((sheetListing) => {
        const listing = sheetListing.listing;
        const customFields = listing.customFields as any || {};

        // שדות מותאמים
        const rooms = customFields.rooms || '';
        const size = customFields.size || '';
        const floor = customFields.floor || '';

        // תמונה ראשית
        const mainImage = listing.AdImage && listing.AdImage.length > 0
          ? listing.AdImage[0].url
          : '';

        // תיאור קצר
        const description = listing.title || '';

        // כתובת
        const address = listing.address || '';

        // מחיר
        let priceDisplay = '';
        if (listing.price && listing.price > 0) {
          priceDisplay = `₪${listing.price.toLocaleString('he-IL')}`;
        }

        return `
          <div class="property-card">
            ${mainImage ? `<img src="${mainImage}" alt="${this.escapeHtml(description)}" />` : ''}
            <div class="property-title">${this.escapeHtml(address)}</div>
            <div class="property-details">
              ${rooms ? `<span>${rooms} חדרים</span>` : ''}
              ${size ? `<span>${size} מ"ר</span>` : ''}
            </div>
            ${floor ? `<div class="property-details"><span>קומה ${floor}</span></div>` : ''}
            <div class="property-description">${this.escapeHtml(description)}</div>
            ${priceDisplay ? `<div class="property-price">${priceDisplay}</div>` : ''}
          </div>
        `;
      })
      .join('');
  }

  /**
   * Convert image to base64
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    try {
      // נניח שזה קובץ מקומי
      if (imageUrl.startsWith('/uploads/')) {
        const relativePath = imageUrl.substring(1);
        const filePath = path.join(process.cwd(), relativePath);

        try {
          await fs.access(filePath);
          const buffer = await fs.readFile(filePath);
          const resized = await sharp(buffer)
            .resize(1200, 300, { fit: 'cover', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
          return `data:image/jpeg;base64,${resized.toString('base64')}`;
        } catch {
          return '';
        }
      }

      return '';
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      return '';
    }
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
