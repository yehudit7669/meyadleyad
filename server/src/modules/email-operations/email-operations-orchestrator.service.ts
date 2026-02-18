/**
 * Email Operations Orchestrator
 * התזמור המרכזי - מנהל את כל תהליך עיבוד האימיילים
 * 
 * אחראי על:
 * 1. קבלת אימייל נכנס
 * 2. ניתוח הפקודה
 * 3. אימות והרשאות
 * 4. Rate limiting
 * 5. ביצוע הפעולה
 * 6. שליחת תשובה
 * 7. תיעוד
 */

import { PrismaClient } from '@prisma/client';
import { emailCommandParser, EmailCommandType, ParsedEmailCommand } from './email-command-parser.service';
import { emailAuthVerifier, EmailAuthResult } from './email-auth-verifier.service';
import { emailRateLimiter } from './email-rate-limiter.service';
import { emailAuditLogger } from './email-audit-logger.service';
import { emailOperationsTemplates } from './email-operations-templates.service';

const prisma = new PrismaClient();

export interface InboundEmailData {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  headers?: Record<string, any>;
  attachments?: any[];
  inReplyTo?: string;
  references?: string;
}

export interface ProcessingResult {
  success: boolean;
  emailRequestId?: string;
  action: string;
  message: string;
  shouldNotifyUser: boolean;
}

