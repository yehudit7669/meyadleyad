import puppeteer from 'puppeteer';
import { SheetWithListings, LayoutConfig } from './types';
import { brandingService } from '../branding/branding.service';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/index.js';
import prisma from '../../config/database';
import { calculateNewspaperLayout } from './newspaper-layout.service';

/**
 * PDF Service for Newspaper Sheets
 * יצירת PDF לגיליון עיתון שלם (קטגוריה + עיר)
 */
export class NewspaperSheetPDFService {
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
   * Generate PDF for complete newspaper sheet
   * רינדור תבנית עיתון מלאה עם כותרת, banner וגריד של כרטיסי נכסים
   */
  async generateSheetPDF(sheet: SheetWithListings): Promise<Buffer> {
    // Debug logging for Render production
    console.log('🚀 Puppeteer Debug Info:');
    console.log('- Puppeteer version:', require('puppeteer/package.json').version);
    console.log('- PUPPETEER_CACHE_DIR:', process.env.PUPPETEER_CACHE_DIR);
    console.log('- PUPPETEER_SKIP_DOWNLOAD:', process.env.PUPPETEER_SKIP_DOWNLOAD);
    console.log('- PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:', process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD);
    
    // Check if cache directory exists
    const cacheDir = process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer';
    try {
      const stat = await fs.stat(cacheDir);
      console.log(`- Cache directory exists: ${cacheDir} (${stat.isDirectory() ? 'directory' : 'file'})`);
      const files = await fs.readdir(cacheDir);
      console.log(`- Files in cache:`, files);
    } catch (err) {
      console.log(`- Cache directory does NOT exist: ${cacheDir}`);
    }

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
        bottom: '10mm',
        left: '0mm'
      },
      preferCSSPageSize: true
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

