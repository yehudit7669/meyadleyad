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
   * ⚠️ UPDATED: Now returns NewspaperSheet instead of deprecated NewspaperAd
   */
  async getNewspaperAds(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Return NewspaperSheets instead of old NewspaperAd
    const [sheets, total] = await Promise.all([
      prisma.newspaperSheet.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              nameHe: true
            }
          },
          city: {
            select: {
              id: true,
              nameHe: true
            }
          },
          creator: {
            select: {
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              listings: true
            }
          }
        }
      }),
      prisma.newspaperSheet.count()
    ]);

    // Map to old format for backward compatibility
    const data = sheets.map(sheet => ({
      id: sheet.id,
      adId: null, // No longer relevant
      filePath: sheet.pdfPath || '',
      version: sheet.version,
      createdAt: sheet.createdAt,
      createdBy: sheet.createdBy,
      // Additional info
      title: sheet.title,
      status: sheet.status,
      listingsCount: sheet._count.listings,
      ad: {
        id: sheet.id,
        title: sheet.title,
        address: `${sheet.category.nameHe} - ${sheet.city.nameHe}`,
        status: sheet.status,
        customFields: {},
        City: sheet.city,
        Street: null
      },
      creator: sheet.creator
    }));

    return {
      data,
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
   * ⚠️ UPDATED: Now uses NewspaperSheet and delegates to newspaper-sheets service
   */
  async regenerateNewspaperPDF(newspaperAdId: string, userId: string) {
    const sheet = await prisma.newspaperSheet.findUnique({
      where: { id: newspaperAdId }
    });

    if (!sheet) {
      throw new Error('Newspaper sheet not found');
    }

    // Use the new newspaper-sheets service
    const { newspaperSheetService } = await import('../newspaper-sheets/newspaper-sheet.service');
    const result = await newspaperSheetService.generateSheetPDF(newspaperAdId, userId);

    // Log regeneration
    await AuditService.log(userId, 'NEWSPAPER_SHEET_PDF_REGENERATED', {
      sheetId: newspaperAdId,
      title: sheet.title,
      newVersion: result.version
    });

    return result;
  }

  /**
   * Delete a newspaper PDF
   * ⚠️ UPDATED: Now uses NewspaperSheet instead of deprecated NewspaperAd
   */
  async deleteNewspaperPDF(newspaperAdId: string, userId: string) {
    const sheet = await prisma.newspaperSheet.findUnique({
      where: { id: newspaperAdId }
    });

    if (!sheet) {
      throw new Error('Newspaper sheet not found');
    }

    // Delete PDF file if exists
    if (sheet.pdfPath) {
      try {
        const fullPath = path.join(process.cwd(), sheet.pdfPath);
        await fs.unlink(fullPath);
      } catch (error) {
        console.error('Failed to delete PDF file:', error);
        // Continue with DB deletion even if file deletion fails
      }
    }

    // Delete all versions
    await prisma.newspaperSheetVersion.deleteMany({
      where: { sheetId: newspaperAdId }
    });

    // Delete all listings
    await prisma.newspaperSheetListing.deleteMany({
      where: { sheetId: newspaperAdId }
    });

    // Delete sheet from database
    await prisma.newspaperSheet.delete({
      where: { id: newspaperAdId }
    });

    // Log deletion
    await AuditService.log(userId, 'NEWSPAPER_SHEET_DELETED', {
      sheetId: newspaperAdId,
      title: sheet.title
    });
  }

  /**
   * Get newspaper PDF by ID
   * ⚠️ UPDATED: Now uses NewspaperSheet instead of deprecated NewspaperAd
   */
  async getNewspaperPDFById(newspaperAdId: string) {
    return await prisma.newspaperSheet.findUnique({
      where: { id: newspaperAdId },
      include: {
        category: {
          select: {
            id: true,
            nameHe: true
          }
        },
        city: {
          select: {
            id: true,
            nameHe: true
          }
        },
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            listings: true
          }
        }
      }
    });
  }

  /**
   * Get all versions of newspaper PDF for a sheet
   * ⚠️ UPDATED: Now uses NewspaperSheetVersion instead of old structure
   */
  async getNewspaperPDFVersions(sheetId: string) {
    return await prisma.newspaperSheetVersion.findMany({
      where: { sheetId },
      orderBy: { version: 'desc' },
      include: {
        generator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
  }
}

export const newspaperService = new NewspaperService();
