import { prisma } from '../../lib/prisma';
import { 
  ContentItemType, 
  ContentItemStatus, 
  MailingListStatus,
  DistributionMode,
  DispatchStatus 
} from '@prisma/client';
import { AdminAuditService } from './admin-audit.service';
import { EmailService } from '../email/email.service';
import ExcelJS from 'exceljs';

const emailService = new EmailService();

export interface CreateContentItemDto {
  title: string;
  type: ContentItemType;
  url: string;
  thumbnailUrl?: string;
  createdBy: string;
}

export interface UpdateContentItemDto {
  title?: string;
  status?: ContentItemStatus;
  thumbnailUrl?: string;
}

export interface DistributeContentDto {
  contentItemId: string;
  mode: DistributionMode;
  distributedBy: string;
  recipientEmails?: string[];
}

export interface AddSubscriberDto {
  email: string;
  name?: string;
}

export interface UpdateSubscriberDto {
  status?: MailingListStatus;
  name?: string;
  emailUpdatesEnabled?: boolean;
  emailUpdatesCategories?: string[];
  adminId: string;
}

export class ContentDistributionService {
  /**
   * Get all content items
   */
  async getContentItems() {
    return await prisma.contentItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ContentDistribution: {
          take: 1,
          orderBy: { distributedAt: 'desc' }
        }
      }
    });
  }

  /**
   * Create a new content item
   */
  async createContentItem(data: CreateContentItemDto) {
    const contentItem = await prisma.contentItem.create({
      data: {
        title: data.title,
        type: data.type,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        createdBy: data.createdBy,
        status: ContentItemStatus.NOT_DISTRIBUTED,
      },
    });

    // Audit log
    await AdminAuditService.log({
      adminId: data.createdBy,
      action: 'CREATE_CONTENT_ITEM',
      targetId: contentItem.id,
      entityType: 'ContentItem',
      meta: { title: data.title, type: data.type },
    });

    return contentItem;
  }

  /**
   * Update content item
   */
  async updateContentItem(id: string, data: UpdateContentItemDto, adminId: string) {
    const contentItem = await prisma.contentItem.update({
      where: { id },
      data: {
        title: data.title,
        status: data.status,
        thumbnailUrl: data.thumbnailUrl,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: 'UPDATE_CONTENT_ITEM',
      targetId: id,
      entityType: 'ContentItem',
      meta: data,
    });

    return contentItem;
  }

  /**
   * Delete content item
   */
  async deleteContentItem(id: string, adminId: string) {
    const contentItem = await prisma.contentItem.delete({
      where: { id },
    });

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: 'DELETE_CONTENT_ITEM',
      targetId: id,
      entityType: 'ContentItem',
      meta: { title: contentItem.title },
    });

    return contentItem;
  }

  /**
   * Distribute content via email
   */
  async distributeContent(data: DistributeContentDto) {
    const contentItem = await prisma.contentItem.findUnique({
      where: { id: data.contentItemId },
    });

    if (!contentItem) {
      throw new Error('Content item not found');
    }

    // Get recipients
    let recipientEmails: string[];
    if (data.recipientEmails && data.recipientEmails.length > 0) {
      recipientEmails = data.recipientEmails;
    } else {
      const subscribers = await prisma.mailingListSubscriber.findMany({
        where: { status: MailingListStatus.ACTIVE },
        select: { email: true },
      });
      recipientEmails = subscribers.map(s => s.email);
    }

    // Create distribution record
    const distribution = await prisma.contentDistribution.create({
      data: {
        contentItemId: data.contentItemId,
        mode: data.mode,
        recipientsCount: recipientEmails.length,
        distributedBy: data.distributedBy,
        successCount: 0,
        failedCount: 0,
      },
    });

    let successCount = 0;
    let failedCount = 0;

    // Send emails
    for (const email of recipientEmails) {
      try {
        await this.sendContentEmail(email, contentItem);

        // Log successful dispatch
        await prisma.contentDispatchLog.create({
          data: {
            contentDistributionId: distribution.id,
            fileName: contentItem.title,
            fileUrl: contentItem.url,
            recipientEmail: email,
            status: DispatchStatus.SENT,
          },
        });

        successCount++;
      } catch (error: any) {
        // Log failed dispatch
        await prisma.contentDispatchLog.create({
          data: {
            contentDistributionId: distribution.id,
            fileName: contentItem.title,
            fileUrl: contentItem.url,
            recipientEmail: email,
            status: DispatchStatus.FAILED,
            errorMessage: error.message,
          },
        });

        failedCount++;
      }
    }

    // Update distribution counts
    await prisma.contentDistribution.update({
      where: { id: distribution.id },
      data: {
        successCount,
        failedCount,
      },
    });

    // Update content item
    await prisma.contentItem.update({
      where: { id: data.contentItemId },
      data: {
        lastDistributedAt: new Date(),
        distributionCount: { increment: 1 },
        status: ContentItemStatus.ACTIVE,
      },
    });

    // Audit log
    await AdminAuditService.log({
      adminId: data.distributedBy,
      action: 'DISTRIBUTE_CONTENT',
      targetId: data.contentItemId,
      entityType: 'ContentItem',
      meta: {
        mode: data.mode,
        recipientsCount: recipientEmails.length,
        successCount,
        failedCount,
      },
    });

    return {
      distributionId: distribution.id,
      totalRecipients: recipientEmails.length,
      successCount,
      failedCount,
    };
  }

  /**
   * Send content email to a recipient
   */
  private async sendContentEmail(recipientEmail: string, contentItem: any) {
    const subject = `תוכן חדש: ${contentItem.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">${contentItem.title}</h2>
            ${contentItem.thumbnailUrl ? `
              <div style="text-align: center; margin: 20px 0;">
                <img src="${contentItem.thumbnailUrl}" alt="${contentItem.title}" style="max-width: 100%; height: auto; border-radius: 8px;" />
              </div>
            ` : ''}
            <p style="font-size: 16px; line-height: 1.6; text-align: center;">
              ${contentItem.type === 'PDF' ? 'לצפייה או הורדה של המסמך' : 'לצפייה בתוכן'}, לחץ על הכפתור הבא:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${contentItem.url}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                ${contentItem.type === 'PDF' ? 'פתח PDF' : 'פתח קישור'}
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              קיבלת מייל זה כי אתה רשום לרשימת התפוצה שלנו.
              <br/>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?email=${encodeURIComponent(recipientEmail)}" 
                 style="color: #2563eb; text-decoration: none;">
                ביטול הרשמה
              </a>
            </p>
          </div>
        </body>
      </html>
    `;

    await emailService.sendEmail(recipientEmail, subject, html);
  }

  /**
   * Get all mailing list subscribers
   */
  async getSubscribers(status?: MailingListStatus) {
    const where: any = {};
    if (status !== undefined) {
      where.status = status;
    }

    return await prisma.mailingListSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Add subscriber
   */
  async addSubscriber(data: AddSubscriberDto, adminId: string) {
    const subscriber = await prisma.mailingListSubscriber.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        status: MailingListStatus.ACTIVE,
        unsubscribedAt: null,
        blockedAt: null,
      },
      create: {
        email: data.email,
        name: data.name,
        status: MailingListStatus.ACTIVE,
        unsubscribeToken: this.generateUnsubscribeToken(),
      },
    });

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: 'ADD_MAILING_SUBSCRIBER',
      targetId: subscriber.id,
      entityType: 'MailingListSubscriber',
      meta: { email: data.email },
    });

    return subscriber;
  }

  /**
   * Update subscriber
   */
  async updateSubscriber(id: string, data: UpdateSubscriberDto) {
    const updateData: any = {};
    
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === MailingListStatus.OPT_OUT) {
        updateData.unsubscribedAt = new Date();
      } else if (data.status === MailingListStatus.BLOCKED) {
        updateData.blockedAt = new Date();
        updateData.blockedBy = data.adminId;
      }
    }

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.emailUpdatesEnabled !== undefined) {
      updateData.emailUpdatesEnabled = data.emailUpdatesEnabled;
    }

    if (data.emailUpdatesCategories !== undefined) {
      updateData.emailUpdatesCategories = data.emailUpdatesCategories;
    }

    const subscriber = await prisma.mailingListSubscriber.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await AdminAuditService.log({
      adminId: data.adminId,
      action: 'UPDATE_MAILING_SUBSCRIBER',
      targetId: id,
      entityType: 'MailingListSubscriber',
      meta: data,
    });

    return subscriber;
  }

  /**
   * Remove/Block subscriber
   */
  async removeSubscriber(id: string, adminId: string) {
    const subscriber = await prisma.mailingListSubscriber.update({
      where: { id },
      data: {
        status: MailingListStatus.BLOCKED,
        blockedAt: new Date(),
        blockedBy: adminId,
      },
    });

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: 'REMOVE_MAILING_SUBSCRIBER',
      targetId: id,
      entityType: 'MailingListSubscriber',
      meta: { email: subscriber.email },
    });

    return subscriber;
  }

  /**
   * Unsubscribe via token (public endpoint)
   */
  async unsubscribeByToken(token: string) {
    const subscriber = await prisma.mailingListSubscriber.findFirst({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      throw new Error('Invalid unsubscribe token');
    }

    return await prisma.mailingListSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: MailingListStatus.OPT_OUT,
        unsubscribedAt: new Date(),
      },
    });
  }

  /**
   * Unsubscribe by email (public endpoint)
   */
  async unsubscribeByEmail(email: string) {
    const subscriber = await prisma.mailingListSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      throw new Error('Email not found in mailing list');
    }

    return await prisma.mailingListSubscriber.update({
      where: { email },
      data: {
        status: MailingListStatus.OPT_OUT,
        unsubscribedAt: new Date(),
      },
    });
  }

  /**
   * Get distribution statistics
   */
  async getStats() {
    const [
      totalSubscribers,
      activeSubscribers,
      optOutSubscribers,
      blockedSubscribers,
      totalContentItems,
      activeContentItems,
      totalDistributions,
      recentDistributions,
      lastDistribution,
    ] = await Promise.all([
      prisma.mailingListSubscriber.count(),
      prisma.mailingListSubscriber.count({ where: { status: MailingListStatus.ACTIVE } }),
      prisma.mailingListSubscriber.count({ where: { status: MailingListStatus.OPT_OUT } }),
      prisma.mailingListSubscriber.count({ where: { status: MailingListStatus.BLOCKED } }),
      prisma.contentItem.count(),
      prisma.contentItem.count({ where: { status: ContentItemStatus.ACTIVE } }),
      prisma.contentDistribution.count(),
      prisma.contentDistribution.count({
        where: {
          distributedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.contentDistribution.findFirst({
        orderBy: { distributedAt: 'desc' },
        include: {
          contentItem: {
            select: { title: true, type: true },
          },
        },
      }),
    ]);

    // Get last distribution stats
    let lastDistributionStats = null;
    if (lastDistribution) {
      const dispatchLogs = await prisma.contentDispatchLog.count({
        where: { contentDistributionId: lastDistribution.id },
      });

      lastDistributionStats = {
        date: lastDistribution.distributedAt,
        contentTitle: lastDistribution.contentItem.title,
        contentType: lastDistribution.contentItem.type,
        recipientsReached: lastDistribution.successCount,
        totalRecipients: lastDistribution.recipientsCount,
        mode: lastDistribution.mode,
      };
    }

    return {
      subscribers: {
        total: totalSubscribers,
        active: activeSubscribers,
        optOut: optOutSubscribers,
        blocked: blockedSubscribers,
      },
      content: {
        total: totalContentItems,
        active: activeContentItems,
      },
      distributions: {
        total: totalDistributions,
        last30Days: recentDistributions,
        last: lastDistributionStats,
      },
    };
  }

  /**
   * Export statistics to Excel
   */
  async exportStats(adminId: string, userRole: string) {
    // Check permission - only ADMIN and SUPER_ADMIN can export
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new Error('Insufficient permissions to export statistics');
    }

    const stats = await this.getStats();

    // Get detailed distribution history
    const distributions = await prisma.contentDistribution.findMany({
      take: 100,
      orderBy: { distributedAt: 'desc' },
      include: {
        contentItem: {
          select: { title: true, type: true },
        },
      },
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('סיכום');
    summarySheet.columns = [
      { header: 'קטגוריה', key: 'category', width: 30 },
      { header: 'ערך', key: 'value', width: 20 },
    ];
    
    summarySheet.addRows([
      { category: 'סה"כ מנויים', value: stats.subscribers.total },
      { category: 'מנויים פעילים', value: stats.subscribers.active },
      { category: 'הסירו עצמם', value: stats.subscribers.optOut },
      { category: 'חסומים', value: stats.subscribers.blocked },
      { category: 'סה"כ פריטי תוכן', value: stats.content.total },
      { category: 'פריטי תוכן פעילים', value: stats.content.active },
      { category: 'סה"כ תפוצות', value: stats.distributions.total },
      { category: 'תפוצות ב-30 יום אחרונים', value: stats.distributions.last30Days },
    ]);

    // Distributions sheet
    const distributionsSheet = workbook.addWorksheet('תפוצות');
    distributionsSheet.columns = [
      { header: 'תאריך', key: 'date', width: 20 },
      { header: 'כותרת', key: 'title', width: 40 },
      { header: 'סוג', key: 'type', width: 15 },
      { header: 'מצב', key: 'mode', width: 15 },
      { header: 'סה"כ נמענים', key: 'total', width: 15 },
      { header: 'הצלחות', key: 'success', width: 15 },
      { header: 'כשלונות', key: 'failed', width: 15 },
    ];

    distributionsSheet.addRows(
      distributions.map(d => ({
        date: d.distributedAt.toISOString(),
        title: d.contentItem.title,
        type: d.contentItem.type,
        mode: d.mode,
        total: d.recipientsCount,
        success: d.successCount,
        failed: d.failedCount,
      }))
    );

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: 'EXPORT_CONTENT_DISTRIBUTION_STATS',
      entityType: 'ContentDistribution',
      meta: { format: 'xlsx', recordCount: distributions.length },
    });

    return workbook;
  }

  /**
   * Get distribution history
   */
  async getDistributionHistory(limit: number = 50) {
    return await prisma.contentDistribution.findMany({
      take: limit,
      orderBy: { distributedAt: 'desc' },
      include: {
        contentItem: {
          select: { title: true, type: true },
        },
      },
    });
  }

  /**
   * Generate unsubscribe token
   */
  private generateUnsubscribeToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const contentDistributionService = new ContentDistributionService();
