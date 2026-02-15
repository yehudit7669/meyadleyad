import prisma from '../../config/database';
import { EmailService } from '../email/email.service';
import { AdStatus, Prisma } from '@prisma/client';
import { emailOperationsFormController } from '../email-operations/email-operations-form.controller';
import { notificationsService } from '../notifications/notifications.service';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class AdminService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // טיפול ב-log פעולות אדמין
  private async logAdminAction(
    adminId: string,
    adId: string,
    action: string,
    fromStatus?: AdStatus,
    toStatus?: AdStatus,
    reason?: string
  ) {
    try {
      await prisma.adminAdLog.create({
        data: {
          adminId,
          adId,
          action,
          fromStatus,
          toStatus,
          reason,
        },
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  async getPendingAds(
    page: number = 1,
    limit: number = 20,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      cityId?: string;
      cityName?: string;
      publisher?: string;
    }
  ) {
    const skip = (page - 1) * limit;

    // תנאי סטטוס: רק PENDING
    const statusCondition = {
      status: 'PENDING'
    };

    // בניית תנאי where עם כל הפילטרים
    const where: any = {
      AND: [statusCondition]
    };

    // מסננים
    if (filters?.dateFrom || filters?.dateTo) {
      const createdAt: any = {};
      if (filters.dateFrom) {
        createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        createdAt.lte = new Date(filters.dateTo);
      }
      where.AND.push({ createdAt });
    }

    if (filters?.cityId) {
      where.AND.push({ cityId: filters.cityId });
    }

    if (filters?.cityName) {
      where.AND.push({
        City: {
          name: {
            contains: filters.cityName,
            mode: 'insensitive',
          },
        },
      });
    }

    if (filters?.publisher) {
      where.AND.push({
        User: {
          OR: [
            { name: { contains: filters.publisher, mode: 'insensitive' } },
            { email: { contains: filters.publisher, mode: 'insensitive' } },
            { phone: { contains: filters.publisher } },
          ],
        },
      });
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Category: true,
          City: true,
          Street: true,
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          AdImage: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.ad.count({ where }),
    ]);

    return {
      ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdById(adId: string) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: true,
        City: true,
        Street: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            companyName: true,
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

    return ad;
  }

  async approveAd(adId: string, adminId: string) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: { User: true, Category: true },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // If already approved, just return it (idempotent)
    if (ad.status === 'APPROVED' || ad.status === 'ACTIVE') {
      console.log(`ℹ️ Ad ${adId} already approved, returning existing ad`);
      return ad;
    }

    if (ad.status !== 'PENDING') {
      throw new Error('Only pending ads can be approved');
    }

    // חישוב תאריך פקיעה (30 יום)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: 'ACTIVE',
        publishedAt: new Date(),
        expiresAt,
      },
      include: {
        User: true,
        Category: true,
      },
    });

    // רישום לוג
    await this.logAdminAction(
      adminId,
      adId,
      'APPROVE',
      'PENDING',
      'ACTIVE'
    );

    // ✅ Email Operations: שליחת מייל אישור פרסום
    try {
      await emailOperationsFormController.handleAdApproved(updatedAd.id, updatedAd.adNumber);
    } catch (error) {
      console.error('❌ Failed to send approval email:', error);
      // לא נעצור את התהליך בגלל שגיאת מייל
    }

    // ✅ NEW: שליחת התראות למשתמשים שביקשו התראות על נכסים חדשים
    try {
      await notificationsService.notifyNewAd(updatedAd.id);
    } catch (error) {
      console.error('❌ Failed to send notifications:', error);
      // לא נעצור את התהליך בגלל שגיאת התראות
    }

    // ✅ NEW: הוספה אוטומטית לגיליון עיתון (קטגוריה + עיר)
    try {
      // בדיקה שהמודעה היא "לוח מודעות - תצורת עיתון"
      console.log(`🔍 Checking if ad should be added to newspaper sheet:`, {
        categoryId: ad.categoryId,
        categorySlug: ad.Category.slug,
        categoryNameHe: ad.Category.nameHe,
        cityId: ad.cityId
      });

      // 🧪 TEMPORARY: Add ALL ads to newspaper sheets for testing
      const isNewspaperCategory = true; // ad.Category.slug?.includes('loach') || 
                                  // ad.Category.slug?.includes('newspaper') ||
                                  // ad.Category.nameHe?.includes('לוח מודעות') ||
                                  // ad.Category.nameHe?.includes('עיתון');

      console.log(`✓ Is newspaper category: ${isNewspaperCategory} (TESTING MODE - ALL CATEGORIES)`);

      if (isNewspaperCategory && ad.cityId) {
        console.log(`📰 Adding ad ${adId} to newspaper sheet...`);
        
        const { newspaperSheetService } = await import('../newspaper-sheets/newspaper-sheet.service.js');
        
        // קבלת או יצירת גיליון פעיל
        const sheet = await newspaperSheetService.getOrCreateActiveSheet(
          ad.categoryId,
          ad.cityId,
          adminId
        );

        console.log(`📋 Sheet found/created:`, { sheetId: sheet.id, title: sheet.title });

        // הוספת המודעה לגיליון
        await newspaperSheetService.addListingToSheet(
          sheet.id,
          adId,
          adminId
        );

        console.log(`✅ Ad ${adId} added to newspaper sheet ${sheet.id} (${sheet.title})`);

        // ✅ יצירת PDF לגיליון
        console.log(`📄 Generating PDF for sheet ${sheet.id}...`);
        const pdfResult = await newspaperSheetService.generateSheetPDF(sheet.id, adminId);
        console.log(`✅ PDF generated: ${pdfResult.pdfPath} (version ${pdfResult.version})`);
      }
    } catch (error) {
      console.error(`❌ Failed to add ad to newspaper sheet:`, error);
      // לא לזרוק שגיאה - כשלון בהוספה לגיליון לא צריך לחסום את האישור
    }

    // הערה: מייל אישור עם PDF נשלח דרך emailOperationsFormController.handleAdApproved
    // (שורה 199) ולכן לא צריך לשלוח מייל נוסף כאן

    return updatedAd;
  }

  /**
   * אישור מודעה + שליחה מיידית ל-WhatsApp (ללא אישור נוסף)
   * המודעה מאושרת, פריטי הפצה נוצרים עם סטטוס SENT
   */
  async approveAdAndWhatsApp(adId: string, adminId: string) {
    // בדיקה שהמודעה קיימת ו-PENDING
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: true,
        City: true,
        Street: true,
        AdImage: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (ad.status !== 'PENDING') {
      throw new Error('Only pending ads can be approved');
    }

    // אישור המודעה תחילה
    const approvedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: 'APPROVED',
        publishedAt: new Date(),
      },
    });

    // רישום לוג אישור
    await this.logAdminAction(
      adminId,
      adId,
      'approve'
    );

    // יצירת פריטי הפצה עם סטטוס SENT (שליחה מיידית)
    if (process.env.WHATSAPP_MODULE_ENABLED === 'true') {
      try {
        const { routingEngine } = await import('../whatsapp/distribution/routing-engine.service.js');
        const { messageBuilder } = await import('../whatsapp/distribution/message-builder.service.js');
        const { auditService } = await import('../whatsapp/distribution/audit.service.js');

        // Find matching groups
        const matches = await routingEngine.findMatchingGroups(adId);
        
        console.log(`📊 Found ${matches.length} matching groups for ad ${adId}:`, matches.map(m => ({ groupId: m.groupId, groupName: m.groupName })));

        // Build message payload
        const payload = messageBuilder.buildAdMessage(ad);

        // If no matches, create a placeholder item with null groupId
        if (matches.length === 0) {
          console.log(`⚠️ No matching WhatsApp groups found for ad ${adId}, creating placeholder`);
          
          const item = await prisma.distributionItem.create({
            data: {
              adId,
              groupId: null,
              status: 'PENDING',
              priority: 0,
              payloadSnapshot: payload as any,
              dedupeKey: `${adId}-no-group`,
            },
          });

          return {
            ad: approvedAd,
            items: [{ id: item.id, groupId: null, groupName: null, status: item.status }],
            messageText: payload.messageText,
            warning: 'לא נמצאה קבוצת WhatsApp תואמת למודעה זו. המודעה תמתין בתור עד שתיווצר קבוצה מתאימה.',
          };
        }

        // Check if all matching groups are paused or archived
        const activeMatches = matches.filter(m => m.groupStatus === 'ACTIVE');
        if (activeMatches.length === 0) {
          console.log(`⚠️ All matching groups are paused/archived for ad ${adId}`);
          
          const item = await prisma.distributionItem.create({
            data: {
              adId,
              groupId: null,
              status: 'PENDING',
              priority: 0,
              payloadSnapshot: payload as any,
              dedupeKey: `${adId}-no-group`,
            },
          });

          return {
            ad: approvedAd,
            items: [{ id: item.id, groupId: null, groupName: null, status: item.status }],
            messageText: payload.messageText,
            warning: 'כל הקבוצות התואמות מושהות או בארכיון. המודעה תמתין בתור עד שקבוצה תהיה פעילה.',
          };
        }

        // Create distribution items with SENT status
        const items = [];
        for (const match of activeMatches) {
          const dedupeKey = `${adId}-${match.groupId}`;
          console.log(`🔍 Checking for existing item with dedupeKey: ${dedupeKey}`);
          
          // Check if item already exists
          const existingItem = await prisma.distributionItem.findUnique({
            where: { dedupeKey },
          });

          if (existingItem) {
            console.log(`⏭️ Item already exists: ad ${adId} → group ${match.groupId}, status: ${existingItem.status}`);
            items.push({
              id: existingItem.id,
              groupId: match.groupId,
              groupName: match.groupName,
              status: existingItem.status,
            });
            continue;
          }
          
          console.log(`✨ Creating new item: ad ${adId} → group ${match.groupId}`);

          // Create with SENT status
          const item = await prisma.distributionItem.create({
            data: {
              adId,
              groupId: match.groupId,
              status: 'SENT',
              priority: match.priority,
              payloadSnapshot: payload as any,
              dedupeKey,
              sentAt: new Date(),
            },
          });
          
          console.log(`✅ Created item ${item.id} with dedupeKey: ${dedupeKey}`);

          items.push({
            id: item.id,
            groupId: match.groupId,
            groupName: match.groupName,
            status: item.status,
          });

          // Audit log
          await auditService.log({
            action: 'create_manual_distribution',
            actorUserId: adminId,
            entityType: 'distribution_item',
            entityId: item.id,
            payload: {
              adId,
              groupId: match.groupId,
              priority: match.priority,
              status: 'SENT',
              sentImmediately: true,
            },
          });
        }

        console.log(`✅ Created ${items.length} WhatsApp distribution items with SENT status for ad ${adId}`);

        return {
          ad: approvedAd,
          items,
          messageText: payload.messageText,
        };
      } catch (error) {
        console.error('❌ Failed to create WhatsApp distribution items:', error);
        
        // If error is about no groups or paused groups, throw it to the user
        if (error instanceof Error && (
          error.message.includes('לא נמצאה קבוצת WhatsApp') ||
          error.message.includes('מושהות או בארכיון')
        )) {
          throw error;
        }
        
        // For other errors, המודעה כבר אושרה, לא זורק שגיאה
        return {
          ad: approvedAd,
          items: [],
          messageText: '',
        };
      }
    }

    return { ad: approvedAd, items: [], messageText: '' };
  }

  async rejectAd(adId: string, reason: string, adminId: string) {
    if (reason && reason.length > 250) {
      throw new Error('Rejection reason must be 250 characters or less');
    }

    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: { User: true },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (ad.status !== 'PENDING') {
      throw new Error('Only pending ads can be rejected');
    }

    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: 'REJECTED',
        rejectedReason: reason,
      },
      include: {
        User: true,
      },
    });

    // רישום לוג
    await this.logAdminAction(
      adminId,
      adId,
      'REJECT',
      'PENDING',
      'REJECTED',
      reason
    );

    // שליחת מייל דחייה
    try {
      console.log('📧 Attempting to send rejection email...', {
        adId: ad.id,
        userEmail: ad.User.email,
        reason: reason,
      });
      
      await this.emailService.sendAdRejectedEmail(
        ad.User.email,
        ad.title,
        reason
      );
      
      console.log('✅ Rejection email sent successfully', { 
        adId: updatedAd.id,
        to: ad.User.email 
      });
    } catch (error) {
      console.error('❌ Failed to send rejection email:', error);
    }

    return updatedAd;
  }

  async getAllAds(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: AdStatus | string;
      search?: string;
      adNumber?: string;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      // Handle comma-separated statuses from query params
      if (typeof filters.status === 'string' && filters.status.includes(',')) {
        const statuses = filters.status.split(',').map(s => s.trim()) as AdStatus[];
        where.status = { in: statuses };
      } else {
        where.status = filters.status;
      }
    }

    if (filters?.adNumber) {
      const adNum = parseInt(filters.adNumber, 10);
      if (!isNaN(adNum)) {
        where.adNumber = adNum;
      }
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
        { User: {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
              { phone: { contains: filters.search } },
            ],
          },
        },
      ];
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Category: true,
          City: true,
          Street: true,
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      }),
      prisma.ad.count({ where }),
    ]);

    return {
      ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateAdStatus(
    adId: string,
    status: AdStatus,
    adminId: string
  ) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: true,
        City: true,
      }
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    const oldStatus = ad.status;

    // עדכון הסטטוס
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: { 
        status,
        publishedAt: status === 'ACTIVE' ? new Date() : ad.publishedAt,
      },
      include: {
        User: true,
        Category: true,
        City: true,
      },
    });

    // רישום לוג
    await this.logAdminAction(
      adminId,
      adId,
      'STATUS_CHANGE',
      oldStatus,
      status
    );

    // ✅ טיפול בלוח מודעות לפי שינוי הסטטוס
    try {
      const { newspaperSheetService } = await import('../newspaper-sheets/newspaper-sheet.service.js');

      // אם השתנה ל-ACTIVE - הוסף ללוח מודעות
      if (status === 'ACTIVE' && oldStatus !== 'ACTIVE') {
        if (ad.cityId) {
          console.log(`📰 Adding ad ${adId} to newspaper sheet (status changed to ACTIVE)...`);
          
          // קבלת או יצירת גיליון פעיל
          const sheet = await newspaperSheetService.getOrCreateActiveSheet(
            ad.categoryId,
            ad.cityId,
            adminId
          );

          // הוספת המודעה לגיליון
          await newspaperSheetService.addListingToSheet(
            sheet.id,
            adId,
            adminId
          );

          console.log(`✅ Ad ${adId} added to newspaper sheet ${sheet.id}`);

          // יצירת PDF לגיליון
          const pdfResult = await newspaperSheetService.generateSheetPDF(sheet.id, adminId);
          console.log(`✅ PDF generated: ${pdfResult.pdfPath}`);
        }
      }
      
      // אם השתנה מ-ACTIVE לסטטוס אחר - הסר מלוח מודעות
      if (oldStatus === 'ACTIVE' && status !== 'ACTIVE') {
        console.log(`🗑️ Removing ad ${adId} from newspaper sheets (status changed from ACTIVE)...`);
        
        // מציאת כל הגיליונות שמכילים את הנכס
        const sheetListings = await prisma.newspaperSheetListing.findMany({
          where: { listingId: adId },
          select: { 
            sheetId: true,
            sheet: {
              select: {
                id: true,
                _count: {
                  select: { listings: true }
                }
              }
            }
          }
        });

        const sheetsToUpdate: string[] = [];
        const sheetsToDelete: string[] = [];

        // בדיקה לכל גיליון
        for (const sheetListing of sheetListings) {
          const listingsCount = sheetListing.sheet._count.listings;
          
          if (listingsCount === 1) {
            // זה הנכס היחיד - נמחק את הגיליון
            sheetsToDelete.push(sheetListing.sheetId);
          } else {
            // יש עוד נכסים - נעדכן PDF
            sheetsToUpdate.push(sheetListing.sheetId);
          }
        }

        // מחיקת הקישור לנכס (אוטומטית ע"י Cascade או ידנית)
        await prisma.newspaperSheetListing.deleteMany({
          where: { listingId: adId }
        });

        // מחיקת גיליונות ריקים
        if (sheetsToDelete.length > 0) {
          await prisma.newspaperSheet.deleteMany({
            where: { id: { in: sheetsToDelete } }
          });
          console.log(`✅ Deleted ${sheetsToDelete.length} empty newspaper sheet(s)`);
        }

        // עדכון PDF לגיליונות שנותרו
        if (sheetsToUpdate.length > 0) {
          for (const sheetId of sheetsToUpdate) {
            try {
              await newspaperSheetService.generateSheetPDF(sheetId, adminId, true);
              console.log(`✅ PDF regenerated for sheet ${sheetId}`);
            } catch (pdfError) {
              console.error(`❌ Failed to regenerate PDF:`, pdfError);
            }
          }
        }

        console.log(`✅ Ad ${adId} removed from newspaper sheets`);
      }
    } catch (error) {
      console.error(`❌ Failed to update newspaper sheets for ad ${adId}:`, error);
      // לא זורקים שגיאה - כשלון בעדכון לוח מודעות לא צריך לחסום את שינוי הסטטוס
    }

    return updatedAd;
  }

  async deleteUserAds(userId: string) {
    const result = await prisma.ad.deleteMany({
      where: { userId },
    });

    return result;
  }

  async getStatistics() {
    const [
      totalUsers,
      totalAds,
      pendingAds,
      approvedAds,
      activeAds,
      totalCategories,
      totalCities,
      todayAds,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.ad.count(),
      prisma.ad.count({ where: { status: 'PENDING' } }),
      prisma.ad.count({ where: { status: { in: ['APPROVED', 'ACTIVE'] } } }),
      prisma.ad.count({ where: { status: 'ACTIVE' } }),
      prisma.category.count(),
      prisma.city.count(),
      prisma.ad.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const topCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { Ad: true },
        },
      },
      orderBy: {
        Ad: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      totalUsers,
      totalAds,
      pendingAds,
      approvedAds,
      activeAds,
      totalCategories,
      totalCities,
      todayAds,
      topCategories,
    };
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          companyName: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: { Ad: true },
          },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(userId: string, data: { isAdmin?: boolean; role?: string }) {
    // אם נשלח isAdmin, המר אותו ל-role
    const updateData: any = {};
    if (data.isAdmin !== undefined) {
      updateData.role = data.isAdmin ? 'ADMIN' : 'USER';
    }
    if (data.role) {
      updateData.role = data.role;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        companyName: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { Ad: true },
        },
      },
    });

    return user;
  }

  async deleteUser(userId: string) {
    // מחק קודם את כל המודעות של המשתמש
    await prisma.ad.deleteMany({
      where: { userId },
    });

    // מחק את המשתמש
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'המשתמש נמחק בהצלחה' };
  }

  async exportAdsHistory(
    filters: {
      dateFrom?: string;
      dateTo?: string;
      categoryId?: string;
      statuses?: AdStatus[];
    },
    adminId: string
  ) {
    // Build where clause
    const where: any = {};

    if (filters.dateFrom) {
      where.createdAt = { gte: new Date(filters.dateFrom) };
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      where.createdAt = { ...where.createdAt, lte: toDate };
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.statuses && filters.statuses.length > 0) {
      where.status = { in: filters.statuses };
    }

    // Fetch ads with all related data
    const ads = await prisma.ad.findMany({
      where,
      include: {
        User: true,
        Category: true,
        City: true,
        Street: true,
        AdminAdLog: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 status changes
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Log audit event
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'EXPORT_AD_HISTORY',
        targetId: 'BULK',
        meta: {
          filters,
          recordCount: ads.length,
        },
      },
    });

    // Convert to CSV
    const csvHeaders = [
      'מספר מודעה',
      'תאריך יצירה',
      'כתובת',
      'עיר',
      'רחוב',
      'שכונה',
      'קטגוריה',
      'מחיר',
      'סטטוס',
      'צפיות',
      'לחיצות קשר',
      'שם מפרסם',
      'אימייל מפרסם',
      'טלפון מפרסם',
      'תאריך פרסום',
      'תאריך פקיעה',
      'תאריך הסרה',
      'סיבת דחייה',
      'תיאור (50 תווים ראשונים)',
    ].join(',');

    const csvRows = ads.map(ad => {
      // Truncate description to first 50 chars
      const shortDesc = ad.description 
        ? ad.description.substring(0, 50).replace(/"/g, '""') 
        : '';
      
      return [
        ad.adNumber,
        new Date(ad.createdAt).toLocaleDateString('he-IL'),
        `"${(ad.address || '').replace(/"/g, '""')}"`,
        `"${(ad.City?.nameHe || '').replace(/"/g, '""')}"`,
        `"${(ad.Street?.name || '').replace(/"/g, '""')}"`,
        `"${(ad.neighborhood || '').replace(/"/g, '""')}"`,
        `"${(ad.Category?.nameHe || '').replace(/"/g, '""')}"`,
        ad.price || '',
        ad.status,
        ad.views || 0,
        ad.contactClicks || 0,
        `"${(ad.User?.name || '').replace(/"/g, '""')}"`,
        `"${(ad.User?.email || '').replace(/"/g, '""')}"`,
        `"${(ad.User?.phone || '').replace(/"/g, '""')}"`,
        ad.publishedAt ? new Date(ad.publishedAt).toLocaleDateString('he-IL') : '',
        ad.expiresAt ? new Date(ad.expiresAt).toLocaleDateString('he-IL') : '',
        ad.removedAt ? new Date(ad.removedAt).toLocaleDateString('he-IL') : '',
        `"${(ad.rejectedReason || ad.rejectionReason || '').replace(/"/g, '""')}"`,
        `"${shortDesc}"`,
      ].join(',');
    });

    // Add BOM for Hebrew support in Excel
    const BOM = '\uFEFF';
    return BOM + [csvHeaders, ...csvRows].join('\n');
  }

  // ✅ אישור שינויים ממתינים
  async approvePendingChanges(adId: string, adminId: string) {
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
      },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (!ad.hasPendingChanges || !ad.pendingChanges) {
      throw new Error('No pending changes to approve');
    }

    const pendingChanges = ad.pendingChanges as any;
    
    // טיפול בתמונות אם יש שינויים
    if (pendingChanges.images && Array.isArray(pendingChanges.images)) {
      // מחיקת התמונות הקיימות
      await prisma.adImage.deleteMany({
        where: { adId },
      });

      // יצירת התמונות החדשות
      if (pendingChanges.images.length > 0) {
        const processedImages = [];
        
        for (let index = 0; index < pendingChanges.images.length; index++) {
          const img = pendingChanges.images[index];
          let imageUrl = img.url;
          
          // אם התמונה היא base64 (תמונה חדשה שטרם הועלתה)
          if (imageUrl && imageUrl.startsWith('data:image')) {
            try {
              // המרת base64 לקובץ
              const base64Data = imageUrl.split(',')[1];
              const buffer = Buffer.from(base64Data, 'base64');
              
              // יצירת שם קובץ ייחודי
              const filename = `${crypto.randomBytes(16).toString('hex')}.jpg`;
              const uploadDir = path.join(process.cwd(), 'uploads');
              
              // וידוא שתיקיית uploads קיימת
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              
              const filePath = path.join(uploadDir, filename);
              
              // שמירת הקובץ
              fs.writeFileSync(filePath, buffer);
              
              // עדכון ל-URL יחסי
              imageUrl = `/uploads/${filename}`;
            } catch (error) {
              console.error('Failed to process base64 image:', error);
              // אם נכשל, נשתמש ב-URL המקורי
            }
          }
          
          processedImages.push({
            id: crypto.randomUUID(),
            adId,
            url: imageUrl,
            order: img.order ?? index,
          });
        }
        
        if (processedImages.length > 0) {
          await prisma.adImage.createMany({
            data: processedImages,
          });
        }
      }
    }
    
    // החלת השינויים על המודעה
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        title: pendingChanges.title || ad.title,
        description: pendingChanges.description !== undefined ? pendingChanges.description : ad.description,
        price: pendingChanges.price !== undefined ? pendingChanges.price : ad.price,
        categoryId: pendingChanges.categoryId || ad.categoryId,
        adType: pendingChanges.adType !== undefined ? pendingChanges.adType : ad.adType,
        cityId: pendingChanges.cityId || ad.cityId,
        streetId: pendingChanges.streetId || ad.streetId,
        address: pendingChanges.address !== undefined ? pendingChanges.address : ad.address,
        latitude: pendingChanges.latitude !== undefined ? pendingChanges.latitude : ad.latitude,
        longitude: pendingChanges.longitude !== undefined ? pendingChanges.longitude : ad.longitude,
        customFields: pendingChanges.customFields || ad.customFields,
        neighborhood: pendingChanges.neighborhood !== undefined ? pendingChanges.neighborhood : ad.neighborhood,
        hasPendingChanges: false,
        pendingChanges: Prisma.DbNull,
        pendingChangesAt: null,
      },
      include: {
        User: true,
        Category: true,
        City: true,
        Street: {
          include: {
            Neighborhood: true,
          },
        },
        AdImage: true,
      },
    });

    // רישום לוג
    await this.logAdminAction(
      adminId,
      adId,
      'APPROVE_CHANGES',
      undefined,
      undefined,
      'שינויים אושרו והוחלו על המודעה'
    );

    console.log(`✅ Admin ${adminId} approved changes for ad ${adId}`);

    return updatedAd;
  }

  // ✅ דחייה של שינויים ממתינים
  async rejectPendingChanges(adId: string, adminId: string, reason?: string) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (!ad.hasPendingChanges || !ad.pendingChanges) {
      throw new Error('No pending changes to reject');
    }

    // מחיקת השינויים הממתינים
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        hasPendingChanges: false,
        pendingChanges: Prisma.DbNull,
        pendingChangesAt: null,
      },
      include: {
        User: true,
        Category: true,
        City: true,
        Street: {
          include: {
            Neighborhood: true,
          },
        },
        AdImage: true,
      },
    });

    // רישום לוג
    await this.logAdminAction(
      adminId,
      adId,
      'REJECT_CHANGES',
      undefined,
      undefined,
      reason || 'שינויים נדחו'
    );

    console.log(`❌ Admin ${adminId} rejected changes for ad ${adId}`);

    return updatedAd;
  }

  // ✅ קבלת מודעות עם שינויים ממתינים
  async getAdsWithPendingChanges(
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where: {
          hasPendingChanges: true,
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          Category: true,
          City: true,
          Street: {
            include: {
              Neighborhood: true,
            },
          },
          AdImage: true,
        },
        orderBy: {
          pendingChangesAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.ad.count({
        where: {
          hasPendingChanges: true,
        },
      }),
    ]);

    return {
      ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }}

export const adminService = new AdminService();