import puppeteer from 'puppeteer';
import { SheetWithListings, GeneralSheetOptions } from './types';
import prisma from '../../config/database';
import { NewspaperSheetStatus } from '@prisma/client';
import { brandingService } from '../branding/branding.service';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/index.js';

/**
 * Service for General Newspaper Sheet
 * לוח מודעות כללי - מאחד את כל הלוחות הקיימים
 */
export class NewspaperGeneralSheetService {
  /**
   * Generate General Newspaper PDF
   * יצירת PDF כללי של כל הנכסים באתר
   */
  async generateGeneralSheetPDF(options: GeneralSheetOptions = {}): Promise<{ pdfBuffer: Buffer; sheetsCount: number }> {
    const { orderBy = 'city' } = options;

    // שליפת כל הלוחות הפעילים
    const sheets = await this.getAllActiveSheets(orderBy);

    if (sheets.length === 0) {
      throw new Error('אין לוחות מודעות פעילים במערכת');
    }

    console.log(`📰 Generating general sheet with ${sheets.length} individual sheets`);

    // יצירת HTML מאוחד
    const html = await this.generateCombinedHTML(sheets);

    // יצירת PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--font-render-hinting=none'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

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

    console.log(`✅ General sheet PDF generated successfully`);
    return {
      pdfBuffer: Buffer.from(pdfBuffer),
      sheetsCount: sheets.length
    };
  }

  /**
   * Get all active sheets ordered by city or category
   * שליפת כל הלוחות הפעילים
   */
  private async getAllActiveSheets(orderBy: 'city' | 'category'): Promise<SheetWithListings[]> {
    const orderByClause = orderBy === 'city'
      ? [{ city: { nameHe: 'asc' as const } }, { category: { nameHe: 'asc' as const } }]
      : [{ category: { nameHe: 'asc' as const } }, { city: { nameHe: 'asc' as const } }];

    const sheets = await prisma.newspaperSheet.findMany({
      where: {
        status: NewspaperSheetStatus.ACTIVE,
        listings: {
          some: {}  // רק לוחות עם לפחות נכס אחד
        }
      },
      include: {
        category: { select: { id: true, nameHe: true } },
        city: { select: { id: true, nameHe: true } },
        creator: { select: { name: true, email: true } },
        listings: {
          orderBy: { positionIndex: 'asc' },
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                customFields: true,
                User: {
                  select: {
                    name: true,
                    email: true,
                    phone: true
                  }
                },
                AdImage: {
                  orderBy: { order: 'asc' },
                  take: 1
                }
              }
            }
          }
        },
        _count: {
          select: { listings: true }
        }
      },
      orderBy: orderByClause
    });

    return sheets as SheetWithListings[];
  }

  /**
   * Generate combined HTML for all sheets
   * יצירת HTML מאוחד לכל הלוחות
   */
  private async generateCombinedHTML(sheets: SheetWithListings[]): Promise<string> {
    // יצירת תאריך ומספר גיליון
    const issueDate = new Date().toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const issueNumber = `גיליון כללי - ${new Date().toLocaleDateString('he-IL')}`;

    // סגנונות משותפים (מהתבנית המקורית)
    const styles = await this.getSharedStyles();

    // עמוד ראשון - כותרת כללית בלבד
    const firstPageHTML = `
      <div class="newspaper-page">
        <div class="newspaper-header">
          <div class="newspaper-title">לוח מודעות כללי</div>
          <div class="header-line"></div>
          <div class="issue-number">${this.escapeHtml(issueNumber)}</div>
          <div class="issue-date">${this.escapeHtml(issueDate)}</div>
        </div>
        <div style="text-align: center; margin-top: 50mm; font-size: 8mm; color: #1F3F3A; font-weight: 700;">
          כל הנכסים באתר במסמך אחד
        </div>
        <div style="text-align: center; margin-top: 10mm; font-size: 5mm; color: #666;">
          ${sheets.length} לוחות מודעות מסודרים לפי עיר וקטגוריה
        </div>
      </div>
    `;

    // דפים נוספים - כל דף בדיוק כמו הקובץ המקורי עם כל הפרטים
    const additionalPagesHTML = sheets.map(sheet => this.generateRegularSheetPage(sheet)).join('');

    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    ${styles}
  </style>
</head>
<body>
  ${firstPageHTML}
  ${additionalPagesHTML}
</body>
</html>
    `;
  }

  /**
   * Generate HTML for a single regular sheet page (without header - only ribbon and grid)
   * יצירת HTML לדף בודד - ללא כותרת, רק סרט אנכי וגריד
   */
  private generateRegularSheetPage(sheet: SheetWithListings): string {
    // כרטיסי נכסים
    const cardsHTML = this.generatePropertyCards(sheet);

    return `
      <div class="newspaper-page">
        <!-- Content with Ribbon + Grid (ללא כותרת) -->
        <div class="newspaper-content" style="margin-top: 10mm;">
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
    `;
  }

  /**
   * Get shared CSS styles (copied exactly from newspaper-sheet-pdf.service.ts)
   * סגנונות משותפים - עותק מדויק מהתבנית המקורית
   */
  private async getSharedStyles(): Promise<string> {
    return `
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
      padding: 5mm 0 0 0;
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

    /* ====== Property Card Link ====== */
    .newspaper-property-card-link {
      text-decoration: none;
      color: inherit;
      display: block;
      transition: transform 0.2s ease;
    }

    .newspaper-property-card-link:hover {
      transform: translateY(-0.53mm);
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
      transition: box-shadow 0.2s ease;
    }

    .newspaper-property-card-link:hover .newspaper-property-card {
      box-shadow: 0 1.06mm 2.12mm rgba(0, 0, 0, 0.1);
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
    `;
  }

  /**
   * Generate HTML for property cards
   * יצירת HTML של כרטיסי נכסים
   */
  private generatePropertyCards(sheet: SheetWithListings): string {
    if (!sheet.listings || sheet.listings.length === 0) {
      return '<p style="text-align: center; grid-column: 1/-1;">אין נכסים בלוח זה</p>';
    }

    const sortedListings = [...sheet.listings].sort(
      (a, b) => a.positionIndex - b.positionIndex
    );

    return sortedListings
      .map((sheetListing) => {
        const listing = sheetListing.listing;
        const customFields = listing.customFields as any || {};

        const rooms = customFields.rooms || '';
        const size = customFields.size || '';
        const floor = customFields.floor || '';
        const isBrokerage = customFields.isBrokerage === true || customFields.brokerage === true;
        const description = listing.title || '';
        const address = listing.address || 'נכס';

        let priceDisplay = '';
        if (listing.price && listing.price > 0) {
          priceDisplay = `₪${listing.price.toLocaleString('he-IL')}`;
        }

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

        const contactName = customFields.contactName || 'פרטים נוספים';
        const contactPhone = customFields.contactPhone || listing.User?.phone || '050-000-0000';

        const formatAddress = (fullAddress: string) => {
          if (!fullAddress) return 'נכס';
          const parts = fullAddress.split(',');
          return parts[0].trim();
        };

        const adUrl = `${config.clientUrl}/ads/${listing.id}`;

        return `
          <a href="${adUrl}" class="newspaper-property-card-link" style="text-decoration: none; color: inherit; display: block;">
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
          </a>
        `;
      })
      .join('');
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

// Export singleton instance
export const newspaperGeneralSheetService = new NewspaperGeneralSheetService();
