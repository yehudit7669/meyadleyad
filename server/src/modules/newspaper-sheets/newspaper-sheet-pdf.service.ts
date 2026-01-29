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
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  /**
   * Generate HTML template for the newspaper sheet
   */
  private async generateHTML(sheet: SheetWithListings): Promise<string> {
    const layoutConfig = (sheet.layoutConfig as LayoutConfig & { headerImageHeight?: number }) || {
      gridColumns: 3,
      cardPositions: [],
      headerImageHeight: 120
    };

    // טעינת תמונת כותרת (אם יש)
    let headerImageHTML = '';
    if (sheet.headerImage) {
      const headerImageBase64 = await this.imageToBase64(sheet.headerImage);
      const imageHeight = layoutConfig.headerImageHeight || 120;
      if (headerImageBase64) {
        headerImageHTML = `
          <div style="width: 100%; height: ${imageHeight * 0.265}mm; margin-top: 3mm; margin-bottom: 3mm;">
            <img src="${headerImageBase64}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
        `;
      }
    }

    // יצירת כרטיסי נכסים
    const cardsHTML = this.generatePropertyCards(sheet);
    
    // מספר גיליון ותאריך
    const issueNumber = (sheet as any).issueNumber || `גליון ${sheet.version}`;
    const issueDate = (sheet as any).issueDate || new Date().toLocaleDateString('he-IL', { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' });

    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4 portrait; margin: 0; }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Assistant", "Rubik", Arial, sans-serif;
      background: #FFFFFF;
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .newspaper-page {
      position: relative;
      width: 210mm;
      height: 297mm;
      background: #FFFFFF;
      padding: 0;
      overflow: visible;
    }

    /* ====== Header ====== */
    .newspaper-header {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-rows: auto auto auto;
      align-items: center;
      margin-bottom: 2.12mm;
      padding: 2.12mm 0;
      position: relative;
    }

    .newspaper-title {
      font-size: 11.42mm;
      font-weight: 800;
      color: #C9943D;
      margin: 4.23mm 25.38mm 0 0;
      padding: 0;
      font-family: 'Assistant', sans-serif;
      white-space: nowrap;
      grid-column: 1;
      grid-row: 1 / 4;
    }

    .header-line {
      height: 0.79mm;
      background: #C9943D;
      margin: 4.23mm 4.23mm 0 15.65mm;
      grid-column: 2 / 4;
      grid-row: 2;
      position: relative;
    }

    .issue-number {
      font-size: 3.6mm;
      font-weight: 700;
      color: #1F3F3A;
      text-align: right;
      position: absolute;
      left: 0;
      top: 0;
      white-space: nowrap;
      margin-left: 15.65mm;
      margin-top: 8.46mm;
    }

    .issue-date {
      font-size: 3.17mm;
      font-weight: 500;
      color: #1F3F3A;
      text-align: right;
      position: absolute;
      left: 0;
      bottom: 0;
      white-space: nowrap;
      margin-left: 15.65mm;
      margin-bottom: 4.23mm;
    }

    /* ====== Content Area ====== */
    .newspaper-content {
      min-height: 158.61mm;
      position: relative;
      padding-left: 9.31mm;
    }

    /* ====== Vertical Ribbon ====== */
    .newspaper-ribbon {
      position: absolute;
      left: 0;
      top: 0;
      height: 80mm;
      width: 10.58mm;
      background: #1F3F3A;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      color: #C9943D;
      font-size: 3.6mm;
      font-weight: 700;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      padding: 2.12mm 0;
      border-top-right-radius: 3.81mm;
      border-bottom-right-radius: 3.81mm;
      border-top-left-radius: 5.5mm;
      border-bottom-left-radius: 5.5mm;
      margin: 0;
    }

    /* ====== Cards Grid ====== */
    .newspaper-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4.23mm;
      padding: 0 6.35mm;
      margin-top: 3.17mm;
    }

    /* ====== Property Card ====== */
    .newspaper-property-card {
      position: relative;
      background: white;
      border: 0.79mm solid #bca5a5;
      border-radius: 1.69mm;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: visible;
      box-shadow: 0 0.53mm 1.06mm rgba(0, 0, 0, 0.05);
    }

    /* Brokerage Badge */
    .brokerage-badge {
      position: absolute;
      top: -2.12mm;
      left: 4.23mm;
      background: #1F3F3A;
      color: white;
      font-size: 2.75mm;
      font-weight: 700;
      padding: 0.63mm 2.12mm;
      border-radius: 2.12mm;
      z-index: 5;
      white-space: nowrap;
    }

    /* Card Header */
    .property-card-header {
      background: white;
      color: #1F3F3A;
      padding: 1.69mm 2.12mm 1.27mm 2.12mm;
      font-weight: 700;
      font-size: 3.6mm;
      line-height: 1.2;
      text-align: center;
      border-radius: 1.69mm 1.69mm 0 0;
    }

    .property-title {
      font-weight: 700;
      font-size: 3.6mm;
      color: #1F3F3A;
    }

    /* Card Body */
    .property-card-body {
      padding: 1.69mm 2.12mm 1.27mm 2.12mm;
      display: flex;
      flex-direction: column;
      gap: 1.06mm;
      flex: 1;
    }

    /* Meta Icons */
    .property-meta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2.12mm;
      font-size: 2.96mm;
      color: #424242;
      margin-bottom: 0.63mm;
      padding-bottom: 1.27mm;
      border-bottom: 0.53mm solid #C9943D;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.85mm;
    }

    .meta-icon {
      font-size: 3.17mm;
    }

    .meta-value {
      font-weight: 600;
    }

    /* Description */
    .property-description {
      font-size: 3.17mm;
      line-height: 1.3;
      color: #424242;
      text-align: center;
      min-height: 11mm;
      font-weight: 500;
    }

    /* Features */
    .property-features {
      font-size: 2.96mm;
      color: #616161;
      text-align: center;
      font-weight: 500;
      line-height: 1.3;
    }

    /* Price */
    .property-price {
      font-size: 4.02mm;
      font-weight: 700;
      color: #C9943D;
      text-align: left;
      margin-top: auto;
    }

    /* Contact Footer */
    .property-contact {
      background: #C9943D;
      color: white;
      padding: 1.69mm 2.12mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 3.17mm;
      font-weight: 600;
      border-radius: 1.69mm 1.69mm 0 0;
      margin-top: auto;
    }

    .contact-name {
      font-weight: 600;
    }

    .contact-phone {
      font-weight: 700;
      direction: ltr;
    }
      margin-top: auto;
    }

    .contact-name {
      font-weight: 600;
    }

    .contact-phone {
      font-weight: 700;
      direction: ltr;
    }
  </style>
