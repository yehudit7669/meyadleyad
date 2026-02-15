/**
 * WhatsApp Distribution Controller
 * Controllers עבור אישור+שליחה, ניהול תור, וסטטיסטיקות
 */

import { Request, Response } from 'express';
import { distributionService } from './distribution/distribution.service';
import { routingEngine } from './distribution/routing-engine.service';
import { auditService } from './distribution/audit.service';
import { messageBuilder } from './distribution/message-builder.service';
import { WhatsAppAuthRequest } from './whatsapp-rbac.middleware';
import prisma from '../../config/database';
import { DistributionItemStatus } from '@prisma/client';

export class WhatsAppDistributionController {
  /**
   * יצירת distribution item ידנית (עבור אישור מודעה)
   * POST /api/admin/whatsapp/listings/:id/create-distribution
   */
  async createManualDistributionItem(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { id: adId } = req.params;
      const { status = 'PENDING' } = req.body; // PENDING או SENT
      const userId = req.user!.id;

      // Get ad with full details
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
        return res.status(404).json({
          status: 'error',
          message: 'מודעה לא נמצאה',
        });
      }

      // Find matching groups
      const matches = await routingEngine.findMatchingGroups(adId);

      // If no matches, create placeholder item with groupId = null
      if (matches.length === 0) {
        console.log(`⚠️ No matching groups found for ad ${adId}, creating placeholder item`);
        
        // Build message payload
        const payload = messageBuilder.buildAdMessage(ad);
        
        // Check if placeholder already exists
        const existingPlaceholder = await prisma.distributionItem.findUnique({
          where: { dedupeKey: `${adId}-no-group` },
        });

        if (existingPlaceholder) {
          console.log(`⏭️ Placeholder already exists: ad ${adId} (status: ${existingPlaceholder.status})`);
          return res.json({
            status: 'success',
            message: 'המודעה אושרה ותופיע בתור הפצה ללא קבוצה מתאימה',
            items: [{
              id: existingPlaceholder.id,
              groupId: null,
              groupName: 'ממתין לקבוצה מתאימה',
              status: existingPlaceholder.status,
            }],
            created: 0,
            skipped: 1,
          });
        }

        // Create placeholder item
        const item = await prisma.distributionItem.create({
          data: {
            adId,
            groupId: null,
            status: status as any,
            priority: 0,
            payloadSnapshot: payload as any,
            dedupeKey: `${adId}-no-group`,
          },
        });

        console.log(`✅ Created placeholder item ${item.id} with groupId=null, status=${status}`);

        // Create audit log
        await auditService.log({
          action: 'create_manual_distribution',
          actorUserId: userId,
          entityType: 'distribution_item',
          entityId: item.id,
          payload: {
            adId,
            groupId: null,
            status,
          },
        });

        return res.json({
          status: 'success',
          message: 'המודעה אושרה ותופיע בתור הפצה ללא קבוצה מתאימה',
          items: [{
            id: item.id,
            groupId: null,
            groupName: 'ממתין לקבוצה מתאימה',
            status: item.status,
          }],
          created: 1,
          skipped: 0,
        });
      }

      // Build message payload
      const payload = messageBuilder.buildAdMessage(ad);

      // Create distribution items with specified status
      const items = [];
      let skippedCount = 0;
      
      for (const match of matches) {
        // Check if item already exists
        const existingItem = await prisma.distributionItem.findUnique({
          where: { dedupeKey: `${adId}-${match.groupId}` },
        });

        if (existingItem) {
          console.log(`⏭️ Item already exists: ad ${adId} → group ${match.groupId} (status: ${existingItem.status})`);
          skippedCount++;
          items.push({
            id: existingItem.id,
            groupId: match.groupId,
            groupName: match.groupName,
            status: existingItem.status,
            alreadyExists: true,
          });
          continue;
        }

        let itemStatus: DistributionItemStatus = DistributionItemStatus.PENDING;
        let sentAtDate: Date | null = null;
        
        if (status === 'SENT') {
          itemStatus = DistributionItemStatus.SENT as DistributionItemStatus;
          sentAtDate = new Date();
        } else if (status === 'IN_PROGRESS') {
          itemStatus = DistributionItemStatus.IN_PROGRESS as DistributionItemStatus;
        }
        
        const item = await prisma.distributionItem.create({
          data: {
            adId,
            groupId: match.groupId,
            status: itemStatus,
            priority: match.priority,
            payloadSnapshot: payload as any,
            dedupeKey: `${adId}-${match.groupId}`,
            sentAt: sentAtDate,
          },
        });

        items.push({
          id: item.id,
          groupId: match.groupId,
          groupName: match.groupName,
          status: item.status,
          alreadyExists: false,
        });
      }

