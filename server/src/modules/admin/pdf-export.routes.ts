import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import puppeteer from 'puppeteer';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Export ad as A4 PDF (admin only)
router.get('/ads/:adId/export-a4', async (req: Request, res: Response): Promise<void> => {
  try {
    const { adId } = req.params;

    // Get ad details
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: {
          select: {
            nameHe: true,
          },
        },
        City: {
          select: {
            nameHe: true,
          },
        },
        User: {
          select: {
            name: true,
            phone: true,
            email: true,
            companyName: true,
          },
        },
        AdImage: {
          take: 1,
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!ad) {
      res.status(404).json({ error: 'Ad not found' });
      return;
    }

    // Generate HTML content for A4 format
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ad.title}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: Arial, sans-serif;
      direction: rtl;
      text-align: right;
      margin: 0;
      padding: 20px;
      font-size: 12pt;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24pt;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 14pt;
      color: #64748b;
    }
    .main-image {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 20pt;
      color: #1e293b;
      margin-bottom: 10px;
    }
    .category {
      font-size: 12pt;
      color: #2563eb;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .price {
      font-size: 18pt;
      color: #16a34a;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .description {
      font-size: 11pt;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 20px;
      white-space: pre-wrap;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
    }
    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-label {
      font-weight: bold;
      color: #64748b;
    }
    .detail-value {
      color: #1e293b;
    }
    .contact-section {
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .contact-title {
      font-size: 14pt;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
    }
    .contact-info {
      font-size: 11pt;
      line-height: 1.8;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🏠 Meyadleyad</div>
    <div class="subtitle">פלטפורמת נדל"ן מקצועית</div>
  </div>

  ${ad.AdImage[0]?.url ? `<img src="${ad.AdImage[0].url}" class="main-image" alt="${ad.title}" />` : ''}

  <h1>${ad.title}</h1>
  <div class="category">📂 ${ad.Category.nameHe}</div>
  ${ad.price ? `<div class="price">💰 ₪${ad.price.toLocaleString()}</div>` : ''}

  <div class="description">${ad.description}</div>

  <div class="details-grid">
    ${ad.City ? `
    <div class="detail-item">
      <span class="detail-label">עיר:</span>
      <span class="detail-value">${ad.City.nameHe}</span>
    </div>
    ` : ''}
    ${ad.address ? `
    <div class="detail-item">
      <span class="detail-label">כתובת:</span>
      <span class="detail-value">${ad.address}</span>
    </div>
    ` : ''}
    ${ad.customFields && (ad.customFields as any).rooms ? `
    <div class="detail-item">
      <span class="detail-label">חדרים:</span>
      <span class="detail-value">${(ad.customFields as any).rooms}</span>
    </div>
    ` : ''}
    ${ad.customFields && (ad.customFields as any).floor ? `
    <div class="detail-item">
      <span class="detail-label">קומה:</span>
      <span class="detail-value">${(ad.customFields as any).floor}</span>
    </div>
    ` : ''}
    ${ad.customFields && (ad.customFields as any).size ? `
    <div class="detail-item">
      <span class="detail-label">גודל:</span>
      <span class="detail-value">${(ad.customFields as any).size} מ"ר</span>
    </div>
    ` : ''}
    <div class="detail-item">
      <span class="detail-label">מזהה מודעה:</span>
      <span class="detail-value">#${ad.adNumber}</span>
    </div>
  </div>

  <div class="contact-section">
    <div class="contact-title">📞 פרטי קשר</div>
    <div class="contact-info">
      ${ad.User.name ? `<div><strong>שם:</strong> ${ad.User.name}</div>` : ''}
      ${ad.User.companyName ? `<div><strong>חברה:</strong> ${ad.User.companyName}</div>` : ''}
      ${ad.User.phone ? `<div><strong>טלפון:</strong> ${ad.User.phone}</div>` : ''}
      ${ad.User.email ? `<div><strong>אימייל:</strong> ${ad.User.email}</div>` : ''}
    </div>
  </div>

  <div class="footer">
    <div>Meyadleyad - פלטפורמת נדל"ן מקצועית</div>
    <div>תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}</div>
  </div>
</body>
</html>
    `;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ad-${ad.adNumber}-${Date.now()}.pdf`);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

export default router;