</head>
<body>
  <div class="newspaper-page">
    <!-- Header -->
    <div class="newspaper-header">
      <div class="newspaper-title">${this.escapeHtml(sheet.title || 'לוח מודעות')}</div>
      <div class="header-line"></div>
      <div class="issue-number">${this.escapeHtml(issueNumber)}</div>
      <div class="issue-date">${this.escapeHtml(issueDate)}</div>
    </div>

    ${headerImageHTML}

    <!-- Content with Ribbon + Grid -->
    <div class="newspaper-content">
      <!-- Vertical Ribbon -->
      <div class="newspaper-ribbon">
        <span style="font-size: 4.5mm;">${this.escapeHtml(sheet.category.nameHe)}</span>
        <span style="margin-bottom: 2mm;">${this.escapeHtml(sheet.city.nameHe)}</span>
      </div>

      <!-- Grid -->
      <div class="newspaper-grid">
        ${cardsHTML}
      </div>
    </div>
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
        
        // בדיקה אם זה תיווך
        const isBrokerage = customFields.isBrokerage === true || customFields.brokerage === true;

        // תמונה ראשית
        const mainImage = listing.AdImage && listing.AdImage.length > 0
          ? listing.AdImage[0].url
          : '';

        // תיאור
        const description = listing.title || '';

        // כתובת - שדה ראשי בכותרת הקוביה
        const address = listing.address || 'נכס';

        // מחיר
        let priceDisplay = '';
        if (listing.price && listing.price > 0) {
          priceDisplay = `₪${listing.price.toLocaleString('he-IL')}`;
        }

        // מאפיינים - רק אלה שיש להם ערך
        const features: string[] = [];
        const featuresObj = customFields.features || {};
        
        if (featuresObj.hasOption) features.push('אופציה');
        if (featuresObj.parking) features.push('חניה');
        if (featuresObj.parentalUnit || featuresObj.masterUnit) features.push('יחידת הורים');
        if (featuresObj.storage) features.push('מחסן');
        if (featuresObj.ac || featuresObj.airConditioning) features.push('מיזוג');
        if (featuresObj.elevator) features.push('מעלית');
        if (featuresObj.balcony) features.push('מרפסת');
        if (featuresObj.safeRoom) features.push('ממ״ד');
        if (featuresObj.sukkaBalcony) features.push('מרפסת סוכה');
        if (featuresObj.view) features.push('נוף');
        if (featuresObj.yard) features.push('חצר');
        if (featuresObj.housingUnit) features.push('יח׳ דיור');

        const featuresHTML = features.length > 0 
          ? `<div class="property-features">${features.map(f => `<span>${f}</span>`).join(' ')}</div>`
          : '';

        // שם ליצירת קשר - מהמשתמש או מתווך
        const contactName = customFields.contactName || 'פרטים נוספים';
        const contactPhone = customFields.contactPhone || listing.User?.phone || '050-000-0000';

        // הסרת שם העיר מהכתובת (רק רחוב ומספר)
        const formatAddress = (fullAddress: string) => {
          if (!fullAddress) return 'נכס';
          const parts = fullAddress.split(',');
          return parts[0].trim();
        };

        return `
          <div class="newspaper-property-card">
            ${isBrokerage ? '<div class="brokerage-badge">תיווך</div>' : ''}
            
            <div class="property-card-header">
              <div class="property-title">${this.escapeHtml(formatAddress(address))}</div>
            </div>

            <div class="property-card-body">
              <div class="property-meta">
                ${size ? `
                  <div class="meta-item">
                    <span class="meta-icon">📐</span>
                    <span class="meta-value">${size}</span>
                  </div>
                ` : ''}
                ${floor ? `
                  <div class="meta-item">
                    <span class="meta-icon">🏢</span>
                    <span class="meta-value">${floor}</span>
                  </div>
                ` : ''}
                ${rooms ? `
                  <div class="meta-item">
                    <span class="meta-icon">🚪</span>
                    <span class="meta-value">${rooms}</span>
                  </div>
                ` : ''}
              </div>

              <div class="property-description">
                ${this.escapeHtml(description)}
              </div>

              ${features.length > 0 ? `
                <div class="property-features">
                  ${features.join(' · ')}
                </div>
              ` : ''}

              ${priceDisplay && listing.price ? `
                <div class="property-price">₪${listing.price.toLocaleString('he-IL')}</div>
              ` : ''}
            </div>

            <div class="property-contact">
              <div class="contact-name">${this.escapeHtml(contactName)}</div>
              <div class="contact-phone">${this.escapeHtml(contactPhone)}</div>
            </div>
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
