/**
 * Email Operations Templates Service
 * תבניות אימייל למערכת הדיוור - כל הנוסחים המדויקים מהאפיון
 * 
 * כל התבניות מבוססות על הנוסחים הרשמיים מהאפיון
 */

import { EmailService } from '../email/email.service';
import { EmailCommandType } from './email-command-parser.service';
import { config } from '../../config';

export interface EmailTemplateData {
  recipientEmail: string;
  userName?: string;
  adId?: string;
  formUrl?: string;
  [key: string]: any;
}

export class EmailOperationsTemplatesService {
  private emailService: EmailService;
  private frontendUrl: string;

  constructor() {
    this.emailService = new EmailService();
    this.frontendUrl = config.frontendUrl || 'http://localhost:3000';
  }

  /**
   * מייל "השלמת הרשמה למערכת „המקום""
   * נשלח למשתמש שאינו רשום כשהוא מנסה לבצע פעולה
   */
  async sendRegistrationRequiredEmail(
    to: string,
    originalCommandType: EmailCommandType
  ): Promise<void> {
    const registrationUrl = `${this.frontendUrl}/register`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">השלמת הרשמה למערכת „המקום"</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              קיבלנו את פנייתך למערכת „המקום".
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              כדי שנוכל לפרסם מודעות,<br>
              לאפשר עדכון או הסרה בעתיד,<br>
              ולנהל את הפניות שלך בצורה מסודרת–<br>
              יש להשלים הרשמה קצרה למערכת.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                קישור לטופס הרשמה
              </a>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>לאחר השלמת ההרשמה:</strong>
            </p>
            <ul style="font-size: 16px; line-height: 1.8;">
              <li>תוכל לפרסם מודעות ובקשות</li>
              <li>תוכל לעדכן או להסיר פרסומים קיימים</li>
              <li>תקבל אישורי מערכת מסודרים במייל</li>
            </ul>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      'השלמת הרשמה למערכת „המקום"',
      html
    );
  }

  /**
   * מייל "ההרשמה הושלמה בהצלחה"
   * נשלח לאחר שהמשתמש השלים הרשמה
   */
  async sendRegistrationCompletedEmail(to: string, userName?: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; text-align: center;">ההרשמה הושלמה בהצלחה – „המקום"</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום${userName ? ` ${userName}` : ''},</p>
            <p style="font-size: 16px; line-height: 1.6;">
              ההרשמה שלך למערכת „המקום" הושלמה בהצלחה!
            </p>
            <h3 style="color: #2563eb;">כיצד לפרסם מודעה או בקשה דרך אימייל:</h3>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>המערכת מזהה את הפעולה לפי שורת הנושא בלבד.</strong>
            </p>
            <div style="background-color: #fef3c7; padding: 15px; border-right: 4px solid #f59e0b; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; font-weight: bold;">חשוב לדעת:</p>
              <ul style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.8;">
                <li><strong>אין לכתוב את הבקשה בגוף האימייל</strong></li>
                <li><strong>יש לשלוח אימייל אחד לכל פעולה</strong></li>
                <li><strong>אין להוסיף מילים נוספות בשורת הנושא</strong></li>
              </ul>
            </div>
            <h4 style="color: #2563eb;">פעולות זמינות:</h4>
            <ul style="font-size: 15px; line-height: 2;">
              <li>פרסום דירה למכירה</li>
              <li>פרסום דירה להשכרה</li>
              <li>פרסום דירה לשבת</li>
              <li>פרסום שטח מסחרי</li>
              <li>פרסום טאבו משותף</li>
              <li>דרושה דירה לקנייה</li>
              <li>דרושה דירה להשכרה</li>
              <li>דרושה דירה לשבת</li>
            </ul>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>לעדכון או הסרת מודעה קיימת:</strong><br>
              עדכון#&lt;מספר_מודעה&gt;<br>
              הסרה#&lt;מספר_מודעה&gt;
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      'ההרשמה הושלמה בהצלחה – „המקום"',
      html
    );
  }

  /**
   * מיילי "פנייתך התקבלה" - עבור פעולות פרסום
   * @param commandType סוג הפקודה
   * @param formUrl קישור לטופס Google Forms
   */
  async sendRequestReceivedEmail(
    to: string,
    commandType: EmailCommandType,
    formUrl: string
  ): Promise<void> {
    const commandTexts: Record<string, { subject: string; body: string }> = {
      [EmailCommandType.PUBLISH_SALE]: {
        subject: 'פנייתך התקבלה – פרסום דירה למכירה',
        body: 'קיבלנו את פנייתך בנושא פרסום דירה למכירה. כדי להשלים את תהליך הפרסום ב־המקום, יש למלא את הטופס בקישור הבא:',
      },
      [EmailCommandType.PUBLISH_RENT]: {
        subject: 'פנייתך התקבלה – פרסום דירה להשכרה',
        body: 'קיבלנו את פנייתך בנושא פרסום דירה להשכרה. כדי להשלים את תהליך הפרסום ב־המקום, יש למלא את הטופס בקישור הבא:',
      },
      [EmailCommandType.PUBLISH_SHABBAT]: {
        subject: 'פנייתך התקבלה – פרסום דירה לשבת',
        body: 'קיבלנו את פנייתך בנושא פרסום דירה לשבת. כדי להשלים את תהליך הפרסום ב־המקום, יש למלא את הטופס בקישור הבא:',
      },
      [EmailCommandType.PUBLISH_COMMERCIAL]: {
        subject: 'פנייתך התקבלה – פרסום שטח מסחרי',
        body: 'קיבלנו את פנייתך בנושא פרסום שטח מסחרי. כדי להשלים את תהליך הפרסום ב־המקום, יש למלא את הטופס בקישור הבא:',
      },
      [EmailCommandType.PUBLISH_SHARED_OWNERSHIP]: {
        subject: 'פנייתך התקבלה – פרסום טאבו משותף',
        body: 'קיבלנו את פנייתך בנושא פרסום טאבו משותף. כדי להשלים את תהליך הפרסום ב־המקום, יש למלא את הטופס בקישור הבא:',
      },
      [EmailCommandType.WANTED_BUY]: {
        subject: 'פנייתך התקבלה – דרושה דירה לקנייה',
        body: 'קיבלנו את פנייתך בנושא דרושה דירה לקנייה בפלטפורמת „המקום." כדי לפרסם את הבקשה בצורה מסודרת, יש למלא את טופס הבקשה בקישור המצורף למייל זה.',
      },
      [EmailCommandType.WANTED_RENT]: {
        subject: 'פנייתך התקבלה – דרושה דירה להשכרה',
        body: 'קיבלנו את פנייתך בנושא דרושה דירה להשכרה. לצורך פרסום הבקשה, יש למלא את טופס הבקשה בקישור המצורף. לאחר השליחה יישלח אליך מייל המשך.',
      },
      [EmailCommandType.WANTED_SHABBAT]: {
        subject: 'פנייתך התקבלה – דרושה דירה לשבת',
        body: 'קיבלנו את פנייתך בנושא דרושה דירה לשבת. כדי שנוכל לפרסם את הבקשה, יש למלא את טופס הבקשה בקישור המצורף למייל זה. הבקשה תיקלט ותפורסם.',
      },
    };

    const template = commandTexts[commandType];
    if (!template) {
      throw new Error(`Unknown command type: ${commandType}`);
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">${template.subject}</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              ${template.body}
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${formUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                מלא את הטופס
              </a>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">
              ${
                commandType.startsWith('PUBLISH_')
                  ? 'לאחר שליחת הטופס תקבל אישור פרסום עם מספר מודעה סידורי.'
                  : 'לאחר שליחת הטופס הבקשה תפורסם באתר.'
              }
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(to, template.subject, html);
  }

  /**
   * מייל אישור פרסום מודעה
   * נשלח רק לאחר שהמודעה אושרה על ידי המנהל
   */
  async sendAdPublishedConfirmationEmail(
    to: string,
    adNumber: string,
    adTitle: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; text-align: center;">המודעה פורסמה – מספר המודעה שלך: ${adNumber}</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              המודעה שלך "${adTitle}" פורסמה בהצלחה באתר „המקום."
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>מספר המודעה שלך הוא: ${adNumber}</strong>
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              זהו מספר הזיהוי של המודעה שלך במערכת, והוא משמש לכל פעולה עתידית.
            </p>
            <h3 style="color: #2563eb;">ניהול המודעה:</h3>
            <p style="font-size: 16px; line-height: 1.6;">
              כדי לעדכן או להסיר את המודעה שלך, יש להשיב למייל זה ולכתוב בשורת הנושא בלבד את המילה המתאימה בצירוף מספר המודעה שלך.
            </p>
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 15px;"><strong>לעדכון המודעה שלך:</strong></p>
              <p style="margin: 5px 0; font-size: 16px; color: #2563eb;">עדכון#${adNumber}</p>
              <p style="margin: 15px 0 5px 0; font-size: 15px;"><strong>להסרת המודעה שלך:</strong></p>
              <p style="margin: 5px 0; font-size: 16px; color: #ef4444;">הסרה#${adNumber}</p>
            </div>
            <div style="background-color: #fef3c7; padding: 15px; border-right: 4px solid #f59e0b; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; font-weight: bold;">חשוב לדעת:</p>
              <ul style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.8;">
                <li><strong>אין לכתוב את הבקשה בגוף האימייל</strong></li>
                <li><strong>אין להוסיף מילים נוספות בשורת הנושא</strong></li>
              </ul>
            </div>
            <h3 style="color: #2563eb;">קובץ הדירות השבועי:</h3>
            <p style="font-size: 16px; line-height: 1.6;">
              אם תרצה לקבל את קובץ הדירות השבועי של „המקום" למייל, שלח אימייל עם:
            </p>
            <p style="font-size: 16px; color: #2563eb; margin: 10px 0;">
              <strong>שורת נושא: הצטרפות</strong>
            </p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              להסרה מהתפוצה, שלח אימייל עם שורת נושא: <strong>הסרה-תפוצה</strong>
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      `המודעה פורסמה – מספר המודעה שלך: ${adNumber}`,
      html
    );
  }

  /**
   * מייל אישור פרסום בקשה ("דרוש")
   */
  async sendRequestPublishedConfirmationEmail(
    to: string,
    requestNumber: string,
    requestTitle: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; text-align: center;">הבקשה פורסמה – מספר הבקשה שלך: ${requestNumber}</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              הבקשה שלך "${requestTitle}" פורסמה בהצלחה באתר „המקום."
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>מספר הבקשה שלך הוא: ${requestNumber}</strong>
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              להסרת הבקשה, שלח אימייל עם שורת נושא:
            </p>
            <p style="font-size: 18px; color: #ef4444; margin: 10px 0;">
              <strong>הסרה#${requestNumber}</strong>
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      `הבקשה פורסמה – מספר הבקשה שלך: ${requestNumber}`,
      html
    );
  }

  /**
   * מיילי "פנייתך התקבלה" לעדכון/הסרה (חינוכי)
   */
  async sendUpdateRequestReceivedEmail(to: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">פנייתך התקבלה – בקשת עדכון מודעה</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              קיבלנו את פנייתך בנושא עדכון מודעה ב„המקום."
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              כדי לעדכן מודעה קיימת, יש להשיב למייל אישור הפרסום שקיבלת ולכתוב בשורת הנושא בלבד את המילה עדכון בצירוף מספר המודעה.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              פניות שאינן נשלחות בפורמט זה לא יטופלו אוטומטית.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      'פנייתך התקבלה – בקשת עדכון מודעה',
      html
    );
  }

  async sendRemovalRequestReceivedEmail(to: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">פנייתך התקבלה – בקשת הסרת מודעה</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              קיבלנו את פנייתך בנושא הסרת מודעה ב„המקום."
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              כדי להסיר מודעה קיימת, יש להשיב למייל אישור הפרסום שקיבלת ולכתוב בשורת הנושא בלבד את המילה הסרה בצירוף מספר המודעה.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      'פנייתך התקבלה – בקשת הסרת מודעה',
      html
    );
  }

  /**
   * מייל סיכום לאחר עדכון מודעה
   */
  async sendAdUpdatedConfirmationEmail(
    to: string,
    adNumber: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; text-align: center;">המודעה עודכנה בהצלחה – מספר המודעה שלך: ${adNumber}</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              המודעה שלך מספר ${adNumber} עודכנה בהצלחה והשינויים מוצגים כעת באתר „המקום."
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              להמשך עדכון או הסרה, השתמש במספר המודעה:
            </p>
            <p style="font-size: 18px; color: #2563eb; margin: 10px 0;">
              <strong>עדכון#${adNumber}</strong><br>
              <strong style="color: #ef4444;">הסרה#${adNumber}</strong>
            </p>
            <div style="background-color: #fef3c7; padding: 15px; border-right: 4px solid #f59e0b; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                <strong>אין לכתוב בגוף האימייל</strong>
              </p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      `המודעה עודכנה בהצלחה – מספר המודעה שלך: ${adNumber}`,
      html
    );
  }

  /**
   * מייל סיכום לאחר הסרת מודעה
   */
  async sendAdRemovedConfirmationEmail(
    to: string,
    adNumber: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #ef4444; text-align: center;">המודעה הוסרה – מספר המודעה שלך: ${adNumber}</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              המודעה שלך מספר ${adNumber} הוסרה מהאתר ואינה מוצגת עוד לציבור.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              תודה שהשתמשת בשירותי „המקום."
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      `המודעה הוסרה – מספר המודעה שלך: ${adNumber}`,
      html
    );
  }

  /**
   * מייל אישור הצטרפות לרשימת תפוצה
   */
  async sendMailingListSubscribedEmail(to: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; text-align: center;">הצטרפת בהצלחה לרשימת התפוצה</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              הצטרפת בהצלחה לרשימת התפוצה של „המקום."
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              תקבל את קובץ הדירות השבועי למייל שלך.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              להסרה מהתפוצה בכל עת, שלח אימייל עם שורת נושא:
            </p>
            <p style="font-size: 18px; color: #ef4444; margin: 10px 0;">
              <strong>הסרה-תפוצה</strong>
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      'הצטרפת בהצלחה לרשימת התפוצה – „המקום"',
      html
    );
  }

  /**
   * מייל אישור הסרה מרשימת תפוצה
   */
  async sendMailingListUnsubscribedEmail(to: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #ef4444; text-align: center;">הוסרת מרשימת התפוצה</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              הוסרת בהצלחה מרשימת התפוצה של „המקום."
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              לא תקבל עוד את קובץ הדירות השבועי.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              להצטרפות מחדש בכל עת, שלח אימייל עם שורת נושא:
            </p>
            <p style="font-size: 18px; color: #10b981; margin: 10px 0;">
              <strong>הצטרפות</strong>
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      'הוסרת מרשימת התפוצה – „המקום"',
      html
    );
  }

  /**
   * מייל שגיאה כללית - פורמט לא מזוהה
   */
  async sendUnknownCommandEmail(to: string, subject: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #ef4444; text-align: center;">הבקשה לא זוהתה</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              קיבלנו את הודעתך אך לא הצלחנו לזהות את הבקשה.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>המערכת מזהה פעולות לפי שורת הנושא בלבד.</strong>
            </p>
            <div style="background-color: #fef3c7; padding: 15px; border-right: 4px solid #f59e0b; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; font-weight: bold;">חשוב לדעת:</p>
              <ul style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.8;">
                <li><strong>אין לכתוב את הבקשה בגוף האימייל</strong></li>
                <li><strong>אין להוסיף מילים נוספות בשורת הנושא</strong></li>
                <li><strong>מספר המודעה הוא המספר ממייל אישור הפרסום</strong></li>
              </ul>
            </div>
            <h4 style="color: #2563eb;">פקודות זמינות:</h4>
            <ul style="font-size: 15px; line-height: 2;">
              <li>פרסום דירה למכירה</li>
              <li>פרסום דירה להשכרה</li>
              <li>פרסום דירה לשבת</li>
              <li>דרושה דירה לקנייה</li>
              <li>עדכון#&lt;מספר_מודעה&gt;</li>
              <li>הסרה#&lt;מספר_מודעה&gt;</li>
              <li>הצטרפות</li>
              <li>הסרה-תפוצה</li>
            </ul>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      'הבקשה לא זוהתה – „המקום"',
      html
    );
  }
}

// Export singleton instance
export const emailOperationsTemplates = new EmailOperationsTemplatesService();
