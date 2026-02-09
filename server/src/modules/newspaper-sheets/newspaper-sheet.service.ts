import prisma from '../../config/database';
import { NewspaperSheetStatus } from '@prisma/client';
import {
  CreateSheetData,
  UpdateSheetData,
  AddListingData,
  SheetListQuery,
  PDFGenerationOptions,
  LayoutConfig
} from './types';
import { AuditService } from '../profile/audit.service';
import path from 'path';
import fs from 'fs/promises';
import { NewspaperSheetPDFService } from './newspaper-sheet-pdf.service';
import { calculateNewspaperLayout } from './newspaper-layout.service';

export class NewspaperSheetService {
  private pdfService: NewspaperSheetPDFService;

  constructor() {
    this.pdfService = new NewspaperSheetPDFService();
  }

  /**
   * Get or create global settings for newspaper issue number
   * קבלה או יצירה של הגדרות גלובליות למספר גליון
   */
  async getGlobalSettings() {
    let settings = await prisma.newspaperGlobalSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.newspaperGlobalSettings.create({
        data: {
          currentIssue: 1
        }
      });
    }
    
    return settings;
  }

  /**
   * Increment global issue number after successful distribution
   * העלאת מספר הגליון הגלובלי לאחר הפצה מוצלחת
   */
  async incrementGlobalIssueNumber() {
    const settings = await this.getGlobalSettings();
    
    const updated = await prisma.newspaperGlobalSettings.update({
      where: { id: settings.id },
      data: {
        currentIssue: settings.currentIssue + 1,
        lastDistributed: new Date()
      }
    });
    
    console.log(`📰 Global issue number incremented to ${updated.currentIssue}`);
    return updated;
  }

  /**
   * Get or Create Active Sheet for Category + City
   * מציאה או יצירה של גיליון פעיל לקטגוריה+עיר
   */
  async getOrCreateActiveSheet(
    categoryId: string,
    cityId: string,
    userId: string
  ) {
    // חיפוש גיליון פעיל קיים
    let sheet = await prisma.newspaperSheet.findFirst({
      where: {
        categoryId,
        cityId,
        status: NewspaperSheetStatus.ACTIVE
      },
      include: {
        category: { select: { nameHe: true } },
        city: { select: { nameHe: true } },
        listings: {
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
        ads: {
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { listings: true }
        }
      }
    });

    // אם לא קיים - יצירת גיליון חדש
    if (!sheet) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { nameHe: true }
      });

      const city = await prisma.city.findUnique({
        where: { id: cityId },
        select: { nameHe: true }
      });

      if (!category || !city) {
        throw new Error('Category or City not found');
      }

      const title = 'לוח מודעות'; // כותרת קבועה לכל הגיליונות

      sheet = await prisma.newspaperSheet.create({
        data: {
          categoryId,
          cityId,
          title,
          status: NewspaperSheetStatus.ACTIVE, // ✅ יוצר כ-ACTIVE כדי שיזוהה בפעם הבאה
          createdBy: userId,
          layoutConfig: {
            gridColumns: 3,
            cardPositions: []
          } as any
        },
        include: {
          category: { select: { nameHe: true } },
          city: { select: { nameHe: true } },
          listings: {
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
          ads: {
            orderBy: { createdAt: 'asc' }
          },
          _count: {
            select: { listings: true }
          }
        }
      });
    }

    return sheet;
  }

  /**
   * Add Listing to Sheet
   * הוספת מודעה לגיליון
   */
  async addListingToSheet(
    sheetId: string,
    listingId: string,
    userId: string,
    positionIndex?: number
  ) {
    // בדיקה שהמודעה לא כבר בגיליון
    const existing = await prisma.newspaperSheetListing.findUnique({
      where: {
        sheetId_listingId: {
          sheetId,
          listingId
        }
      }
    });

    if (existing) {
      return existing;
    }

    // חישוב position אוטומטי אם לא סופק
    if (positionIndex === undefined) {
      const maxPosition = await prisma.newspaperSheetListing.aggregate({
        where: { sheetId },
        _max: { positionIndex: true }
      });
      positionIndex = (maxPosition._max.positionIndex ?? -1) + 1;
    }

    const sheetListing = await prisma.newspaperSheetListing.create({
      data: {
        sheetId,
        listingId,
        positionIndex
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            address: true
          }
        }
      }
    });

    // עדכון layoutConfig
    const sheet = await prisma.newspaperSheet.findUnique({
      where: { id: sheetId },
      select: { layoutConfig: true }
    });

    const layoutConfig: LayoutConfig = sheet?.layoutConfig 
      ? JSON.parse(JSON.stringify(sheet.layoutConfig))
      : { gridColumns: 3, cardPositions: [] };

    layoutConfig.cardPositions.push({
      listingId,
      position: positionIndex
    });

    await prisma.newspaperSheet.update({
      where: { id: sheetId },
      data: { layoutConfig: layoutConfig as any }
    });

    await AuditService.log(userId, 'LISTING_ADDED_TO_SHEET', {
      sheetId,
      listingId,
      positionIndex
    });

    return sheetListing;
  }

  /**
   * Update Listing Position (Drag & Drop)
   * עדכון מיקום מודעה בגריד
   */
  async updateListingPosition(
    sheetId: string,
    sheetListingId: string,
    newPosition: number,
    userId: string
  ) {
    // Get all listings in this sheet
    const allListings = await prisma.newspaperSheetListing.findMany({
      where: { sheetId },
      orderBy: { positionIndex: 'asc' }
    });

    // Find the listing being moved
    const movedListingIndex = allListings.findIndex(l => l.id === sheetListingId);
    if (movedListingIndex === -1) {
      throw new Error('Listing not found in sheet');
    }

    const movedListing = allListings[movedListingIndex];
    const oldPosition = movedListing.positionIndex;

    // Remove from old position and insert at new position
    allListings.splice(movedListingIndex, 1);
    allListings.splice(newPosition, 0, movedListing);

    // Update all positions in a transaction
    await prisma.$transaction(
      allListings.map((listing, index) =>
        prisma.newspaperSheetListing.update({
          where: { id: listing.id },
          data: { positionIndex: index }
        })
      )
    );

    // Log the action
    await AuditService.log(userId, 'LISTING_POSITION_UPDATED', {
      sheetId,
      listingId: sheetListingId,
      oldPosition,
      newPosition
    });

    return true;
  }

  /**
   * List All Sheets with Pagination
   */
  async listSheets(query: SheetListQuery) {
    const { page = 1, limit = 20, categoryId, cityId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (cityId) where.cityId = cityId;
    if (status) where.status = status;

    const [sheets, total] = await Promise.all([
      prisma.newspaperSheet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: { select: { id: true, nameHe: true } },
          city: { select: { id: true, nameHe: true } },
          creator: { select: { name: true, email: true } },
          _count: {
            select: { listings: true, versions: true }
          }
        }
      }),
      prisma.newspaperSheet.count({ where })
    ]);

    return {
      data: sheets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get Single Sheet with Full Details
   */
  async getSheetById(sheetId: string) {
    const sheet = await prisma.newspaperSheet.findUnique({
      where: { id: sheetId },
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
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5
        },
        ads: {
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { listings: true }
        }
      }
    });

    if (!sheet) {
      throw new Error('Sheet not found');
    }

    return sheet;
  }

  /**
   * Update Sheet Details
   */
  async updateSheet(
    sheetId: string,
    data: UpdateSheetData,
    userId: string
  ) {
    // Parse layoutConfig if it's a string
    const updateData: any = { ...data };
    if (data.layoutConfig && typeof data.layoutConfig === 'string') {
      try {
        updateData.layoutConfig = JSON.parse(data.layoutConfig);
      } catch (e) {
        console.error('Failed to parse layoutConfig:', e);
      }
    }

    const sheet = await prisma.newspaperSheet.update({
      where: { id: sheetId },
      data: updateData
    });

    await AuditService.log(userId, 'NEWSPAPER_SHEET_UPDATED', {
      sheetId,
      updates: data
    });

    return sheet;
  }

  /**
   * Generate PDF for Sheet
   * יצירת PDF לגיליון
   */
  async generateSheetPDF(
    sheetId: string,
    userId: string,
    force = false
  ) {
    const sheet = await this.getSheetById(sheetId);

    if (!sheet.listings || sheet.listings.length === 0) {
      throw new Error('Cannot generate PDF for empty sheet');
    }

    // יצירת PDF
    const pdfBuffer = await this.pdfService.generateSheetPDF(sheet as any);

    // שמירת PDF
    const uploadsDir = path.join(process.cwd(), 'uploads', 'newspaper-sheets');
    await fs.mkdir(uploadsDir, { recursive: true });

    const nextVersion = sheet.version + 1;
    const filename = `sheet_${sheetId}_v${nextVersion}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, pdfBuffer);

    const pdfPath = `/uploads/newspaper-sheets/${filename}`;

    // עדכון Sheet
    await prisma.newspaperSheet.update({
      where: { id: sheetId },
      data: {
        pdfPath,
        version: nextVersion
      }
    });

    // שמירת גרסה
    await prisma.newspaperSheetVersion.create({
      data: {
        sheetId,
        version: nextVersion,
        pdfPath,
        generatedBy: userId
      }
    });

    await AuditService.log(userId, 'SHEET_PDF_GENERATED', {
      sheetId,
      version: nextVersion,
      pdfPath
    });

    return { pdfPath, version: nextVersion };
  }

  /**
   * Delete Sheet
   */
  async deleteSheet(sheetId: string, userId: string) {
    await prisma.newspaperSheet.delete({
      where: { id: sheetId }
    });

    await AuditService.log(userId, 'NEWSPAPER_SHEET_DELETED', {
      sheetId
    });

    return true;
  }

  /**
   * Remove Listing from Sheet
   */
  async removeListingFromSheet(
    sheetId: string,
    listingId: string,
    userId: string
  ) {
    await prisma.newspaperSheetListing.delete({
      where: {
        sheetId_listingId: {
          sheetId,
          listingId
        }
      }
    });

    await AuditService.log(userId, 'LISTING_REMOVED_FROM_SHEET', {
      sheetId,
      listingId
    });

    return true;
  }

  /**
   * Generate General Sheet PDF
   * יצירת PDF כללי של כל הנכסים באתר
   */
  async generateGeneralSheetPDF(userId: string, options: { force?: boolean; orderBy?: 'city' | 'category' } = {}) {
    const { newspaperGeneralSheetService } = await import('./newspaper-general-sheet.service.js');
    
    console.log('📰 Starting general sheet PDF generation...');
    
    // יצירת PDF
    const result = await newspaperGeneralSheetService.generateGeneralSheetPDF({
      orderBy: options.orderBy || 'city',
      force: options.force
    });

    // שמירת PDF
    const uploadsDir = path.join(process.cwd(), 'uploads', 'newspaper-sheets');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `general_sheet_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, result.pdfBuffer);

    const pdfPath = `/uploads/newspaper-sheets/${filename}`;

    await AuditService.log(userId, 'GENERAL_SHEET_PDF_GENERATED', {
      pdfPath,
      sheetsCount: result.sheetsCount,
      orderBy: options.orderBy || 'city'
    });

    console.log(`✅ General sheet PDF saved: ${pdfPath}`);

    return { pdfPath, sheetsCount: result.sheetsCount };
  }

  /**
   * Add Advertisement to Sheet
   * הוספת פרסומת לגיליון
   */
  async addAdvertisement(
    sheetId: string,
    data: {
      imageUrl: string;
      size: '1x1' | '2x1' | '3x1' | '2x2';
      anchorType: 'beforeIndex' | 'pagePosition';
      beforeListingId?: string;
      page?: number;
      row?: number;
      col?: number;
    },
    userId: string
  ) {
    // Validate sheet exists
    const sheet = await prisma.newspaperSheet.findUnique({
      where: { id: sheetId }
    });

    if (!sheet) {
      throw new Error('Sheet not found');
    }

    // Validate anchor data
    if (data.anchorType === 'beforeIndex' && !data.beforeListingId) {
      throw new Error('beforeListingId is required for beforeIndex anchor');
    }

    if (data.anchorType === 'pagePosition' && (!data.page || !data.row || !data.col)) {
      throw new Error('page, row, and col are required for pagePosition anchor');
    }

    // Create advertisement
    const ad = await prisma.newspaperSheetAd.create({
      data: {
        sheetId,
        imageUrl: data.imageUrl,
        size: data.size,
        anchorType: data.anchorType,
        beforeListingId: data.beforeListingId,
        page: data.page,
        row: data.row,
        col: data.col,
        createdBy: userId
      }
    });

    await AuditService.log(userId, 'NEWSPAPER_SHEET_AD_ADDED', {
      sheetId,
      adId: ad.id,
      size: data.size,
      anchorType: data.anchorType
    });

    return ad;
  }

  /**
   * Update Advertisement
   * עדכון פרסומת
   */
  async updateAdvertisement(
    adId: string,
    data: {
      imageUrl?: string;
      size?: '1x1' | '2x1' | '3x1' | '2x2';
      anchorType?: 'beforeIndex' | 'pagePosition';
      beforeListingId?: string;
      page?: number;
      row?: number;
      col?: number;
    },
    userId: string
  ) {
    // Get existing ad
    const existingAd = await prisma.newspaperSheetAd.findUnique({
      where: { id: adId }
    });

    if (!existingAd) {
      throw new Error('Advertisement not found');
    }

    // Validate anchor data if anchorType is changing
    const newAnchorType = data.anchorType || existingAd.anchorType;
    if (newAnchorType === 'beforeIndex' && !data.beforeListingId && !existingAd.beforeListingId) {
      throw new Error('beforeListingId is required for beforeIndex anchor');
    }

    if (newAnchorType === 'pagePosition') {
      const newPage = data.page ?? existingAd.page;
      const newRow = data.row ?? existingAd.row;
      const newCol = data.col ?? existingAd.col;
      
      if (!newPage || !newRow || !newCol) {
        throw new Error('page, row, and col are required for pagePosition anchor');
      }
    }

    // Update advertisement
    const updatedAd = await prisma.newspaperSheetAd.update({
      where: { id: adId },
      data: {
        imageUrl: data.imageUrl,
        size: data.size,
        anchorType: data.anchorType,
        beforeListingId: data.beforeListingId,
        page: data.page,
        row: data.row,
        col: data.col
      }
    });

    await AuditService.log(userId, 'NEWSPAPER_SHEET_AD_UPDATED', {
      sheetId: existingAd.sheetId,
      adId: adId,
      changes: data
    });

    return updatedAd;
  }

  /**
   * Remove Advertisement from Sheet
   * הסרת פרסומת מגיליון
   */
  async removeAdvertisement(
    sheetId: string,
    adId: string,
    userId: string
  ) {
    const ad = await prisma.newspaperSheetAd.findUnique({
      where: { id: adId }
    });

    if (!ad) {
      throw new Error('Advertisement not found');
    }

    if (ad.sheetId !== sheetId) {
      throw new Error('Advertisement does not belong to this sheet');
    }

    await prisma.newspaperSheetAd.delete({
      where: { id: adId }
    });

    await AuditService.log(userId, 'NEWSPAPER_SHEET_AD_REMOVED', {
      sheetId,
      adId
    });

    return true;
  }

  /**
   * Calculate Layout with Ads
   * חישוב פריסה מלאה עם פרסומות
   */
  async calculateSheetLayout(sheetId: string) {
    const sheet = await this.getSheetById(sheetId);
    
    // Prepare listings data
    const listings = sheet.listings
      .sort((a, b) => a.positionIndex - b.positionIndex)
      .map(l => ({
        ...l.listing,
        id: l.listingId
      }));

    // Prepare ads data
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

    // Calculate layout
    const layout = calculateNewspaperLayout(listings, ads);

    return {
      ...layout,
      sheetInfo: {
        title: sheet.title,
        category: sheet.category.nameHe,
        city: sheet.city.nameHe,
        listingsCount: listings.length,
        adsCount: ads.length
      }
    };
  }
}

export const newspaperSheetService = new NewspaperSheetService();