      // Audit
      await auditService.log({
        action: 'create_manual_distribution',
        actorUserId: userId,
        entityType: 'ad',
        entityId: adId,
        payload: {
          itemsCreated: items.filter(i => !(i as any).alreadyExists).length,
          itemsSkipped: skippedCount,
          status,
        },
      });

      res.status(200).json({
        status: 'success',
        message: skippedCount > 0 
          ? `נוצרו ${items.filter(i => !(i as any).alreadyExists).length} פריטי הפצה, ${skippedCount} כבר קיימים`
          : `נוצרו ${items.length} פריטי הפצה`,
        data: {
          items,
          messageText: payload.messageText,
          skippedCount,
          alreadyExists: skippedCount > 0,
        },
      });
    } catch (error) {
      console.error('❌ Error in createManualDistributionItem:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה ביצירת הפצה',
      });
    }
  }

  /**
   * קבלת טקסט הודעה למודעה (ללא יצירת distribution item)
   * GET /api/admin/whatsapp/listings/:id/message-text
   */
  async getAdMessageText(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { id: adId } = req.params;

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
        return res.status(404).json({
          status: 'error',
          message: 'מודעה לא נמצאה',
        });
      }

      const payload = messageBuilder.buildAdMessage(ad);

      res.status(200).json({
        status: 'success',
        data: {
          text: payload.messageText,
        },
      });
    } catch (error) {
      console.error('❌ Error in getAdMessageText:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה בקבלת טקסט הודעה',
      });
    }
  }

  /**
   * אישור מודעה + יצירת distribution items
   * POST /api/admin/whatsapp/listings/:id/approve-and-distribute
   */
  async approveAndDistribute(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { id: adId } = req.params;
      const userId = req.user!.id;

      // First, approve the ad (use existing admin service)
      const { AdminService } = await import('../admin/admin.service.js');
      const adminService = new AdminService();
      
      const approvedAd = await adminService.approveAd(adId, userId);

      // Create distribution items
      const result = await distributionService.createDistributionItems(adId, userId);

      // Audit
      await auditService.log({
        action: 'approve_and_whatsapp',
        actorUserId: userId,
        entityType: 'ad',
        entityId: adId,
        payload: {
          distributionCreated: result.created,
          distributionSkipped: result.skipped,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'המודעה אושרה ונוצרו פריטי הפצה',
        data: {
          ad: approvedAd,
          distribution: result,
        },
      });
    } catch (error) {
      console.error('❌ Error in approveAndDistribute:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה ביצירת הפצה',
      });
    }
  }

  /**
   * קבלת תור ההפצה
   * GET /api/admin/whatsapp/queue
   */
  async getQueue(req: WhatsAppAuthRequest, res: Response) {
    try {
      const {
        groupId,
        channelId,
        status,
        cityId,
        categoryId,
        dateFrom,
        dateTo,
        limit,
        offset,
      } = req.query;

      const filters: any = {};

      if (groupId) filters.groupId = groupId as string;
      if (channelId) filters.channelId = channelId as string;
      if (cityId) filters.cityId = cityId as string;
      if (categoryId) filters.categoryId = categoryId as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      if (status) {
        const statuses = (status as string).split(',') as DistributionItemStatus[];
        filters.status = statuses.length === 1 ? statuses[0] : statuses;
      }

      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const result = await distributionService.getQueue(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      console.error('❌ Error in getQueue:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בטעינת התור',
      });
    }
  }

  /**
   * התחלת שליחה (mark in progress + get payload)
   * POST /api/admin/whatsapp/queue/:itemId/start
   */
  async startSending(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const userId = req.user!.id;

      const payload = await distributionService.markInProgress(itemId, userId);

      // Build WhatsApp links
      const webLink = messageBuilder.buildWhatsAppWebLink(payload.messageText);
      const appLink = messageBuilder.buildWhatsAppAppLink(payload.messageText);

      res.status(200).json({
        status: 'success',
        message: 'ההודעה מוכנה לשליחה',
        data: {
          itemId,
          payload,
          whatsappWebLink: webLink,
          whatsappAppLink: appLink,
          clipboardText: payload.messageText,
        },
      });
    } catch (error) {
      console.error('❌ Error in startSending:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה בהתחלת שליחה',
      });
    }
  }

  /**
   * סימון כנשלח
   * POST /api/admin/whatsapp/queue/:itemId/mark-sent
   */
  async markSent(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const userId = req.user!.id;

      await distributionService.markSent(itemId, userId);

      res.status(200).json({
        status: 'success',
        message: 'הפריט סומן כנשלח בהצלחה',
      });
    } catch (error) {
      console.error('❌ Error in markSent:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה בסימון כנשלח',
      });
    }
  }
  /**
   * סימון פריט כ-"בתהליך" (המנהל לחץ על הפץ ו-WhatsApp נפתח)
   * POST /api/admin/whatsapp/queue/:itemId/mark-in-progress
   */
  async markItemAsInProgress(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const userId = req.user!.id;

      const item = await prisma.distributionItem.findUnique({
        where: { id: itemId },
        include: {
          Group: true,
        },
      });

      if (!item) {
        return res.status(404).json({
          status: 'error',
          message: 'פריט לא נמצא',
        });
      }

      // Check if group exists and is active
      if (!item.Group) {
        return res.status(400).json({
          status: 'error',
          message: 'הקבוצה לא קיימת במערכת',
        });
      }

      if (item.Group.status !== 'ACTIVE') {
        return res.status(400).json({
          status: 'error',
          message: `לא ניתן לשלוח - הקבוצה "${item.Group.name}" ${item.Group.status === 'PAUSED' ? 'מושהית' : 'בארכיון'}`,
        });
      }

      // Update status to IN_PROGRESS
      const updatedItem = await prisma.distributionItem.update({
        where: { id: itemId },
        data: {
          status: DistributionItemStatus.IN_PROGRESS,
        },
      });

      // Audit
      await auditService.log({
        action: 'mark_in_progress',
        actorUserId: userId,
        entityType: 'distribution_item',
        entityId: itemId,
        payload: {
          adId: item.adId,
          groupId: item.groupId,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'הפריט סומן כבתהליך',
        data: updatedItem,
      });
    } catch (error) {
      console.error('❌ Error in markItemAsInProgress:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה בעדכון סטטוס',
      });
    }
  }

  /**
   * ביטול תהליך שליחה - החזרה ל-PENDING
   * POST /api/admin/whatsapp/queue/:itemId/cancel-sending
   */
  async cancelSending(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const userId = req.user!.id;

      const item = await prisma.distributionItem.findUnique({
        where: { id: itemId },
        include: { Ad: true },
      });

      if (!item) {
        return res.status(404).json({
          status: 'error',
          message: 'פריט לא נמצא',
        });
      }

      if (item.status !== DistributionItemStatus.IN_PROGRESS) {
        return res.status(400).json({
          status: 'error',
          message: 'ניתן לבטל רק פריטים בסטטוס "בתהליך"',
        });
      }

      // Update status back to PENDING
      const updatedItem = await prisma.distributionItem.update({
        where: { id: itemId },
        data: {
          status: DistributionItemStatus.PENDING,
        },
      });

      // אישור המודעה אם היא PENDING (המנהל החליט לא לשלח עכשיו)
      if (item.Ad.status === 'PENDING') {
        await prisma.ad.update({
          where: { id: item.adId },
          data: { status: 'APPROVED' },
        });
        console.log(`✅ Approved ad ${item.adId} after cancelling WhatsApp (will retry later)`);
      }

      // Audit
      await auditService.log({
        action: 'mark_in_progress',
        actorUserId: userId,
        entityType: 'distribution_item',
        entityId: itemId,
        payload: {
          adId: item.adId,
          groupId: item.groupId,
          action: 'cancel_sending',
          adApproved: item.Ad.status === 'PENDING',
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'התהליך בוטל, הפריט חזר לסטטוס ממתין והמודעה אושרה',
        data: updatedItem,
      });
    } catch (error) {
      console.error('❌ Error in cancelSending:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה בביטול תהליך',
      });
    }
  }

  /**
   * סימון פריט כנשלח (לאחר הפצה ידנית)
   * POST /api/admin/whatsapp/queue/:itemId/mark-sent
   */
  async markItemAsSent(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const userId = req.user!.id;

      const item = await prisma.distributionItem.findUnique({
        where: { id: itemId },
        include: { Ad: true },
      });

      if (!item) {
        return res.status(404).json({
          status: 'error',
          message: 'פריט לא נמצא',
        });
      }

      // Update status to SENT
      const updatedItem = await prisma.distributionItem.update({
        where: { id: itemId },
        data: {
          status: DistributionItemStatus.SENT,
          sentAt: new Date(),
        },
      });

      // אישור המודעה אם היא PENDING
      if (item.Ad.status === 'PENDING') {
        await prisma.ad.update({
          where: { id: item.adId },
          data: { status: 'APPROVED' },
        });
        console.log(`✅ Approved ad ${item.adId} after confirming WhatsApp sent`);
      }

      // Audit
      await auditService.log({
        action: 'mark_sent_manual',
        actorUserId: userId,
        entityType: 'distribution_item',
        entityId: itemId,
        payload: {
          adId: item.adId,
          groupId: item.groupId,
          adApproved: item.Ad.status === 'PENDING',
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'הפריט סומן כנשלח והמודעה אושרה',
        data: updatedItem,
      });
    } catch (error) {
      console.error('❌ Error in markItemAsSent:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה בעדכון סטטוס',
      });
    }
  }
  /**
   * דחייה
   * POST /api/admin/whatsapp/queue/:itemId/defer
   */
  async deferItem(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;

      await distributionService.deferItem(itemId, userId, reason);

      res.status(200).json({
        status: 'success',
        message: 'הפריט נדחה',
      });
    } catch (error) {
      console.error('❌ Error in deferItem:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בדחיית פריט',
      });
    }
  }

  /**
   * Override resend (מנהל ראשי בלבד)
   * POST /api/admin/whatsapp/queue/:itemId/override-resend
   */
  async overrideResend(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'יש לספק סיבה לשליחה חוזרת',
        });
      }

      await distributionService.overrideResend(itemId, userId, reason);

      res.status(200).json({
        status: 'success',
        message: 'הפריט הוחזר לתור',
      });
    } catch (error) {
      console.error('❌ Error in overrideResend:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה בשליחה חוזרת',
      });
    }
  }

  /**
   * יצירת Digest
   * POST /api/admin/whatsapp/groups/:groupId/create-digest
   */
  async createDigest(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { groupId } = req.params;
      const { itemIds } = req.body;
      const userId = req.user!.id;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'יש לספק רשימת פריטים',
        });
      }

      const digest = await distributionService.createDigest(groupId, userId, itemIds);

      res.status(200).json({
        status: 'success',
        message: 'Digest נוצר בהצלחה',
        data: digest,
      });
    } catch (error) {
      console.error('❌ Error in createDigest:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה ביצירת Digest',
      });
    }
  }

  /**
   * סימון Digest כנשלח
   * POST /api/admin/whatsapp/digests/:digestId/mark-sent
   */
  async markDigestSent(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { digestId } = req.params;
      const userId = req.user!.id;

      await distributionService.markDigestSent(digestId, userId);

      res.status(200).json({
        status: 'success',
        message: 'Digest סומן כנשלח',
      });
    } catch (error) {
      console.error('❌ Error in markDigestSent:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בסימון Digest',
      });
    }
  }

  /**
   * דוח יומי - לפי קבוצות
   * GET /api/admin/whatsapp/reports/daily
   */
  async getDailyReport(req: WhatsAppAuthRequest, res: Response) {
    try {
      const dateParam = req.query.date as string;
      const reportDate = dateParam ? new Date(dateParam) : new Date();
      reportDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(reportDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get all sent items for the day
      const sentItems = await prisma.distributionItem.findMany({
        where: {
          status: DistributionItemStatus.SENT,
          sentAt: {
            gte: reportDate,
            lt: nextDay,
          },
        },
        include: {
          Ad: {
            include: {
              Category: true,
              City: true,
            },
          },
          Group: true,
        },
      });

      // Get failed items for the day
      const failedItems = await prisma.distributionItem.count({
        where: {
          status: DistributionItemStatus.FAILED,
          updatedAt: {
            gte: reportDate,
            lt: nextDay,
          },
        },
      });

      // Calculate stats
      const totalSent = sentItems.length;
      const totalFailed = failedItems;
      const groupsUsed = new Set(sentItems.map(item => item.groupId)).size;

      // Group by category
      const categoryMap = new Map<string, number>();
      sentItems.forEach(item => {
        const categoryName = item.Ad?.Category?.nameHe || 'לא מוגדר';
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
      });

      const byCategory = Array.from(categoryMap.entries())
        .map(([categoryName, count]) => ({ categoryName, count }))
        .sort((a, b) => b.count - a.count);

      // Group by city
      const cityMap = new Map<string, number>();
      sentItems.forEach(item => {
        const cityName = item.Ad?.City?.nameHe || 'לא מוגדר';
        cityMap.set(cityName, (cityMap.get(cityName) || 0) + 1);
      });

      const byCity = Array.from(cityMap.entries())
        .map(([cityName, count]) => ({ cityName, count }))
        .sort((a, b) => b.count - a.count);

      res.status(200).json({
        status: 'success',
        data: {
          date: reportDate.toISOString().split('T')[0],
          totalSent,
          totalFailed,
          groupsUsed,
          byCategory,
          byCity,
        },
      });
    } catch (error) {
      console.error('❌ Error in getDailyReport:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בטעינת דוח יומי',
      });
    }
  }

  /**
   * Dashboard - KPIs
   * GET /api/admin/whatsapp/dashboard
   */
  async getDashboard(req: WhatsAppAuthRequest, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        sentToday,
        pendingItems,
        failedItems,
        totalItemsToday,
        activeGroups,
        totalGroups,
        quotaReachedGroups,
        overrideCount,
        digestCount,
        groupStats,
        recentActivity,
      ] = await Promise.all([
        // Items sent today
        prisma.distributionItem.count({
          where: {
            status: DistributionItemStatus.SENT,
            sentAt: { gte: today },
          },
        }),
        // Pending items
        prisma.distributionItem.count({
          where: {
            status: { in: [DistributionItemStatus.PENDING, DistributionItemStatus.IN_PROGRESS] },
          },
        }),
        // Failed items today
        prisma.distributionItem.count({
          where: {
            status: DistributionItemStatus.FAILED,
            updatedAt: { gte: today },
          },
        }),
        // Total items today (all statuses)
        prisma.distributionItem.count({
          where: {
            createdAt: { gte: today },
          },
        }),
        // Active groups
        prisma.whatsAppGroup.count({
          where: { status: 'ACTIVE' },
        }),
        // Total groups
        prisma.whatsAppGroup.count(),
        // Groups at quota (simplified - count groups with sent >= quota)
        prisma.$queryRaw`
          SELECT COUNT(DISTINCT "groupId")::int AS count
          FROM (
            SELECT "groupId", COUNT(*) as sent
            FROM "DistributionItem"
            WHERE status = 'SENT'
              AND "sentAt" >= ${today}
            GROUP BY "groupId"
          ) AS group_counts
          JOIN "WhatsAppGroup" g ON g.id = group_counts."groupId"
          WHERE group_counts.sent >= g."dailyQuota"
        `.then((result: any) => result[0]?.count || 0),
        auditService.getTodayActionCount('override_resend'),
        prisma.distributionDigest.count({
          where: {
            createdAt: { gte: today },
          },
        }),
        // Group stats - show how many items each group sent today
        prisma.$queryRaw`
          SELECT 
            g.id as "groupId",
            g.name as "groupName",
            COUNT(di.id)::int as sent,
            g."dailyQuota" as quota,
            CASE 
              WHEN COUNT(di.id) >= g."dailyQuota" THEN true 
              ELSE false 
            END as "quotaReached"
          FROM "WhatsAppGroup" g
          LEFT JOIN "DistributionItem" di ON di."groupId" = g.id 
            AND di.status = 'SENT' 
            AND di."sentAt" >= ${today}
          WHERE g.status = 'ACTIVE'
          GROUP BY g.id, g.name, g."dailyQuota"
          ORDER BY sent DESC
          LIMIT 10
        `.then((result: any) => result || []),
        // Recent activity - last 10 sent items
        prisma.distributionItem.findMany({
          where: {
            status: DistributionItemStatus.SENT,
          },
          include: {
            Group: true,
            Ad: {
              select: {
                id: true,
                adNumber: true,
              },
            },
          },
          orderBy: {
            sentAt: 'desc',
          },
          take: 10,
        }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          stats: {
            sentToday,
            pendingItems,
            failedItems,
            totalItemsToday,
            activeGroups,
            totalGroups,
            quotaReachedGroups,
            overrideCount,
            digestCount,
          },
          groupStats,
          recentActivity: recentActivity.map((item) => ({
            id: item.id,
            adNumber: item.Ad?.adNumber,
            groupName: item.Group?.name,
            sentAt: item.sentAt,
            status: item.status,
          })),
        },
      });
    } catch (error) {
      console.error('❌ Error in getDashboard:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בטעינת Dashboard',
      });
    }
  }
}

// Export singleton
export const whatsappDistributionController = new WhatsAppDistributionController();
