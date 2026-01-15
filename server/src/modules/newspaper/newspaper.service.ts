import prisma from '../../config/database';
import { PDFService } from '../pdf/pdf.service';
import path from 'path';
import fs from 'fs/promises';
import { AuditService } from '../profile/audit.service';

export class NewspaperService {
  private pdfService: PDFService;

  constructor() {
    this.pdfService = new PDFService();
  }

  /**
   * Get all newspaper PDFs (paginated)
   */
  async getNewspaperAds(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [ads, total] = await Promise.all([
      prisma.newspaperAd.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ad: {
            select: {
              id: true,
              title: true,
              address: true,
              status: true,
              customFields: true,
              City: {
                select: { nameHe: true }
              },
              Street: {
                select: { name: true }
              }
            }
          },
          creator: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.newspaperAd.count()
    ]);

    return {
      data: ads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Generate newspaper PDF for an ad
   */
  async generateNewspaperPDF(adId: string, userId: string): Promise<{ newspaperAd: any; filePath: string }> {
    // Get ad details
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

    // Get next version number for this ad
    const latestVersion = await prisma.newspaperAd.findFirst({
      where: { adId },
      orderBy: { version: 'desc' }
    });

    const version = latestVersion ? latestVersion.version + 1 : 1;

    // Generate PDF using the newspaper template
    const pdfBuffer = await this.generateNewspaperStylePDF(ad);

    // Save PDF file
    const uploadsDir = path.join(process.cwd(), 'uploads', 'newspaper');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `newspaper-ad-${adId}-v${version}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, filename);
    
    await fs.writeFile(filePath, pdfBuffer);

    // Save to database
    const newspaperAd = await prisma.newspaperAd.create({
      data: {
        ad: {
          connect: { id: adId }
        },
        creator: {
          connect: { id: userId }
        },
        filePath: `/uploads/newspaper/${filename}`,
        version
      },
      include: {
        ad: {
          select: {
            title: true,
            address: true
          }
        }
      }
    });

    // Log to audit
    await AuditService.log(userId, 'NEWSPAPER_PDF_GENERATED', {
      adId,
      newspaperAdId: newspaperAd.id,
      version
    });

    return { newspaperAd, filePath: `/uploads/newspaper/${filename}` };
  }

  /**
   * Generate PDF with newspaper-style template (A4 format)
   */
  private async generateNewspaperStylePDF(ad: any): Promise<Buffer> {
    // Extract contact info
    const customFields = ad.customFields as any || {};

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
    if (ad.isWanted && ad.requestedLocationText) {
      fullAddress = ad.requestedLocationText;
    }

    // Use the existing PDF service to generate newspaper-style PDF
    return this.pdfService.generateAdPDFById(ad.id);
  }

  /**
   * Regenerate a newspaper PDF (creates new version)
   */
  async regenerateNewspaperPDF(newspaperAdId: string, userId: string) {
    const existing = await prisma.newspaperAd.findUnique({
      where: { id: newspaperAdId },
      include: {
        ad: true
      }
    });

    if (!existing) {
      throw new Error('Newspaper ad not found');
    }

    // Generate new version
    const result = await this.generateNewspaperPDF(existing.adId, userId);

    // Log regeneration
    await AuditService.log(userId, 'NEWSPAPER_PDF_REGENERATED', {
      originalId: newspaperAdId,
      newId: result.newspaperAd.id,
      adId: existing.adId,
      newVersion: result.newspaperAd.version
    });

    return result;
  }

  /**
   * Delete a newspaper PDF
   */
  async deleteNewspaperPDF(newspaperAdId: string, userId: string) {
    const newspaperAd = await prisma.newspaperAd.findUnique({
      where: { id: newspaperAdId }
    });

    if (!newspaperAd) {
      throw new Error('Newspaper ad not found');
    }

    // Delete file
    try {
      const fullPath = path.join(process.cwd(), newspaperAd.filePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete PDF file:', error);
      // Continue with DB deletion even if file deletion fails
    }

    // Delete from database
    await prisma.newspaperAd.delete({
      where: { id: newspaperAdId }
    });

    // Log deletion
    await AuditService.log(userId, 'NEWSPAPER_PDF_DELETED', {
      newspaperAdId,
      adId: newspaperAd.adId
    });
  }

  /**
   * Get newspaper PDF by ID
   */
  async getNewspaperPDFById(newspaperAdId: string) {
    return await prisma.newspaperAd.findUnique({
      where: { id: newspaperAdId },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            address: true,
            status: true
          }
        },
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Get all versions of newspaper PDF for an ad
   */
  async getNewspaperPDFVersions(adId: string) {
    return await prisma.newspaperAd.findMany({
      where: { adId },
      orderBy: { version: 'desc' },
      include: {
        creator: {
          select: {
            name: true
          }
        }
      }
    });
  }
}

export const newspaperService = new NewspaperService();
