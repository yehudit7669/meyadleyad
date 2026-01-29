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

export class NewspaperSheetService {
  private pdfService: NewspaperSheetPDFService;

  constructor() {
    this.pdfService = new NewspaperSheetPDFService();
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

      const title = `${category.nameHe} - ${city.nameHe}`;

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
          _count: {
            select: { listings: true }
          }
        }
      });

      await AuditService.log(userId, 'NEWSPAPER_SHEET_CREATED', {
        sheetId: sheet.id,
        categoryId,
        cityId,
        title
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
}

export const newspaperSheetService = new NewspaperSheetService();