export class EmailOperationsOrchestrator {
  /**
   * נקודת כניסה ראשית - עיבוד אימייל נכנס
   */
  async processInboundEmail(emailData: InboundEmailData): Promise<ProcessingResult> {
    console.log(`📨 Processing inbound email from: ${emailData.from}`);

    try {
      // שלב 1: שמירת האימייל הגולמי
      const inboundMessage = await this.saveInboundMessage(emailData);

      // שלב 2: ניתוח הפקודה
      const parsedCommand = emailCommandParser.parseCommand(
        emailData.subject,
        emailData.bodyText
      );

      console.log(`🔍 Parsed command: ${parsedCommand.commandType} (confidence: ${parsedCommand.confidence})`);

      // שלב 3: בדיקת Rate Limiting
      const rateLimitResult = await emailRateLimiter.checkRateLimit(emailData.from);
      if (!rateLimitResult.allowed) {
        await this.handleRateLimitExceeded(emailData.from, rateLimitResult, inboundMessage.id);
        return {
          success: false,
          action: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          shouldNotifyUser: true,
        };
      }

      // שלב 4: טיפול בפקודה לא מזוהה
      if (parsedCommand.commandType === EmailCommandType.UNKNOWN) {
        await emailRateLimiter.recordError(emailData.from);
        await this.handleUnknownCommand(emailData.from, emailData.subject, inboundMessage.id);
        return {
          success: false,
          action: 'UNKNOWN_COMMAND',
          message: 'Command not recognized',
          shouldNotifyUser: true,
        };
      }

      // שלב 5: אימות והרשאות
      const adId = parsedCommand.adId;
      const authResult = await emailAuthVerifier.verifyEmailAuth(
        emailData.from,
        parsedCommand.commandType,
        adId
      );

      // שלב 6: טיפול לפי תוצאת האימות
      if (!authResult.authorized) {
        return await this.handleUnauthorized(
          emailData,
          parsedCommand,
          authResult,
          inboundMessage.id
        );
      }

      // שלב 7: ביצוע הפעולה לפי סוג הפקודה
      const result = await this.executeCommand(
        emailData,
        parsedCommand,
        authResult,
        inboundMessage.id
      );

      // שלב 8: רישום הצלחה
      await emailRateLimiter.recordRequest(emailData.from);

      // סימון ההודעה כמעובדת
      await prisma.emailInboundMessage.update({
        where: { id: inboundMessage.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      console.error('❌ Error processing inbound email:', error);
      
      await emailAuditLogger.logFailure({
        email: emailData.from,
        action: 'PROCESS_INBOUND_EMAIL',
        commandType: EmailCommandType.UNKNOWN,
        failReason: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        publicMessage: 'אירעה שגיאה בעיבוד הבקשה. אנא נסה שוב מאוחר יותר.',
      });

      return {
        success: false,
        action: 'PROCESSING_ERROR',
        message: 'Internal processing error',
        shouldNotifyUser: true,
      };
    }
  }

  /**
   * שמירת אימייל נכנס ב-DB
   */
  private async saveInboundMessage(emailData: InboundEmailData) {
    return await prisma.emailInboundMessage.create({
      data: {
        messageId: emailData.messageId,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        bodyText: emailData.bodyText,
        bodyHtml: emailData.bodyHtml,
        headers: emailData.headers || {},
        attachments: emailData.attachments || [],
        inReplyTo: emailData.inReplyTo,
        references: emailData.references,
      },
    });
  }

  /**
   * טיפול ב-Rate Limit Exceeded
   */
  private async handleRateLimitExceeded(
    email: string,
    rateLimitResult: any,
    inboundMessageId: string
  ) {
    await emailAuditLogger.logFailure({
      email,
      action: 'RATE_LIMIT_CHECK',
      commandType: EmailCommandType.UNKNOWN,
      failReason: rateLimitResult.reason,
      publicMessage: 'חרגת ממספר הבקשות המותר. אנא נסה שוב מאוחר יותר.',
      inboundMessageId,
    });

    // כאן ניתן לשלוח מייל למשתמש על חריגה
    // אך כדי לא להעמיס, נשלח רק אם זה לא cooldown
    if (!rateLimitResult.inCooldown) {
      // await emailOperationsTemplates.sendRateLimitEmail(email, rateLimitResult);
    }
  }

  /**
   * טיפול בפקודה לא מזוהה
   */
  private async handleUnknownCommand(
    email: string,
    subject: string,
    inboundMessageId: string
  ) {
    await emailAuditLogger.logFailure({
      email,
      action: 'PARSE_COMMAND',
      commandType: EmailCommandType.UNKNOWN,
      failReason: `UNKNOWN_COMMAND: subject="${subject}"`,
      publicMessage: 'הפקודה לא זוהתה. אנא ודא שכתבת את הפקודה בשורת הנושא בלבד.',
      inboundMessageId,
    });

    // שליחת מייל הסבר למשתמש
    await emailOperationsTemplates.sendUnknownCommandEmail(email, subject);
  }

  /**
   * טיפול במשתמש לא מורשה
   */
  private async handleUnauthorized(
    emailData: InboundEmailData,
    parsedCommand: ParsedEmailCommand,
    authResult: EmailAuthResult,
    inboundMessageId: string
  ): Promise<ProcessingResult> {
    // אם המשתמש לא קיים והפקודה דורשת רישום
    if (!authResult.userExists && emailCommandParser.isAuthRequired(parsedCommand.commandType)) {
      await this.handleUserNotRegistered(emailData, parsedCommand, inboundMessageId);
      return {
        success: false,
        action: 'USER_NOT_REGISTERED',
        message: 'User registration required',
        shouldNotifyUser: true,
      };
    }

    // כשל אימות אחר (בעלות על מודעה וכו')
    await emailAuditLogger.logFailure({
      email: emailData.from,
      action: emailCommandParser.getCommandDisplayName(parsedCommand.commandType),
      commandType: parsedCommand.commandType,
      adId: parsedCommand.adId,
      failReason: authResult.failReason || 'UNAUTHORIZED',
      publicMessage: authResult.publicMessage || 'אינך מורשה לבצע פעולה זו.',
      inboundMessageId,
    });

    // שליחת מייל למשתמש
    if (authResult.publicMessage) {
      // כאן ניתן לשלוח מייל עם ההודעה הכללית
    }

    return {
      success: false,
      action: 'UNAUTHORIZED',
      message: authResult.publicMessage || 'Unauthorized',
      shouldNotifyUser: true,
    };
  }

  /**
   * טיפול במשתמש לא רשום - יצירת Pending Intent
   */
  private async handleUserNotRegistered(
    emailData: InboundEmailData,
    parsedCommand: ParsedEmailCommand,
    inboundMessageId: string
  ) {
    // שמירת הכוונה (intent) עד שהמשתמש ישלים הרשמה
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 ימים

    await prisma.pendingIntent.create({
      data: {
        email: emailData.from.toLowerCase().trim(),
        commandType: parsedCommand.commandType,
        inboundMessageId,
        payload: {
          subject: emailData.subject,
          bodyText: emailData.bodyText,
          parsedCommand: parsedCommand as any,
        } as any,
        expiresAt,
      },
    });

    // שליחת מייל הרשמה
    await emailOperationsTemplates.sendRegistrationRequiredEmail(
      emailData.from,
      parsedCommand.commandType
    );

    await emailAuditLogger.logFailure({
      email: emailData.from,
      action: 'REGISTRATION_REQUIRED',
      commandType: parsedCommand.commandType,
      failReason: 'USER_NOT_REGISTERED',
      publicMessage: 'נדרשת השלמת הרשמה למערכת.',
      inboundMessageId,
    });
  }

  /**
   * ביצוע הפקודה לפי הסוג
   */
  private async executeCommand(
    emailData: InboundEmailData,
    parsedCommand: ParsedEmailCommand,
    authResult: EmailAuthResult,
    inboundMessageId: string
  ): Promise<ProcessingResult> {
    const commandType = parsedCommand.commandType;

    // יצירת Email Request
    const emailRequest = await prisma.emailRequest.create({
      data: {
        inboundMessageId,
        senderEmail: emailData.from.toLowerCase().trim(),
        commandType,
        adId: parsedCommand.adId,
        status: 'PROCESSING',
        payload: {
          parsedCommand: parsedCommand as any,
          authResult: authResult as any,
        } as any,
      },
    });

    try {
      let result: ProcessingResult;

      switch (commandType) {
        case EmailCommandType.PUBLISH_SALE:
        case EmailCommandType.PUBLISH_RENT:
        case EmailCommandType.PUBLISH_SHABBAT:
        case EmailCommandType.PUBLISH_COMMERCIAL:
        case EmailCommandType.PUBLISH_SHARED_OWNERSHIP:
        case EmailCommandType.WANTED_BUY:
        case EmailCommandType.WANTED_RENT:
        case EmailCommandType.WANTED_SHABBAT:
          result = await this.handlePublishRequest(emailData, parsedCommand, emailRequest.id);
          break;

        case EmailCommandType.UPDATE_AD:
          result = await this.handleUpdateRequest(emailData, parsedCommand, authResult, emailRequest.id);
          break;

        case EmailCommandType.REMOVE_AD:
          result = await this.handleRemoveRequest(emailData, parsedCommand, authResult, emailRequest.id);
          break;

        case EmailCommandType.MAILING_LIST_SUBSCRIBE:
          result = await this.handleMailingListSubscribe(emailData, emailRequest.id);
          break;

        case EmailCommandType.MAILING_LIST_UNSUBSCRIBE:
          result = await this.handleMailingListUnsubscribe(emailData, emailRequest.id);
          break;

        default:
          throw new Error(`Unsupported command type: ${commandType}`);
      }

      // עדכון סטטוס EmailRequest
      await prisma.emailRequest.update({
        where: { id: emailRequest.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          processedAt: new Date(),
          failReason: result.success ? null : result.message,
        },
      });

      return result;
    } catch (error) {
      // עדכון EmailRequest ככשל
      await prisma.emailRequest.update({
        where: { id: emailRequest.id },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          failReason: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        },
      });

      throw error;
    }
  }

  /**
   * טיפול בבקשת פרסום (PUBLISH_* / WANTED_*)
   */
  private async handlePublishRequest(
    emailData: InboundEmailData,
    parsedCommand: ParsedEmailCommand,
    emailRequestId: string
  ): Promise<ProcessingResult> {
    // שליחת מייל "פנייתך התקבלה" עם קישור לטופס
    const formUrl = this.getFormUrlForCommand(parsedCommand.commandType);
    
    await emailOperationsTemplates.sendRequestReceivedEmail(
      emailData.from,
      parsedCommand.commandType,
      formUrl
    );

    await emailAuditLogger.logSuccess({
      email: emailData.from,
      action: `SEND_FORM_LINK_${parsedCommand.commandType}`,
      commandType: parsedCommand.commandType,
      metadata: { formUrl },
    });

    return {
      success: true,
      emailRequestId,
      action: 'FORM_LINK_SENT',
      message: 'Form link sent to user',
      shouldNotifyUser: false, // כבר שלחנו מייל
    };
  }

  /**
   * טיפול בבקשת עדכון
   */
  private async handleUpdateRequest(
    emailData: InboundEmailData,
    parsedCommand: ParsedEmailCommand,
    authResult: EmailAuthResult,
    emailRequestId: string
  ): Promise<ProcessingResult> {
    // שליחת מייל "פנייתך התקבלה - עדכון" עם קישור לטופס עדכון
    const updateFormUrl = this.getUpdateFormUrl(parsedCommand.adId!);
    
    await emailOperationsTemplates.sendUpdateRequestReceivedEmail(emailData.from);

    await emailAuditLogger.logSuccess({
      email: emailData.from,
      action: 'UPDATE_REQUEST_RECEIVED',
      commandType: parsedCommand.commandType,
      adId: parsedCommand.adId,
      userId: authResult.userId,
    });

    return {
      success: true,
      emailRequestId,
      action: 'UPDATE_FORM_SENT',
      message: 'Update form link sent',
      shouldNotifyUser: false,
    };
  }

  /**
   * טיפול בבקשת הסרה
   */
  private async handleRemoveRequest(
    emailData: InboundEmailData,
    parsedCommand: ParsedEmailCommand,
    authResult: EmailAuthResult,
    emailRequestId: string
  ): Promise<ProcessingResult> {
    // חיפוש המודעה
    const ad = await prisma.ad.findFirst({
      where: { adNumber: parseInt(parsedCommand.adId!, 10) },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // עדכון סטטוס המודעה ל-REMOVED
    await prisma.ad.update({
      where: { id: ad.id },
      data: {
        status: 'REMOVED',
        removedAt: new Date(),
      },
    });

    // שליחת מייל אישור הסרה
    await emailOperationsTemplates.sendAdRemovedConfirmationEmail(
      emailData.from,
      parsedCommand.adId!
    );

    await emailAuditLogger.logSuccess({
      email: emailData.from,
      action: 'AD_REMOVED',
      commandType: parsedCommand.commandType,
      adId: parsedCommand.adId,
      userId: authResult.userId,
    });

    return {
      success: true,
      emailRequestId,
      action: 'AD_REMOVED',
      message: 'Ad removed successfully',
      shouldNotifyUser: false,
    };
  }

  /**
   * טיפול בהצטרפות לרשימת תפוצה
   */
  private async handleMailingListSubscribe(
    emailData: InboundEmailData,
    emailRequestId: string
  ): Promise<ProcessingResult> {
    const email = emailData.from.toLowerCase().trim();

    // בדיקה אם כבר קיים
    const existing = await prisma.emailOperationsMailingList.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        // כבר רשום
        return {
          success: true,
          emailRequestId,
          action: 'ALREADY_SUBSCRIBED',
          message: 'Already subscribed',
          shouldNotifyUser: false,
        };
      } else {
        // הפעלה מחדש
        await prisma.emailOperationsMailingList.update({
          where: { email },
          data: {
            status: 'ACTIVE',
            removedAt: null,
            lastCommandAt: new Date(),
          },
        });
      }
    } else {
      // הוספה חדשה
      await prisma.emailOperationsMailingList.create({
        data: {
          email,
          status: 'ACTIVE',
          source: 'email',
        },
      });
    }

    // שליחת מייל אישור
    await emailOperationsTemplates.sendMailingListSubscribedEmail(email);

    await emailAuditLogger.logSuccess({
      email,
      action: 'MAILING_LIST_SUBSCRIBE',
      commandType: EmailCommandType.MAILING_LIST_SUBSCRIBE,
    });

    return {
      success: true,
      emailRequestId,
      action: 'SUBSCRIBED',
      message: 'Subscribed to mailing list',
      shouldNotifyUser: false,
    };
  }

  /**
   * טיפול בהסרה מרשימת תפוצה
   */
  private async handleMailingListUnsubscribe(
    emailData: InboundEmailData,
    emailRequestId: string
  ): Promise<ProcessingResult> {
    const email = emailData.from.toLowerCase().trim();

    await prisma.emailOperationsMailingList.upsert({
      where: { email },
      update: {
        status: 'REMOVED',
        removedAt: new Date(),
        lastCommandAt: new Date(),
      },
      create: {
        email,
        status: 'REMOVED',
        removedAt: new Date(),
        source: 'email',
      },
    });

    // שליחת מייל אישור
    await emailOperationsTemplates.sendMailingListUnsubscribedEmail(email);

    await emailAuditLogger.logSuccess({
      email,
      action: 'MAILING_LIST_UNSUBSCRIBE',
      commandType: EmailCommandType.MAILING_LIST_UNSUBSCRIBE,
    });

    return {
      success: true,
      emailRequestId,
      action: 'UNSUBSCRIBED',
      message: 'Unsubscribed from mailing list',
      shouldNotifyUser: false,
    };
  }

  /**
   * קבלת URL לטופס לפי סוג פקודה
   * בשלב MVP - קישורים ל-Google Forms
   */
  private getFormUrlForCommand(commandType: EmailCommandType): string {
    // TODO: החלף עם קישורים אמיתיים לטפסים
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const formUrls: Partial<Record<EmailCommandType, string>> = {
      [EmailCommandType.PUBLISH_SALE]: 'https://docs.google.com/forms/d/e/1FAIpQLSd5ZjstupkxjBc9d7j7h3hOkIHVNgfjZLlCtPbB7j0cDmbt2w/viewform?usp=dialog',
      [EmailCommandType.PUBLISH_RENT]: `${baseUrl}/forms/publish-rent`,
      [EmailCommandType.PUBLISH_SHABBAT]: `${baseUrl}/forms/publish-shabbat`,
      [EmailCommandType.PUBLISH_COMMERCIAL]: `${baseUrl}/forms/publish-commercial`,
      [EmailCommandType.PUBLISH_SHARED_OWNERSHIP]: `${baseUrl}/forms/publish-shared-ownership`,
      [EmailCommandType.WANTED_BUY]: `${baseUrl}/forms/wanted-buy`,
      [EmailCommandType.WANTED_RENT]: `${baseUrl}/forms/wanted-rent`,
      [EmailCommandType.WANTED_SHABBAT]: `${baseUrl}/forms/wanted-shabbat`,
    };

    return formUrls[commandType] || `${baseUrl}/forms/general`;
  }

  /**
   * קבלת URL לטופס עדכון
   */
  private getUpdateFormUrl(adId: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/forms/update/${adId}`;
  }

  /**
   * עיבוד Pending Intents לאחר השלמת הרשמה
   */
  async processPendingIntentsForUser(email: string, userId: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    const pendingIntents = await prisma.pendingIntent.findMany({
      where: {
        email: normalizedEmail,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        inboundMessage: true,
      },
    });

    for (const intent of pendingIntents) {
      try {
        // שליחת מייל "פנייתך התקבלה" עם קישור לטופס
        const formUrl = this.getFormUrlForCommand(intent.commandType as EmailCommandType);
        
        await emailOperationsTemplates.sendRequestReceivedEmail(
          email,
          intent.commandType as EmailCommandType,
          formUrl
        );

        // סימון ה-intent כ-COMPLETED
        await prisma.pendingIntent.update({
          where: { id: intent.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        console.log(`✅ Processed pending intent ${intent.id} for user ${userId}`);
      } catch (error) {
        console.error(`❌ Failed to process pending intent ${intent.id}:`, error);
      }
    }
  }
}

// Export singleton instance
export const emailOperationsOrchestrator = new EmailOperationsOrchestrator();
