import puppeteer from 'puppeteer';
import { SheetWithListings, GeneralSheetOptions } from './types';
import prisma from '../../config/database';
import { NewspaperSheetStatus } from '@prisma/client';
import { brandingService } from '../branding/branding.service';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/index.js';
import { calculateNewspaperLayout } from './newspaper-layout.service';
import sharp from 'sharp';

/**
 * Service for General Newspaper Sheet
 * לוח מודעות כללי - מאחד את כל הלוחות הקיימים
 */
export class NewspaperGeneralSheetService {
  /**
   * Get current global issue number
   * קבלת מספר הגליון הגלובלי הנוכחי
   */
  private async getGlobalIssueNumber(): Promise<number> {
    let settings = await prisma.newspaperGlobalSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.newspaperGlobalSettings.create({
        data: {
          currentIssue: 1
        }
      });
    }
    
    return settings.currentIssue;
  }

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
        bottom: '10mm',
        left: '0mm'
      },
      preferCSSPageSize: true
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
                neighborhood: true,
                price: true,
                customFields: true,
                Street: {
                  select: {
                    name: true
                  }
                },
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
        ads: {
          orderBy: { createdAt: 'asc' }
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
    // יצירת תאריך ומספר גיליון - שימוש במספר הגליון הגלובלי
    const globalIssueNumber = await this.getGlobalIssueNumber();
    const issueDate = new Date().toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const issueNumber = `גליון ${globalIssueNumber}`;

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
    const additionalPagesPromises = sheets.map(sheet => this.generateRegularSheetPage(sheet));
    const additionalPages = await Promise.all(additionalPagesPromises);
    const additionalPagesHTML = additionalPages.join('');

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
   * Generate HTML for a single regular sheet - split into multiple pages if needed
   * יצירת HTML לגיליון - מחולק לעמודים מרובים אם צריך
   */
  private async generateRegularSheetPage(sheet: SheetWithListings): Promise<string> {
    // Generate all cards HTML
    let allCardsHTML = '';
    if (sheet.ads && sheet.ads.length > 0) {
      allCardsHTML = await this.generateLayoutHTML(sheet);
    } else {
      allCardsHTML = this.generatePropertyCards(sheet);
    }

    // Split cards into array - match both <a> tags and <div> tags with newspaper-property-card-link
    const cardMatches = allCardsHTML.match(/(?:<a href="[^"]*" class="newspaper-property-card-link"[\s\S]*?<\/a>|<div class="newspaper-property-card-link"[\s\S]*?<\/div>\s*<\/div>)/g) || [];
    
    // Calculate cards per page: 3 columns x 4 rows = 12 cards per page
    const cardsPerPage = 12;
    const totalPages = Math.ceil(cardMatches.length / cardsPerPage);
    
    let pagesHTML = '';
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIdx = pageIndex * cardsPerPage;
      const endIdx = Math.min(startIdx + cardsPerPage, cardMatches.length);
      const pageCards = cardMatches.slice(startIdx, endIdx).join('');
      
      pagesHTML += `
      <div class="newspaper-page newspaper-page-content">
        <!-- Content with Ribbon + Grid (ללא כותרת) -->
        <div class="newspaper-content">
          <!-- Vertical Ribbon -->
          <div class="newspaper-ribbon">
            <span style="font-size: 4.5mm;">${this.escapeHtml(sheet.category.nameHe)}</span>
            <span style="margin-bottom: 2mm;">${this.escapeHtml(sheet.city.nameHe)}</span>
          </div>

          <!-- Grid -->
          <div class="newspaper-grid">
            ${pageCards}
          </div>
        </div>
      </div>
      `;
    }

    // מוסיף page break אחרי הלוח השלם
    pagesHTML += '<div style="page-break-after: always;"></div>';

    return pagesHTML;
  }

  /**
   * Get shared CSS styles (copied exactly from newspaper-sheet-pdf.service.ts)
   * סגנונות משותפים - עותק מדויק מהתבנית המקורית
   */
  private async getSharedStyles(): Promise<string> {
    return `
    @page { 
      size: A4 portrait; 
      margin: 0;
    }
    
    @page :first {
      margin: 0;
    }
    
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

    /* מניעת פיצול כרטיסים */
    .newspaper-property-card,
    .newspaper-property-card-link {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .newspaper-page {
      position: relative;
      width: 210mm;
      height: 297mm;
      background: #FFFFFF;
      padding: 0 0 10mm 0;
      overflow: visible;
    }

    /* עמודי תוכן (לא העמוד הראשון) - עם מרווח עליון קבוע */
    .newspaper-page-content {
      padding: 10mm 0 10mm 0;
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
      display: flex;
      flex-wrap: wrap;
      gap: 4.23mm;
      padding: 0 6.35mm;
      margin-top: 3.17mm;
    }

    /* ====== Property Card Link ====== */
    .newspaper-property-card-link {
      width: calc(33.333% - 2.82mm);
      flex-shrink: 0;
      text-decoration: none;
      color: inherit;
      display: block;
      transition: transform 0.2s ease;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      height: 53mm;
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
        if (featuresObj.garden) features.push('גינה');
        if (featuresObj.frontFacing) features.push('חזית');
        if (featuresObj.upgradedKitchen) features.push('מטבח משודרג');
        if (featuresObj.accessibleForDisabled) features.push('נגישה לנכים');
        if (featuresObj.housingUnit) features.push('יח׳ דיור');
        if (featuresObj.gallery) features.push('גלריה');
        if (featuresObj.kitchenette) features.push('מטבחון');
        if (featuresObj.toilets) features.push('שירותים');
        if (featuresObj.storefront) features.push('חלון ראווה');
        if (featuresObj.internet) features.push('אינטרנט');
        if (featuresObj.upgraded) features.push('מושפץ');

        const contactName = customFields.contactName || 'פרטים נוספים';
        const contactPhone = customFields.contactPhone || listing.User?.phone || '050-000-0000';

        // בניית כתובת מרחוב ושכונה
        const formatAddress = (): string => {
          const streetName = (listing as any).Street?.name;
          const neighborhood = (listing as any).neighborhood;
          const houseNumber = customFields.houseNumber;
          
          if (streetName) {
            // יש רחוב - נציג רחוב + מספר בית + שכונה
            let address = streetName;
            if (houseNumber) {
              address += ` ${houseNumber}`;
            }
            if (neighborhood) {
              address += `, ${neighborhood}`;
            }
            return address;
          } else if (neighborhood) {
            // אין רחוב אבל יש שכונה - נציג רק שכונה
            return neighborhood;
          }
          
          return 'נכס';
        };

        const adUrl = `${config.clientUrl}/ads/${listing.id}`;

        return `
          <a href="${adUrl}" class="newspaper-property-card-link" style="text-decoration: none; color: inherit; display: block;">
            <div class="newspaper-property-card">
              ${isBrokerage ? '<div class="brokerage-badge">תיווך</div>' : ''}
              
              <div class="property-card-header">
                <div class="property-title">${this.escapeHtml(formatAddress())}</div>
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
   * Generate HTML from calculated layout (with ads)
   */
  private async generateLayoutHTML(sheet: SheetWithListings): Promise<string> {
    const listings = sheet.listings
      .sort((a, b) => a.positionIndex - b.positionIndex)
      .map(l => ({
        ...l.listing,
        id: l.listingId
      }));

    const ads = (sheet.ads || []).map(ad => ({
      id: ad.id,
      imageUrl: ad.imageUrl,
      size: ad.size as '1x1' | '2x1' | '3x1' | '2x2',
      anchorType: ad.anchorType as 'beforeIndex' | 'pagePosition',
      beforeListingId: ad.beforeListingId ?? undefined,
      page: ad.page ?? undefined,
      row: ad.row ?? undefined,
      col: ad.col ?? undefined
    }));

    const layout = calculateNewspaperLayout(listings, ads);
    
    let html = '';
    
    // Flatten all items from all pages
    const allItems: any[] = [];
    for (const page of layout.pages) {
      for (const row of page.rows) {
        for (const item of row) {
          if (item.type === 'listing' || (item.type === 'ad' && !item.data?.isOccupied)) {
            allItems.push(item);
          }
        }
      }
    }
    
    // Generate HTML for each item
    for (const item of allItems) {
      if (item.type === 'listing') {
        const sheetListing = sheet.listings.find(l => l.listingId === item.id);
        if (!sheetListing) continue;
        
        const listing = sheetListing.listing;
        const customFields = listing.customFields || {};
        const rooms = customFields.rooms || '';
        const size = customFields.size || '';
        const floor = customFields.floor || '';
        const isBrokerage = customFields.isBrokerage === true || customFields.brokerage === true;
        const description = listing.title || '';
        const address = listing.address || 'נכס';
        const priceDisplay = listing.price && listing.price > 0 ? `₪${listing.price.toLocaleString('he-IL')}` : '';

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

        // בניית כתובת מרחוב ושכונה
        const formatAddress = (): string => {
          const streetName = (listing as any).Street?.name;
          const neighborhood = (listing as any).neighborhood;
          const houseNumber = customFields.houseNumber;
          
          if (streetName) {
            // יש רחוב - נציג רחוב + מספר בית + שכונה
            let address = streetName;
            if (houseNumber) {
              address += ` ${houseNumber}`;
            }
            if (neighborhood) {
              address += `, ${neighborhood}`;
            }
            return address;
          } else if (neighborhood) {
            // אין רחוב אבל יש שכונה - נציג רק שכונה
            return neighborhood;
          }
          
          return 'נכס';
        };

        const adUrl = `${config.clientUrl}/ads/${listing.id}`;

        html += `
          <a href="${adUrl}" class="newspaper-property-card-link" style="text-decoration: none; color: inherit; display: block;">
            <div class="newspaper-property-card">
              ${isBrokerage ? '<div class="brokerage-badge">תיווך</div>' : ''}
              
              <div class="property-card-header">
                <div class="property-title">${this.escapeHtml(formatAddress())}</div>
              </div>

              <div class="property-card-body">
                <div class="property-meta">
                  ${size ? `<div class="meta-item"><span class="meta-icon">📐</span><span class="meta-value">${size}</span></div>` : ''}
                  ${floor ? `<div class="meta-item"><span class="meta-icon">🏢</span><span class="meta-value">${floor}</span></div>` : ''}
                  ${rooms ? `<div class="meta-item"><span class="meta-icon">🚪</span><span class="meta-value">${rooms}</span></div>` : ''}
                </div>

                <div class="property-description">${this.escapeHtml(description)}</div>

                ${features.length > 0 ? `<div class="property-features">${features.join(' · ')}</div>` : ''}

                ${priceDisplay && listing.price ? `<div class="property-price">₪${listing.price.toLocaleString('he-IL')}</div>` : ''}
              </div>

              <div class="property-contact">
                <div class="contact-name">${this.escapeHtml(contactName)}</div>
                <div class="contact-phone">${this.escapeHtml(contactPhone)}</div>
              </div>
            </div>
          </a>
        `;
      } else if (item.type === 'ad') {
        const colspan = item.colspan || 1;
        const adImageBase64 = await this.imageToBase64(item.data.imageUrl);
        
        html += `
          <div class="newspaper-property-card-link" style="width: calc(${colspan * 33.333}% - ${(3 - colspan) * 0.94}mm);">
            <div class="newspaper-property-card" style="overflow: hidden;">
              <img src="${adImageBase64}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
            </div>
          </div>
        `;
      }
    }
    
    return html;
  }

  /**
   * Convert image URL to base64
   */
  private async imageToBase64(imageUrl: string | null): Promise<string | null> {
    if (!imageUrl) return null;

    try {
      let imagePath: string;

      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.error(`Failed to fetch image: ${imageUrl}`);
          return null;
        }
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        return `data:${contentType};base64,${base64}`;
      } else {
        imagePath = path.join(process.cwd(), 'uploads', imageUrl.replace(/^\/uploads\//, ''));
        
        const imageBuffer = await fs.readFile(imagePath);
        const processedBuffer = await sharp(imageBuffer)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        const base64 = processedBuffer.toString('base64');
        return `data:image/jpeg;base64,${base64}`;
      }
    } catch (error) {
      console.error(`Error converting image to base64:`, error);
      return null;
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

// Export singleton instance
export const newspaperGeneralSheetService = new NewspaperGeneralSheetService();
