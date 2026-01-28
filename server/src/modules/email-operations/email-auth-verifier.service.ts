/**
 * Email Auth Verifier Service
 * אימות זהות משתמש ובדיקת הרשאות לפעולות דרך אימייל
 * 
 * דרישות אבטחה:
 * 1. אימות שולח: לכל מודעה יש owner_email, רק הוא יכול לעדכן/להסיר
 * 2. הגנה מפני Reply/Forward מזויף: בדיקת Message-ID / In-Reply-To
 * 3. לא לחשוף מידע טכני - הודעות שגיאה כלליות למשתמש
 */

import { PrismaClient } from '@prisma/client';
import { EmailCommandType } from './email-command-parser.service';

const prisma = new PrismaClient();

export interface EmailAuthResult {
  authorized: boolean;
  userId?: string;
  userExists: boolean;
  failReason?: string;         // סיבה פנימית לתחקור
  publicMessage?: string;       // הודעה כללית למשתמש
}

export class EmailAuthVerifier {
  /**
   * אימות משתמש לפעולה מבוקשת
   * @param senderEmail כתובת השולח
   * @param commandType סוג הפקודה
   * @param adId מספר מודעה (אופציונלי, רלוונטי לעדכון/הסרה)
   * @returns תוצאת אימות
   */
  async verifyEmailAuth(
    senderEmail: string,
    commandType: EmailCommandType,
    adId?: string
  ): Promise<EmailAuthResult> {
    // נרמול אימייל
    const normalizedEmail = senderEmail.toLowerCase().trim();

    // בדיקה האם המשתמש קיים במערכת
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    // פעולות שדורשות משתמש רשום
    const requiresRegistration = [
      EmailCommandType.UPDATE_AD,
      EmailCommandType.REMOVE_AD,
    ];

    if (requiresRegistration.includes(commandType)) {
      // חובה שהמשתמש יהיה רשום
      if (!user) {
        return {
          authorized: false,
          userExists: false,
          failReason: 'USER_NOT_REGISTERED',
          publicMessage: 'כדי לבצע פעולה זו, יש להירשם תחילה למערכת „מקומי."',
        };
      }

      // חובה שהמשתמש יהיה פעיל
      if (user.status !== 'ACTIVE') {
        return {
          authorized: false,
          userExists: true,
          userId: user.id,
          failReason: `USER_STATUS_${user.status}`,
          publicMessage: 'חשבונך אינו פעיל. אנא פנה לשירות הלקוחות.',
        };
      }

      // אימות בעלות על המודעה (לעדכון/הסרה)
      if (adId) {
        const ownershipResult = await this.verifyAdOwnership(
          user.id,
          normalizedEmail,
          adId
        );
        if (!ownershipResult.authorized) {
          return ownershipResult;
        }
      }

      return {
        authorized: true,
        userExists: true,
        userId: user.id,
      };
    }

    // פעולות שלא דורשות רישום (פרסום חדש, הצטרפות לרשימת תפוצה)
    return {
      authorized: true,
      userExists: !!user,
      userId: user?.id,
    };
  }

  /**
   * אימות בעלות על מודעה
   */
  private async verifyAdOwnership(
    userId: string,
    email: string,
    adId: string
  ): Promise<EmailAuthResult> {
    // חיפוש המודעה לפי adNumber (המספר הסידורי שהמשתמש רואה)
    const ad = await prisma.ad.findFirst({
      where: {
        adNumber: parseInt(adId, 10),
      },
      include: {
        User: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!ad) {
      return {
        authorized: false,
        userExists: true,
        userId,
        failReason: `AD_NOT_FOUND: adNumber=${adId}`,
        publicMessage: 'מספר המודעה שצוין לא נמצא במערכת.',
      };
    }

    // בדיקת בעלות: האם owner_email תואם לשולח
    if (ad.User.email.toLowerCase() !== email.toLowerCase()) {
      return {
        authorized: false,
        userExists: true,
        userId,
        failReason: `OWNERSHIP_MISMATCH: ad.userId=${ad.userId}, requestUserId=${userId}`,
        publicMessage: 'אינך מורשה לבצע פעולה זו על המודעה.',
      };
    }

    // בדיקה שהמודעה לא הוסרה
    if (ad.status === 'REMOVED') {
      return {
        authorized: false,
        userExists: true,
        userId,
        failReason: `AD_REMOVED: adId=${ad.id}`,
        publicMessage: 'המודעה כבר הוסרה מהמערכת.',
      };
    }

    return {
      authorized: true,
      userExists: true,
      userId,
    };
  }

  /**
   * בדיקת תקינות Message-ID והגנה מפני Replay/Forward מזויף
   * @param messageId Message-ID של ההודעה הנוכחית
   * @param inReplyTo In-Reply-To header (אם זו תגובה)
   * @param references References header
   * @returns האם המייל תקין
   */
  async verifyMessageIntegrity(
    messageId: string,
    inReplyTo?: string,
    references?: string
  ): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    // בדיקה בסיסית: messageId חייב להיות קיים ותקין
    if (!messageId || messageId.trim().length === 0) {
      return {
        valid: false,
        reason: 'MISSING_MESSAGE_ID',
      };
    }

    // אם יש inReplyTo, בדוק שהוא מתייחס למייל שהמערכת שלחה
    if (inReplyTo) {
      const isSystemMessage = await this.isSystemGeneratedMessageId(inReplyTo);
      if (!isSystemMessage) {
        // זה עלול להיות replay או forward מזויף
        return {
          valid: true, // לא נחסום לגמרי, אבל נתעד
          reason: 'SUSPICIOUS_REPLY_TO',
        };
      }
    }

    return {
      valid: true,
    };
  }

  /**
   * בדיקה האם Message-ID הוא של מייל שהמערכת שלחה
   */
  private async isSystemGeneratedMessageId(messageId: string): Promise<boolean> {
    // כאן תוכל לבדוק מול לוג של מיילים יוצאים
    // בשלב ראשון נחזיר true אם המייל מכיל דומיין של המערכת
    // לדוגמה: <something@meyadleyad.com> או <something@localhost>
    
    // פשטות: בדיקה פשוטה
    const systemDomains = ['meyadleyad.com', 'localhost'];
    return systemDomains.some((domain) => messageId.includes(domain));
  }

  /**
   * בדיקה האם כתובת האימייל תקינה
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * חישוב "trust score" למייל (ניקוד אמון)
   * ניתן להרחיב בעתיד עם בדיקות SPF/DKIM/DMARC
   */
  async calculateTrustScore(params: {
    senderEmail: string;
    messageId: string;
    inReplyTo?: string;
    headers?: any;
  }): Promise<number> {
    let score = 100;

    // בדיקות בסיסיות
    if (!this.isValidEmail(params.senderEmail)) {
      score -= 50;
    }

    if (!params.messageId) {
      score -= 30;
    }

    // אם יש inReplyTo והוא לא מהמערכת
    if (params.inReplyTo) {
      const isSystem = await this.isSystemGeneratedMessageId(params.inReplyTo);
      if (!isSystem) {
        score -= 20;
      }
    }

    // ניתן להוסיף בדיקות נוספות:
    // - SPF/DKIM validation
    // - Domain reputation
    // - Historical behavior

    return Math.max(0, score);
  }
}

// Export singleton instance
export const emailAuthVerifier = new EmailAuthVerifier();
