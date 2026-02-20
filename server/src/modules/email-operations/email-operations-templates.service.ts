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
    const registrationUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfn_PZ-3UxvshbDPQUy68ua4qBjj-1zLMpw1Q-Q82W1NEy_Tg/viewform?usp=header';

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">🔐 נדרשת הרשמה למערכת „המקום"</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              קיבלנו את פנייתך למערכת „המקום".
            </p>
            <div style="background-color: #fef3c7; padding: 15px; border-right: 4px solid #f59e0b; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 15px; font-weight: bold; color: #92400e;">📝 לפרסום מודעות נדרשת הרשמה</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.6; color: #92400e;">
                כדי שנוכל לפרסם מודעות, לאפשר עדכון והסרה בעתיד, ולנהל את הפניות שלך בצורה מסודרת – יש להשלים הרשמה קצרה למערכת.
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                📋 לחץ להרשמה
              </a>
            </div>
            <div style="background-color: #e0f2fe; padding: 15px; border-right: 4px solid #0284c7; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 15px; font-weight: bold; color: #0c4a6e;">⏭️ מה קורה לאחר ההרשמה?</p>
              <ol style="margin: 10px 0 0 20px; font-size: 14px; line-height: 1.8; color: #0c4a6e;">
                <li>תקבל מייל אישור הרשמה</li>
                <li>במייל האישור תמצא את רשימת כל הפקודות הזמינות</li>
                <li>תוכל לשלוח שוב את המייל שרצית (עם הנושא המתאים)</li>
              </ol>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>יתרונות ההרשמה:</strong>
            </p>
            <ul style="font-size: 16px; line-height: 1.8;">
              <li>✅ פרסום מודעות ובקשות דרך מייל</li>
              <li>✅ עדכון והסרת פרסומים קיימים</li>
              <li>✅ אישורי מערכת מסודרים במייל</li>
              <li>✅ ניהול נוח של כל המודעות שלך</li>
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
      '🔐 נדרשת הרשמה למערכת „המקום"',
      html
    );
  }

  /**
   * מייל "ההרשמה הושלמה בהצלחה"
   * נשלח לאחר שהמשתמש השלים הרשמה
   * כולל רשימה מלאה של כל הפקודות הזמינות
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
            <h2 style="color: #10b981; text-align: center;">✅ ההרשמה הושלמה בהצלחה!</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום${userName ? ` ${userName}` : ''},</p>
            <p style="font-size: 16px; line-height: 1.6;">
              🎉 ההרשמה שלך למערכת „המקום" הושלמה בהצלחה!<br>
              כעת תוכל לפרסם, לעדכן ולנהל מודעות דרך מייל.
            </p>
            
            <div style="background-color: #dbeafe; padding: 15px; border-right: 4px solid #2563eb; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 15px; font-weight: bold; color: #1e40af;">📧 כיצד לפרסם דרך אימייל?</p>
              <ul style="margin: 10px 0 0 20px; font-size: 14px; line-height: 1.8; color: #1e3a8a;">
                <li><strong>כתוב את הפקודה בשורת הנושא בלבד</strong> (לא בגוף המייל)</li>
                <li><strong>שלח אימייל אחד לכל פעולה</strong></li>
                <li><strong>אל תוסיף מילים נוספות</strong> לשורת הנושא</li>
                <li>שלח ל: <strong>publish@amakom.co.il</strong></li>
              </ul>
            </div>

            <h3 style="color: #2563eb; margin-top: 30px;">📋 פקודות פרסום זמינות:</h3>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #374151;">🏠 דירות:</p>
              <ul style="margin: 0; font-size: 15px; line-height: 1.8; list-style: none; padding-right: 0;">
                <li>• פרסום דירה למכירה</li>
                <li>• פרסום דירה להשכרה</li>
                <li>• פרסום דירה לשבת</li>
                <li>• פרסום יחידת דיור</li>
                <li>• פרסום טאבו משותף</li>
              </ul>
            </div>

            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #374151;">🏢 נדל״ן מסחרי:</p>
              <ul style="margin: 0; font-size: 15px; line-height: 1.8; list-style: none; padding-right: 0;">
                <li>• פרסום נדל"ן מסחרי</li>
              </ul>
            </div>

            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #374151;">🔍 דרושים:</p>
              <ul style="margin: 0; font-size: 15px; line-height: 1.8; list-style: none; padding-right: 0;">
                <li>• דרושה דירה לקנייה</li>
                <li>• דרושה דירה להשכרה</li>
                <li>• דרושה דירה לשבת</li>
                <li>• דרושים - נדל"ן מסחרי</li>
                <li>• דרושים - טאבו משותף</li>
              </ul>
            </div>

            <h3 style="color: #2563eb; margin-top: 30px;">✏️ עדכון והסרת מודעות:</h3>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p style="margin: 0; font-size: 15px; line-height: 1.8;">
                <strong>לעדכון:</strong> עדכון#&lt;מספר_מודעה&gt;<br>
                <strong>להסרה:</strong> הסרה#&lt;מספר_מודעה&gt;
              </p>
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #92400e;">
                💡 למשל: עדכון#42 או הסרה#42
              </p>
            </div>

            <div style="background-color: #dcfce7; padding: 15px; border-right: 4px solid #10b981; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 15px; font-weight: bold; color: #065f46;">🚀 התחל עכשיו!</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.6; color: #065f46;">
                שלח מייל ל-<strong>publish@amakom.co.il</strong> עם אחת הפקודות לעיל בנושא, ותקבל טופס למילוי פרטי המודעה.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              בברכה,<br>
              צוות המקום<br>
              publish@amakom.co.il
            </p>
          </div>
        </body>
      </html>
    `;

    await this.emailService.sendEmail(
      to,
      '✅ ההרשמה הושלמה בהצלחה – „המקום"',
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
      [EmailCommandType.PUBLISH_HOUSING_UNIT]: {
        subject: 'פנייתך התקבלה – פרסום יחידת דיור',
        body: 'קיבלנו את פנייתך בנושא פרסום יחידת דיור. כדי להשלים את תהליך הפרסום ב־המקום, יש למלא את הטופס בקישור הבא:',
      },
      [EmailCommandType.PUBLISH_COMMERCIAL]: {
        subject: 'פנייתך התקבלה – פרסום נדל"ן מסחרי',
        body: 'קיבלנו את פנייתך בנושא פרסום נדל"ן מסחרי. כדי להשלים את תהליך הפרסום ב־המקום, יש למלא את הטופס בקישור הבא:',
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
      [EmailCommandType.WANTED_COMMERCIAL]: {
        subject: 'פנייתך התקבלה – דרושים נדל"ן מסחרי',
        body: 'קיבלנו את פנייתך בנושא דרושים נדל"ן מסחרי. לצורך פרסום הבקשה, יש למלא את טופס הבקשה בקישור המצורף למייל זה.',
      },
      [EmailCommandType.WANTED_SHARED_OWNERSHIP]: {
        subject: 'פנייתך התקבלה – דרושים טאבו משותף',
        body: 'קיבלנו את פנייתך בנושא דרושים טאבו משותף. כדי שנוכל לפרסם את הבקשה, יש למלא את טופס הבקשה בקישור המצורף למייל זה.',
      },
      [EmailCommandType.UPDATE_AD]: {
        subject: 'עדכון מודעה – קישור לטופס עריכה',
        body: 'קיבלנו את בקשתך לעדכן את המודעה. כדי לעדכן את פרטי המודעה, יש למלא את הטופס בקישור הבא:',
      },
      [EmailCommandType.REMOVE_AD]: {
        subject: 'הסרת מודעה – אישור מבוקש',
        body: 'קיבלנו את בקשתך להסיר את המודעה. כדי לאשר את ההסרה, יש ללחוץ על הקישור הבא:',
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
              כדי לעדכן או להסיר את המודעה שלך, שלח מייל חדש ל-<strong>publish@amakom.co.il</strong> וכתוב בשורת הנושא בלבד את המילה המתאימה בצירוף מספר המודעה שלך.
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
                <li><strong>שלח מייל חדש (לא תשובה)</strong></li>
                <li><strong>כתוב רק את הפקודה בשורת הנושא</strong></li>
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
              כדי לעדכן מודעה קיימת, שלח מייל חדש ל-<strong>publish@amakom.co.il</strong> עם שורת הנושא:
            </p>
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 5px 0; font-size: 18px; color: #2563eb; font-weight: bold;">עדכון#[מספר_המודעה]</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">לדוגמה: עדכון#30</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">
              לאחר שליחת הפקודה הנכונה, תקבל מייל עם קישור לטופס עדכון המודעה.
            </p>
            <p style="font-size: 14px; color: #999; line-height: 1.6;">
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
              כדי להסיר מודעה קיימת, שלח מייל חדש ל-<strong>publish@amakom.co.il</strong> עם שורת הנושא:
            </p>
            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 5px 0; font-size: 18px; color: #dc2626; font-weight: bold;">הסרה#[מספר_המודעה]</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">לדוגמה: הסרה#30</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">
              לאחר שליחת הפקודה הנכונה, המודעה שלך תוסר מהמערכת.
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
              להמשך עדכון או הסרה, שלח מייל חדש ל-<strong>publish@amakom.co.il</strong> עם מספר המודעה:
            </p>
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 16px; color: #2563eb;">
                <strong>עדכון#${adNumber}</strong>
              </p>
              <p style="margin: 5px 0; font-size: 16px; color: #ef4444;">
                <strong>הסרה#${adNumber}</strong>
              </p>
            </div>
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
              <li>פרסום יחידת דיור</li>
              <li>פרסום נדל"ן מסחרי</li>
              <li>פרסום טאבו משותף</li>
              <li>דרושה דירה לקנייה</li>
              <li>דרושה דירה להשכרה</li>
              <li>דרושה דירה לשבת</li>
              <li>דרושים - נדל"ן מסחרי</li>
              <li>דרושים - טאבו משותף</li>
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