    // Calculate layout if there are ads
    let cardsHTML = '';
    if (sheet.ads && sheet.ads.length > 0) {
      // Use layout algorithm
      const listings = sheet.listings
        .sort((a, b) => a.positionIndex - b.positionIndex)
        .map(l => ({
          ...l.listing,
          id: l.listingId
        }));

      const ads = sheet.ads.map(ad => ({
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
      cardsHTML = await this.generateLayoutHTML(layout, sheet);
    } else {
      // No ads - use simple card generation
      cardsHTML = this.generatePropertyCards(sheet);
    }
    
    // מספר גיליון ותאריך - שימוש במספר הגליון הגלובלי
    const globalIssueNumber = await this.getGlobalIssueNumber();
    const issueNumber = (sheet as any).issueNumber || `גליון ${globalIssueNumber}`;
    const issueDate = (sheet as any).issueDate || new Date().toLocaleDateString('he-IL', { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' });

    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    @page { 
      size: A4 portrait; 
      margin: 0; 
      margin-top: 10mm;
    }
    
    @page :first {
      margin-top: 0;
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

    /* מניעת פיצול כרטיסים וקבוצות שורות */
    .newspaper-property-card,
    .newspaper-property-card-link,
    .grid-row-wrapper {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* מניעת פיצול לפני ואחרי שורה */
    .grid-row-wrapper {
      page-break-before: auto;
      page-break-after: auto;
      display: contents;
    }

    .newspaper-page {
      position: relative;
      width: 210mm;
      height: 297mm;
      background: #FFFFFF;
      padding: 0;
      padding-bottom: 10mm;
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
      page-break-inside: avoid;
      break-inside: avoid;
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
        if (featuresObj.garden) features.push('גינה');
        if (featuresObj.frontFacing) features.push('חזית');
        if (featuresObj.upgradedKitchen) features.push('מטבח משודרג');
        if (featuresObj.accessibleForDisabled) features.push('נגישה לנכים');
        if (featuresObj.housingUnit) features.push('יח׳ דיור');

        const featuresHTML = features.length > 0 
          ? `<div class="property-features">${features.map(f => `<span>${f}</span>`).join(' ')}</div>`
          : '';

        // שם ליצירת קשר - מהמשתמש או מתווך
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
        
        // 🔗 יצירת URL לנכס באתר
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
  private async generateLayoutHTML(layout: any, sheet: SheetWithListings): Promise<string> {
    let html = '';
    
    // Flatten all items from all pages into a single array
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
        // Find the listing from sheet
        const sheetListing = sheet.listings.find(l => l.listingId === item.id);
        if (!sheetListing) continue;
        
        const listing = sheetListing.listing;
        const customFields = listing.customFields || {};
        
        // Generate listing card
        html += await this.generateListingCardHTML(listing, customFields);
      } else if (item.type === 'ad') {
        // Generate ad card - span columns
        const colspan = item.colspan || 1;
        const adImageBase64 = await this.imageToBase64(item.data.imageUrl);
        
        html += `
          <div class="newspaper-property-card" style="grid-column: span ${colspan}; overflow: hidden;">
            <img src="${adImageBase64}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
        `;
      }
    }
    
    return html;
  }

  /**
   * Generate single listing card HTML
   */
  private async generateListingCardHTML(listing: any, customFields: any): Promise<string> {
    const rooms = customFields.rooms || '';
    const size = customFields.size || '';
    const floor = customFields.floor || '';
    const isBrokerage = customFields.isBrokerage === true || customFields.brokerage === true;

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
    if (featuresObj.housingUnit) features.push('יח׳ דיור');        if (featuresObj.gallery) features.push('גלריה');
        if (featuresObj.kitchenette) features.push('מטבחון');
        if (featuresObj.toilets) features.push('שירותים');
        if (featuresObj.storefront) features.push('חלון ראווה');
        if (featuresObj.internet) features.push('אינטרנט');
        if (featuresObj.upgraded) features.push('מושפץ');
    const contactName = customFields.contactName || 'פרטים נוספים';
    const contactPhone = customFields.contactPhone || (listing.User?.phone) || '';

    // בניית כתובת מרחוב ושכונה
    const formatAddress = (): string => {
      const streetName = (listing as any).Street?.name;
      const neighborhood = listing.neighborhood;
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
        return this.escapeHtml(address);
      } else if (neighborhood) {
        // אין רחוב אבל יש שכונה - נציג רק שכונה
        return this.escapeHtml(neighborhood);
      }
      
      return 'נכס';
    };

    return `
      <a href="#" class="newspaper-property-card-link">
        <div class="newspaper-property-card">
          ${isBrokerage ? '<div class="brokerage-badge">תיווך</div>' : ''}
          
          <div class="property-card-header">
            <div class="property-title">${formatAddress()}</div>
          </div>

          <div class="property-card-body">
            <div class="property-meta">
              ${size ? `<div class="meta-item"><span class="meta-icon">📐</span><span class="meta-value">${this.escapeHtml(size)}</span></div>` : ''}
              ${floor ? `<div class="meta-item"><span class="meta-icon">🏢</span><span class="meta-value">${this.escapeHtml(floor)}</span></div>` : ''}
              ${rooms ? `<div class="meta-item"><span class="meta-icon">🚪</span><span class="meta-value">${this.escapeHtml(rooms)}</span></div>` : ''}
            </div>

            <div class="property-description">${this.escapeHtml(listing.title)}</div>

            ${features.length > 0 ? `<div class="property-features">${features.join(' · ')}</div>` : ''}
            ${listing.price ? `<div class="property-price">₪${listing.price.toLocaleString('he-IL')}</div>` : ''}
          </div>

          <div class="property-contact">
            <div class="contact-name">${this.escapeHtml(contactName)}</div>
            <div class="contact-phone">${this.escapeHtml(contactPhone)}</div>
          </div>
        </div>
      </a>
    `;
  }

  /**
   * Convert image to base64
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    try {
      // נניח שזה קובץ המקום
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
  private escapeHtml(text: any): string {
    if (!text && text !== 0) return '';
    const str = String(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
