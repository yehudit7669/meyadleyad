/**
 * WhatsApp Audit Log Service
 * תיעוד כל פעולות ההפצה ל-WhatsApp
 */

import prisma from '../../../config/database';

export type WhatsAppAction =
  | 'approve_listing'
  | 'approve_and_whatsapp'
  | 'create_distribution_items'
  | 'create_manual_distribution'
  | 'mark_in_progress'
  | 'mark_sent'
  | 'mark_sent_manual'
  | 'mark_deferred'
  | 'mark_failed'
  | 'override_resend'
  | 'create_digest'
  | 'create_group'
  | 'update_group'
  | 'pause_group'
  | 'activate_group'
  | 'suggest_group'
  | 'approve_suggestion'
  | 'reject_suggestion';

export type EntityType = 'ad' | 'distribution_item' | 'group' | 'channel' | 'digest' | 'suggestion';

export interface AuditLogData {
  action: WhatsAppAction;
  actorUserId: string;
  entityType: EntityType;
  entityId: string;
  payload?: Record<string, any>;
}

export class WhatsAppAuditService {
  /**
   * רישום פעולה ב-audit log
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.whatsAppAuditLog.create({
        data: {
          action: data.action,
          actorUserId: data.actorUserId,
          entityType: data.entityType,
          entityId: data.entityId,
          payload: data.payload || {},
        },
      });

      // Console log for immediate visibility
      console.log(`📝 WhatsApp Audit: ${data.action} by ${data.actorUserId} on ${data.entityType}/${data.entityId}`);
    } catch (error) {
      console.error('❌ Failed to write audit log:', error);
      // Don't throw - audit log failure shouldn't block operations
    }
  }

  /**
   * קבלת היסטוריית פעולות למודעה ספציפית
   */
  async getAdHistory(adId: string, limit: number = 50) {
    return prisma.whatsAppAuditLog.findMany({
      where: {
        OR: [
          { entityType: 'ad', entityId: adId },
          {
            entityType: 'distribution_item',
            payload: {
              path: ['adId'],
              equals: adId,
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * קבלת היסטוריית פעולות לקבוצה
   */
  async getGroupHistory(groupId: string, limit: number = 50) {
    return prisma.whatsAppAuditLog.findMany({
      where: {
        OR: [
          { entityType: 'group', entityId: groupId },
          {
            entityType: 'distribution_item',
            payload: {
              path: ['groupId'],
              equals: groupId,
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * קבלת פעולות של משתמש
   */
  async getUserActions(userId: string, limit: number = 100) {
    return prisma.whatsAppAuditLog.findMany({
      where: { actorUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * קבלת סטטיסטיקות פעולות לפי סוג
   */
  async getActionStats(fromDate?: Date, toDate?: Date) {
    const where: any = {};

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const stats = await prisma.whatsAppAuditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    });

    return stats.map((stat) => ({
      action: stat.action,
      count: stat._count,
    }));
  }

  /**
   * קבלת override resend events (חריגות)
   */
  async getOverrideEvents(limit: number = 50) {
    return prisma.whatsAppAuditLog.findMany({
      where: {
        action: 'override_resend',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * ספירת פעולות היום
   */
  async getTodayActionCount(action?: WhatsAppAction): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: {
        gte: today,
      },
    };

    if (action) {
      where.action = action;
    }

    return prisma.whatsAppAuditLog.count({ where });
  }

  /**
   * מחיקת לוגים ישנים (cleanup)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.whatsAppAuditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} old audit logs (older than ${daysToKeep} days)`);
    return result.count;
  }
}

// Export singleton
export const auditService = new WhatsAppAuditService();
