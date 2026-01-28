/**
 * Email Rate Limiter Service
 * הגבלת בקשות לפי כתובת אימייל + ניטור שגיאות
 * 
 * דרישות:
 * 1. הגבלת X בקשות לשעה לכל כתובת אימייל (ערך מקונפיג)
 * 2. ספירת שגיאות פורמט - אחרי Y שגיאות רצופות -> Cooldown
 * 3. תיעוד וניטור
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RateLimitConfig {
  maxRequestsPerHour: number;    // מקסימום בקשות לשעה
  maxConsecutiveErrors: number;  // מקסימום שגיאות רצופות
  cooldownMinutes: number;       // זמן cooldown במקרה של חריגה
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;            // כמה בקשות נותרו
  resetAt?: Date;                // מתי החלון מתאפס
  inCooldown?: boolean;
  cooldownEndsAt?: Date;
  reason?: string;
}

export class EmailRateLimiter {
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      maxRequestsPerHour: config?.maxRequestsPerHour || 20,
      maxConsecutiveErrors: config?.maxConsecutiveErrors || 5,
      cooldownMinutes: config?.cooldownMinutes || 30,
    };
  }

  /**
   * בדיקה האם כתובת מורשית לשלוח בקשה חדשה
   * @param email כתובת האימייל
   * @returns תוצאת rate limit
   */
  async checkRateLimit(email: string): Promise<RateLimitResult> {
    const normalizedEmail = email.toLowerCase().trim();

    // קבלת/יצירת רשומת rate limit
    let record = await prisma.emailRateLimit.findUnique({
      where: { email: normalizedEmail },
    });

    const now = new Date();

    // אם אין רשומה, ניצור אחת חדשה
    if (!record) {
      record = await prisma.emailRateLimit.create({
        data: {
          email: normalizedEmail,
          requestCount: 0,
          errorCount: 0,
          windowStartedAt: now,
          lastRequestAt: now,
        },
      });
    }

    // בדיקה אם בתוך cooldown
    if (record.inCooldown && record.cooldownUntil) {
      if (now < record.cooldownUntil) {
        return {
          allowed: false,
          inCooldown: true,
          cooldownEndsAt: record.cooldownUntil,
          reason: 'IN_COOLDOWN',
        };
      } else {
        // Cooldown נגמר - איפוס
        await this.resetCooldown(normalizedEmail);
        record = await prisma.emailRateLimit.findUnique({
          where: { email: normalizedEmail },
        })!;
      }
    }

    // בדיקה אם החלון של שעה חלף
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (record!.windowStartedAt < hourAgo) {
      // החלון חלף - איפוס מונים
      await prisma.emailRateLimit.update({
        where: { email: normalizedEmail },
        data: {
          requestCount: 0,
          errorCount: 0,
          windowStartedAt: now,
        },
      });
      record = await prisma.emailRateLimit.findUnique({
        where: { email: normalizedEmail },
      })!;
    }

    // בדיקת מכסה
    if (record!.requestCount >= this.config.maxRequestsPerHour) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record!.windowStartedAt.getTime() + 60 * 60 * 1000),
        reason: 'RATE_LIMIT_EXCEEDED',
      };
    }

    // מותר
    return {
      allowed: true,
      remaining: this.config.maxRequestsPerHour - record!.requestCount,
      resetAt: new Date(record!.windowStartedAt.getTime() + 60 * 60 * 1000),
    };
  }

  /**
   * רישום בקשה (הצלחה)
   * @param email כתובת האימייל
   */
  async recordRequest(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    await prisma.emailRateLimit.upsert({
      where: { email: normalizedEmail },
      update: {
        requestCount: { increment: 1 },
        errorCount: 0, // איפוס ספירת שגיאות בהצלחה
        lastRequestAt: new Date(),
      },
      create: {
        email: normalizedEmail,
        requestCount: 1,
        errorCount: 0,
        windowStartedAt: new Date(),
        lastRequestAt: new Date(),
      },
    });
  }

  /**
   * רישום שגיאה (פורמט לא תקין וכו')
   * @param email כתובת האימייל
   */
  async recordError(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    const record = await prisma.emailRateLimit.upsert({
      where: { email: normalizedEmail },
      update: {
        requestCount: { increment: 1 },
        errorCount: { increment: 1 },
        lastRequestAt: new Date(),
      },
      create: {
        email: normalizedEmail,
        requestCount: 1,
        errorCount: 1,
        windowStartedAt: new Date(),
        lastRequestAt: new Date(),
      },
    });

    // בדיקה אם עברנו את מספר השגיאות המקסימלי
    if (record.errorCount >= this.config.maxConsecutiveErrors) {
      await this.enableCooldown(normalizedEmail);
    }
  }

  /**
   * הפעלת cooldown לכתובת
   */
  private async enableCooldown(email: string): Promise<void> {
    const cooldownUntil = new Date();
    cooldownUntil.setMinutes(
      cooldownUntil.getMinutes() + this.config.cooldownMinutes
    );

    await prisma.emailRateLimit.update({
      where: { email },
      data: {
        inCooldown: true,
        cooldownUntil,
      },
    });

    console.warn(
      `🚨 Email ${email} entered cooldown until ${cooldownUntil.toISOString()}`
    );
  }

  /**
   * איפוס cooldown
   */
  private async resetCooldown(email: string): Promise<void> {
    await prisma.emailRateLimit.update({
      where: { email },
      data: {
        inCooldown: false,
        cooldownUntil: null,
        requestCount: 0,
        errorCount: 0,
        windowStartedAt: new Date(),
      },
    });
  }

  /**
   * קבלת סטטיסטיקות rate limit לכתובת
   */
  async getStats(email: string): Promise<{
    requestCount: number;
    errorCount: number;
    inCooldown: boolean;
    windowStartedAt: Date;
    lastRequestAt: Date;
  } | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const record = await prisma.emailRateLimit.findUnique({
      where: { email: normalizedEmail },
    });

    if (!record) return null;

    return {
      requestCount: record.requestCount,
      errorCount: record.errorCount,
      inCooldown: record.inCooldown,
      windowStartedAt: record.windowStartedAt,
      lastRequestAt: record.lastRequestAt,
    };
  }

  /**
   * איפוס ידני של rate limit (למנהל)
   */
  async resetForEmail(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    
    await prisma.emailRateLimit.update({
      where: { email: normalizedEmail },
      data: {
        requestCount: 0,
        errorCount: 0,
        inCooldown: false,
        cooldownUntil: null,
        windowStartedAt: new Date(),
      },
    });
  }

  /**
   * ניקוי רשומות ישנות (maintenance)
   * מחיקת רשומות שלא השתמשו בהן X ימים
   */
  async cleanup(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.emailRateLimit.deleteMany({
      where: {
        lastRequestAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

// Export singleton instance with default config
export const emailRateLimiter = new EmailRateLimiter();
