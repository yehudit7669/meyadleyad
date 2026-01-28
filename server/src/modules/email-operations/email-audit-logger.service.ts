/**
 * Email Audit Logger Service
 * תיעוד כל פעולה ו/או ניסיון פעולה דרך אימייל
 * 
 * דרישות:
 * 1. תיעוד כל פעולה: timestamp, email, action, adId, success/fail
 * 2. failReason פנימי (לא נחשף למשתמש)
 * 3. publicMessage - מה שנשלח למשתמש
 * 4. אינטגרציה עם Audit Log הקיים במערכת
 */

import { PrismaClient } from '@prisma/client';
import { EmailCommandType } from './email-command-parser.service';

const prisma = new PrismaClient();

export interface EmailAuditEntry {
  email: string;
  action: string;                  // תיאור הפעולה
  commandType: EmailCommandType;
  adId?: string;
  success: boolean;
  failReason?: string;             // סיבת כשל פנימית
  publicMessage?: string;          // הודעה שנשלחה למשתמש
  metadata?: Record<string, any>;  // מידע נוסף
  ip?: string;
  userAgent?: string;
  inboundMessageId?: string;
}

export class EmailAuditLogger {
  /**
   * רישום פעולה/ניסיון פעולה ב-Audit Log של מערכת האימייל
   */
  async logEmailOperation(entry: EmailAuditEntry): Promise<void> {
    try {
      await prisma.emailAuditLog.create({
        data: {
          email: entry.email.toLowerCase().trim(),
          action: entry.action,
          commandType: entry.commandType,
          adId: entry.adId,
          success: entry.success,
          failReason: entry.failReason,
          publicMessage: entry.publicMessage,
          metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : null,
          ip: entry.ip,
          userAgent: entry.userAgent,
          inboundMessageId: entry.inboundMessageId,
        },
      });

      // לוג לקונסול
      const status = entry.success ? '✅' : '❌';
      console.log(
        `${status} Email Audit: ${entry.email} - ${entry.action} (${entry.commandType})${
          entry.adId ? ` Ad#${entry.adId}` : ''
        }`
      );

      if (!entry.success && entry.failReason) {
        console.log(`   └─ Reason: ${entry.failReason}`);
      }
    } catch (error) {
      console.error('❌ Failed to write email audit log:', error);
      // לא נזרוק exception כי לא רוצים לעצור את זרימת העבודה
    }
  }

  /**
   * רישום גם ב-AuditLog הכללי של המערכת (אופציונלי)
   * מאפשר למנהלים לראות פעולות דרך אימייל ב-dashboard הכללי
   */
  async logToSystemAudit(params: {
    userId?: string;
    actionType: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ip?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: params.userId || null,
          actionType: params.actionType,
          entityType: params.entityType,
          entityId: params.entityId || null,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
          ip: params.ip || null,
        },
      });
    } catch (error) {
      console.error('❌ Failed to write system audit log:', error);
    }
  }

  /**
   * רישום הצלחה
   */
  async logSuccess(params: {
    email: string;
    action: string;
    commandType: EmailCommandType;
    adId?: string;
    metadata?: Record<string, any>;
    inboundMessageId?: string;
    userId?: string;
  }): Promise<void> {
    await this.logEmailOperation({
      email: params.email,
      action: params.action,
      commandType: params.commandType,
      adId: params.adId,
      success: true,
      metadata: params.metadata,
      inboundMessageId: params.inboundMessageId,
    });

    // רישום ב-AuditLog הכללי
    if (params.userId) {
      await this.logToSystemAudit({
        userId: params.userId,
        actionType: `EMAIL_OPERATION_${params.commandType}`,
        entityType: 'AD',
        entityId: params.adId,
        metadata: {
          source: 'email',
          commandType: params.commandType,
          ...params.metadata,
        },
      });
    }
  }

  /**
   * רישום כשל
   */
  async logFailure(params: {
    email: string;
    action: string;
    commandType: EmailCommandType;
    adId?: string;
    failReason: string;
    publicMessage: string;
    metadata?: Record<string, any>;
    inboundMessageId?: string;
  }): Promise<void> {
    await this.logEmailOperation({
      email: params.email,
      action: params.action,
      commandType: params.commandType,
      adId: params.adId,
      success: false,
      failReason: params.failReason,
      publicMessage: params.publicMessage,
      metadata: params.metadata,
      inboundMessageId: params.inboundMessageId,
    });
  }

  /**
   * קבלת היסטוריה לכתובת אימייל
   */
  async getEmailHistory(
    email: string,
    limit: number = 50
  ): Promise<
    Array<{
      id: string;
      action: string;
      commandType: string;
      adId: string | null;
      success: boolean;
      publicMessage: string | null;
      createdAt: Date;
    }>
  > {
    const normalizedEmail = email.toLowerCase().trim();

    const logs = await prisma.emailAuditLog.findMany({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        commandType: true,
        adId: true,
        success: true,
        publicMessage: true,
        createdAt: true,
      },
    });

    return logs;
  }

  /**
   * סטטיסטיקות: ספירת הצלחות/כשלונות
   */
  async getEmailStats(email: string): Promise<{
    totalRequests: number;
    successCount: number;
    failureCount: number;
    lastRequestAt: Date | null;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    const [total, successes, failures, latest] = await Promise.all([
      prisma.emailAuditLog.count({
        where: { email: normalizedEmail },
      }),
      prisma.emailAuditLog.count({
        where: { email: normalizedEmail, success: true },
      }),
      prisma.emailAuditLog.count({
        where: { email: normalizedEmail, success: false },
      }),
      prisma.emailAuditLog.findFirst({
        where: { email: normalizedEmail },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalRequests: total,
      successCount: successes,
      failureCount: failures,
      lastRequestAt: latest?.createdAt || null,
    };
  }

  /**
   * ניקוי לוגים ישנים (maintenance)
   */
  async cleanup(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.emailAuditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`🗑️ Cleaned up ${result.count} old email audit logs`);
    return result.count;
  }

  /**
   * דוח לוגים לפי commandType
   */
  async getCommandTypeReport(
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{
      commandType: string;
      totalCount: number;
      successCount: number;
      failureCount: number;
    }>
  > {
    const logs = await prisma.emailAuditLog.groupBy({
      by: ['commandType', 'success'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // צבירת הנתונים
    const report = new Map<
      string,
      { totalCount: number; successCount: number; failureCount: number }
    >();

    for (const log of logs) {
      const key = log.commandType;
      if (!report.has(key)) {
        report.set(key, { totalCount: 0, successCount: 0, failureCount: 0 });
      }
      const stats = report.get(key)!;
      stats.totalCount += log._count;
      if (log.success) {
        stats.successCount += log._count;
      } else {
        stats.failureCount += log._count;
      }
    }

    return Array.from(report.entries()).map(([commandType, stats]) => ({
      commandType,
      ...stats,
    }));
  }
}

// Export singleton instance
export const emailAuditLogger = new EmailAuditLogger();
