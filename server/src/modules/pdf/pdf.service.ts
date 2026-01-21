import prisma from '../../config/database';
import QRCode from 'qrcode';
import { config } from '../../config';
import sharp from 'sharp';
import axios from 'axios';
import { brandingService } from '../branding/branding.service';
import path from 'path';
import fs from 'fs/promises';
import { launchBrowser, getPDFOptions, getPDFWaitOptions } from '../../utils/puppeteerConfig';
import { getPublicImageUrl } from '../../utils/imageUrlHelper';

export class PDFService {
  /**
   * Convert image URL to base64 data URI
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    try {
      console.log(`PDF SERVICE - imageToBase64 called with: "${imageUrl}"`);
      
      // Check if it's a local file path
      if (imageUrl.startsWith('/uploads/')) {
        // Remove leading slash and join with process.cwd()
        const relativePath = imageUrl.substring(1); // Remove the leading '/'
        const filePath = path.join(process.cwd(), relativePath);
        console.log(`PDF SERVICE - Attempting to load: ${filePath}`);
        
        try {
          await fs.access(filePath);
        } catch (accessErr) {
          console.error(`PDF SERVICE - ERROR: File not found at ${filePath}`);
          return '';
        }
        
        const buffer = await fs.readFile(filePath);
        console.log(`PDF SERVICE - File loaded: ${(buffer.length / 1024).toFixed(2)} KB`);
        
        const resized = await sharp(buffer)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        console.log(`PDF SERVICE - Image resized: ${(resized.length / 1024).toFixed(2)} KB`);
        return `data:image/jpeg;base64,${resized.toString('base64')}`;
      }
      
      // Try to fetch from URL
      console.log(`PDF SERVICE - Fetching from URL: ${imageUrl}`);
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
      const buffer = Buffer.from(response.data);
      const resized = await sharp(buffer)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      console.log(`PDF SERVICE - URL image converted: ${(resized.length / 1024).toFixed(2)} KB`);
      return `data:image/jpeg;base64,${resized.toString('base64')}`;
    } catch (error) {
      console.error('PDF SERVICE - CRITICAL ERROR in imageToBase64:', error);
      return ''; // Return empty string if conversion fails
    }
  }

  /**
   * Get logo as base64
   */
  private async getLogoBase64(): Promise<string> {
    try {
      const brandingConfig = await brandingService.getBrandingConfig();
      
      if (!brandingConfig.logoUrl || brandingConfig.logoUrl === '') {
        // Return default logo (text-based)
        return '';
      }

      const logoPath = path.join(process.cwd(), 'uploads', path.basename(brandingConfig.logoUrl));
      const buffer = await fs.readFile(logoPath);
      const resized = await sharp(buffer)
        .resize(200, 80, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
      return `data:image/png;base64,${resized.toString('base64')}`;
    } catch (error) {
      console.error('Failed to load logo:', error);
      return ''; // Return empty if logo not found
    }
  }

  /**
   * Generate PDF for a single ad by fetching it from database
   */
  async generateAdPDFById(adId: string): Promise<Buffer> {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: true,
        City: true,
        Street: {
          include: {
            Neighborhood: true,
          },
        },
        User: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        AdImage: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // Extract contact info from customFields or User
    const customFields = ad.customFields as any || {};
    const contactName = customFields.contactName || ad.User.name || 'לא צוין';
    const contactPhone = customFields.contactPhone || ad.User.phone;

    // Build full address
    let fullAddress = '';
    if (ad.City) {
      fullAddress = ad.City.nameHe;
    }
    if (ad.Street) {
      fullAddress += `, ${ad.Street.name}`;
      if (customFields.houseNumber) {
        fullAddress += ` ${customFields.houseNumber}`;
      }
    }
    if (ad.neighborhood) {
      fullAddress += ` (${ad.neighborhood})`;
    }
    // For wanted ads, use requestedLocationText
    if (ad.isWanted && ad.requestedLocationText) {
      fullAddress = ad.requestedLocationText;
    }

    const adData = {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price ?? undefined,
      category: ad.Category.nameHe,
      city: ad.City?.nameHe,
      address: fullAddress,
      adNumber: ad.adNumber,
      createdAt: ad.createdAt,
      images: ad.AdImage.map(img => img.url),
      customFields: customFields,
      user: {
        name: contactName,
        phone: contactPhone,
        email: ad.User.email,
      },
    };

    console.log(`PDF SERVICE - Ad has ${ad.AdImage.length} images`);
    if (ad.AdImage.length > 0) {
      console.log(`PDF SERVICE - First image URL: "${ad.AdImage[0].url}"`);
    }
    console.log(`PDF SERVICE - adData.images array:`, adData.images);

    return this.generateAdPDF(adData);
  }

  async generateAdPDF(ad: {
    id?: string;
    title: string;
    description: string;
    price?: number;
    category: string;
    city?: string;
    address?: string;
    adNumber?: number;
    createdAt?: Date;
    images: string[];
    customFields?: any;
    user: {
      name: string;
      phone?: string;
      email: string;
    };
  }): Promise<Buffer> {
    let browser;
    try {
      console.log('📄 Starting PDF generation for ad:', ad.id || ad.title);
      
      browser = await launchBrowser();
      const page = await browser.newPage();

      // Generate QR code if we have an ad ID
      let qrCodeDataUrl = '';
      if (ad.id) {
        const adUrl = `${config.frontendUrl}/ads/${ad.id}`;
        try {
          qrCodeDataUrl = await QRCode.toDataURL(adUrl, {
            width: 200,
            margin: 1,
            errorCorrectionLevel: 'M',
          });
        } catch (qrError) {
          console.error('Failed to generate QR code:', qrError);
        }
      }

      // Convert logo to base64
      const logoBase64 = await this.getLogoBase64();

      // Convert main image to base64
      let mainImageBase64 = '';
      if (ad.images && ad.images.length > 0) {
        // Try to find primary image or use first one
        const primaryImage = getPublicImageUrl(ad.images[0]);
        console.log(`Converting main image: ${primaryImage}`);
        mainImageBase64 = await this.imageToBase64(primaryImage);
        console.log(`Main image base64 length: ${mainImageBase64.length}`);
        if (mainImageBase64.length > 0) {
          console.log(`Main image base64 preview: ${mainImageBase64.substring(0, 50)}...`);
        } else {
          console.log('WARNING: Main image base64 is empty!');
        }
      } else {
        console.log('No images found in ad.images');
      }

      const html = this.generateAdHTML(ad, qrCodeDataUrl, logoBase64, mainImageBase64);

      const waitOptions = getPDFWaitOptions();
      await page.setContent(html, waitOptions);

      // Wait a bit for images to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pdfOptions = getPDFOptions();
      const pdf = await page.pdf(pdfOptions);

      console.log('✅ PDF generated successfully, size:', (pdf.length / 1024).toFixed(2), 'KB');
      return Buffer.from(pdf);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async generateNewspaperPDF(ads: Array<{
    title: string;
    description: string;
    price?: number;
    category: string;
    city?: string;
    images: string[];
  }>): Promise<Buffer> {
    let browser;
    try {
      console.log('📰 Starting newspaper PDF generation for', ads.length, 'ads');
      
      browser = await launchBrowser();
      const page = await browser.newPage();

      const html = this.generateNewspaperHTML(ads);

      const waitOptions = getPDFWaitOptions();
      await page.setContent(html, waitOptions);

      // Wait for images
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pdfOptions = getPDFOptions();
      const pdf = await page.pdf(pdfOptions);

      console.log('✅ Newspaper PDF generated successfully, size:', (pdf.length / 1024).toFixed(2), 'KB');
      return Buffer.from(pdf);
    } catch (error) {
      console.error('❌ Error generating newspaper PDF:', error);
      throw new Error(`Failed to generate newspaper PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private generateAdHTML(ad: {
    title: string;
    description: string;
    price?: number;
    category: string;
    city?: string;
    address?: string;
    adNumber?: number;
    createdAt?: Date;
    images: string[];
    customFields?: any;
    user: {
      name: string;
      phone?: string;
      email: string;
    };
  }, qrCodeDataUrl?: string, logoBase64?: string, mainImageBase64?: string): string {
    
    const customFields = ad.customFields || {};
    
    // Build property details dynamically - only show fields that exist
    const propertyDetails: Array<{ label: string; value: string }> = [];
    
    // Field mappings
    const fieldConfig: Record<string, { label: string; formatter?: (val: any) => string }> = {
      propertyType: {
        label: 'סוג נכס',
        formatter: (val) => {
          const types: Record<string, string> = {
            'APARTMENT': 'דירה',
            'HOUSE': 'בית',
            'PENTHOUSE': 'פנטהאוז',
            'GARDEN_APARTMENT': 'דירת גן',
            'STUDIO': 'סטודיו',
            'DUPLEX': 'דופלקס',
            'ROOF': 'גג/מרתף',
            'UNIT': 'יחידה',
          };
          return types[val] || val;
        }
      },
      rooms: { label: 'מספר חדרים' },
      squareMeters: { label: 'שטח (מ"ר)' },
      floor: { label: 'קומה' },
      balconies: { label: 'מרפסות' },
      condition: {
        label: 'מצב הנכס',
        formatter: (val) => {
          const conditions: Record<string, string> = {
            'NEW': 'חדש',
            'RENOVATED': 'משופץ',
            'MAINTAINED': 'מתוחזק',
            'NEEDS_RENOVATION': 'דורש שיפוץ',
          };
          return conditions[val] || val;
        }
      },
      furniture: {
        label: 'ריהוט',
        formatter: (val) => {
          const furniture: Record<string, string> = {
            'FULL': 'מרוהט',
            'PARTIAL': 'מרוהט חלקי',
            'NONE': 'לא מרוהט',
          };
          return furniture[val] || val;
        }
      },
      entryDate: { label: 'תאריך כניסה' },
      arnona: { 
        label: 'ארנונה (חודשית)',
        formatter: (val) => val > 0 ? `₪${val}` : 'לא צוין'
      },
      vaad: { 
        label: 'ועד בית (חודשי)',
        formatter: (val) => val > 0 ? `₪${val}` : 'לא צוין'
      },
      houseNumber: { label: 'מספר בית' },
      hasBroker: { 
        label: 'דרך מתווך',
        formatter: (val) => val ? 'כן' : 'לא'
      },
    };

    // Build property details array
    Object.entries(fieldConfig).forEach(([key, config]) => {
      if (customFields[key] !== undefined && customFields[key] !== null && customFields[key] !== '') {
        let value = customFields[key];
        if (config.formatter) {
          value = config.formatter(value);
        }
        propertyDetails.push({ label: config.label, value: String(value) });
      }
    });

    // Build features array
    const features: string[] = [];
    if (customFields.features) {
      const featureLabels: Record<string, string> = {
        airConditioning: 'מיזוג אוויר',
        elevator: 'מעלית',
        parking: 'חניה',
        storage: 'מחסן',
        balcony: 'מרפסת',
        safeRoom: 'ממ"ד',
        sukkaBalcony: 'מרפסת סוכה',
        view: 'נוף',
        yard: 'חצר',
        housingUnit: 'יחידת דיור',
        parentalUnit: 'יחידת הורים',
        pool: 'בריכה',
        kidsGames: 'משחקי ילדים',
        babyBed: 'מיטת תינוק',
      };

      Object.entries(featureLabels).forEach(([key, label]) => {
        if (customFields.features[key]) {
          features.push(label);
        }
      });
    }

    // Format date
    const publishDate = ad.createdAt ? new Date(ad.createdAt).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    const publisherName = ad.user.name || '—';

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
              direction: rtl;
              font-size: 10px;
              line-height: 1.4;
              color: #333;
              background: white;
            }
            
            .container {
              max-width: 100%;
              padding: 0;
            }
            
            /* 1. Header - Logo */
            .header {
              text-align: center;
              padding: 8px 0;
              border-bottom: 3px solid #007bff;
              margin-bottom: 10px;
            }
            
            .logo-img {
              max-height: 50px;
              max-width: 180px;
              object-fit: contain;
            }
            
            .logo-text {
              font-size: 20px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 2px;
            }
            
            .logo-subtitle {
              font-size: 9px;
              color: #666;
            }
            
            /* 2. Title Section */
            .title-section {
              margin-bottom: 8px;
            }
            
            .ad-title {
              font-size: 16px;
              font-weight: bold;
              color: #1a1a1a;
              margin-bottom: 4px;
              line-height: 1.3;
            }
            
            .ad-subtitle {
              font-size: 10px;
              color: #666;
            }
            
            .price {
              font-size: 18px;
              font-weight: bold;
              color: #28a745;
              margin: 6px 0;
            }
            
            /* 3. Property Details Table */
            .details-section {
              margin: 10px 0;
              background: #f8f9fa;
              padding: 8px;
              border-radius: 6px;
            }
            
            .section-title {
              font-size: 12px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 6px;
              border-bottom: 1px solid #dee2e6;
              padding-bottom: 3px;
            }
            
            .details-table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .details-table td {
              padding: 3px 6px;
              font-size: 9px;
              border-bottom: 1px solid #e9ecef;
            }
            
            .details-table td:first-child {
              font-weight: bold;
              color: #495057;
              width: 35%;
            }
            
            .details-table td:last-child {
              color: #212529;
            }
            
            .details-table tr:last-child td {
              border-bottom: none;
            }
            
            /* Features Tags */
            .features-section {
              margin: 8px 0;
            }
            
            .feature-tag {
              display: inline-block;
              background: #e3f2fd;
              color: #1976d2;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 8px;
              margin: 2px 3px 2px 0;
            }
            
            /* 4. Description */
            .description-section {
              margin: 10px 0;
              background: #fff;
              border: 1px solid #dee2e6;
              border-radius: 6px;
              padding: 8px;
            }
            
            .description-text {
              font-size: 9px;
              line-height: 1.5;
              color: #495057;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            
            /* 5. Main Image */
            .image-section {
              margin: 10px 0;
              text-align: center;
            }
            
            .main-image {
              max-width: 100%;
              max-height: 280px;
              border-radius: 8px;
              border: 2px solid #dee2e6;
              object-fit: contain;
            }
            
            .image-placeholder {
              background: #f8f9fa;
              border: 2px dashed #dee2e6;
              border-radius: 8px;
              padding: 40px;
              text-align: center;
              color: #6c757d;
              font-size: 10px;
            }
            
            /* 6. Meta Footer Row */
            .meta-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #f8f9fa;
              padding: 6px 10px;
              border-radius: 6px;
              margin: 10px 0;
              font-size: 9px;
            }
            
            .meta-item {
              color: #495057;
            }
            
            .meta-item strong {
              color: #212529;
            }
            
            /* 7. QR Section */
            .qr-section {
              text-align: center;
              margin: 10px 0;
              padding: 8px;
              background: #f8f9fa;
              border-radius: 6px;
            }
            
            .qr-code {
              max-width: 90px;
              border: 2px solid #007bff;
              border-radius: 6px;
              padding: 4px;
              background: white;
              margin: 0 auto 4px;
            }
            
            .qr-text {
              font-size: 9px;
              color: #495057;
              font-weight: bold;
              margin-bottom: 2px;
            }
            
            .qr-url {
              font-size: 7px;
              color: #6c757d;
              word-break: break-all;
            }
            
            /* Footer */
            .footer {
              text-align: center;
              margin-top: 8px;
              padding-top: 6px;
              border-top: 1px solid #dee2e6;
              font-size: 7px;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            
            <!-- 1. Header - Logo -->
            <div class="header">
              ${logoBase64 ? `
                <img src="${logoBase64}" alt="לוגו האתר" class="logo-img" />
              ` : `
                <div class="logo-text">מיעדליעד</div>
                <div class="logo-subtitle">הלוח השבועי של בית שמש</div>
              `}
            </div>
            
            <!-- 2. Title Section -->
            <div class="title-section">
              <h1 class="ad-title">${ad.title}</h1>
              <div class="ad-subtitle">
                <strong>קטגוריה:</strong> ${ad.category}
                ${ad.address ? ` • <strong>כתובת:</strong> ${ad.address}` : ad.city ? ` • <strong>עיר:</strong> ${ad.city}` : ''}
              </div>
              ${ad.price ? `<div class="price">₪${ad.price.toLocaleString('he-IL')}</div>` : ''}
            </div>
            
            <!-- 3. Property Details -->
            ${propertyDetails.length > 0 ? `
              <div class="details-section">
                <div class="section-title">פרטי הנכס</div>
                <table class="details-table">
                  ${propertyDetails.map(detail => `
                    <tr>
                      <td>${detail.label}</td>
                      <td>${detail.value}</td>
                    </tr>
                  `).join('')}
                </table>
                
                ${features.length > 0 ? `
                  <div class="features-section">
                    ${features.map(feature => `<span class="feature-tag">✓ ${feature}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <!-- 4. Description -->
            ${ad.description ? `
              <div class="description-section">
                <div class="section-title">תיאור</div>
                <div class="description-text">${ad.description}</div>
              </div>
            ` : ''}
            
            <!-- 5. Main Image -->
            <div class="image-section">
              ${mainImageBase64 ? `
                <img src="${mainImageBase64}" alt="תמונה ראשית" class="main-image" />
              ` : `
                <div class="image-placeholder">
                  📷<br/>אין תמונה זמינה
                </div>
              `}
            </div>
            
            <!-- 6. Meta Footer Row -->
            <div class="meta-footer">
              <div class="meta-item">
                <strong>תאריך פרסום:</strong> ${publishDate}
              </div>
              <div class="meta-item">
                <strong>שם מפרסם:</strong> ${publisherName}
              </div>
              ${ad.adNumber ? `
                <div class="meta-item">
                  <strong>מספר מודעה:</strong> #${ad.adNumber}
                </div>
              ` : ''}
            </div>
            
            <!-- 7. QR Section -->
            ${qrCodeDataUrl ? `
              <div class="qr-section">
                <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code" />
                <div class="qr-text">סרוק לצפייה במודעה באתר</div>
              </div>
            ` : ''}
            
            <!-- Footer -->
            <div class="footer">
              מסמך זה הופק באמצעות מערכת מיעדליעד • ${new Date().toLocaleDateString('he-IL')}
            </div>
            
          </div>
        </body>
      </html>
    `;
  }

  private generateNewspaperHTML(ads: Array<{
    title: string;
    description: string;
    price?: number;
    category: string;
    city?: string;
    images: string[];
  }>): string {
    const adsHTML = ads
      .map(
        ad => `
      <div class="ad-block">
        ${ad.images.length > 0 ? `<img src="${ad.images[0]}" class="ad-image">` : ''}
        <div class="ad-content">
          <h3>${ad.title}</h3>
          <p class="ad-category">${ad.category}${ad.city ? ` • ${ad.city}` : ''}</p>
          <p class="ad-description">${ad.description.substring(0, 150)}${ad.description.length > 150 ? '...' : ''}</p>
          ${ad.price ? `<p class="ad-price">₪${ad.price.toLocaleString()}</p>` : ''}
        </div>
      </div>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              padding: 15px;
              direction: rtl;
              column-count: 2;
              column-gap: 20px;
            }
            .header {
              column-span: all;
              text-align: center;
              border-bottom: 3px solid #007bff;
              padding: 15px 0;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .header .date {
              margin: 5px 0;
              color: #666;
            }
            .ad-block {
              break-inside: avoid;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 10px;
              margin-bottom: 15px;
              background: white;
            }
            .ad-image {
              width: 100%;
              height: 120px;
              object-fit: cover;
              border-radius: 4px;
              margin-bottom: 8px;
            }
            .ad-content h3 {
              font-size: 14px;
              margin: 5px 0;
              color: #333;
            }
            .ad-category {
              font-size: 11px;
              color: #666;
              margin: 3px 0;
            }
            .ad-description {
              font-size: 12px;
              margin: 5px 0;
              line-height: 1.4;
            }
            .ad-price {
              font-size: 14px;
              font-weight: bold;
              color: #28a745;
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📰 מיעדליעד - עיתון מודעות</h1>
            <div class="date">${new Date().toLocaleDateString('he-IL')}</div>
          </div>
          
          ${adsHTML}
        </body>
      </html>
    `;
  }
}
