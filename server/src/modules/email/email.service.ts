import nodemailer from 'nodemailer';
import { config } from '../../config';

export class EmailService {
  private transporter;
  private enabled: boolean;

  constructor() {
    this.enabled = config.smtp.enabled;
    
    if (!this.enabled) {
      console.log('📧 SMTP disabled - emails will not be sent');
      return;
    }
    
    // Use new SMTP config with fallback to legacy email config
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });

    // Verify SMTP connection on initialization
    this.verifyConnection();
  }

  private async verifyConnection() {
    if (!this.enabled) return;
    
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      console.error('Please check your SMTP configuration in .env file');
    }
  }

  /**
   * Generic email sending function
   */
  async sendEmail(to: string, subject: string, html: string) {
    if (!this.enabled) {
      console.log(`📧 SMTP disabled - email not sent to ${to}: ${subject}`);
      return;
    }
    
    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });
      console.log('✅ Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw new Error('EMAIL_SEND_FAILED');
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">ברוכים הבאים למיעדליעד!</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              כדי לאשר את כתובת המייל שלך ולהפעיל את החשבון, לחץ על הכפתור הבא:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                אימות כתובת מייל
              </a>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              או העתק את הקישור הבא לדפדפן:
            </p>
            <p style="font-size: 14px; color: #2563eb; word-break: break-all;">
              ${verificationUrl}
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              הקישור תקף ל-24 שעות. אם לא ביקשת הרשמה, אפשר להתעלם מהמייל הזה.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'אימות כתובת מייל - מיעדליעד', html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; text-align: center;">איפוס סיסמה</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              קיבלנו בקשה לאיפוס הסיסמה שלך באתר מיעדליעד.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              לאיפוס הסיסמה, לחץ על הכפתור הבא:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                איפוס סיסמה
              </a>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              או העתק את הקישור הבא לדפדפן:
            </p>
            <p style="font-size: 14px; color: #dc2626; word-break: break-all;">
              ${resetUrl}
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              הקישור תקף לשעה אחת. אם לא ביקשת לאפס את הסיסמה, התעלם ממייל זה.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'איפוס סיסמה - מיעדליעד', html);
  }

  async sendAdApprovedEmail(to: string, adTitle: string, adId: string) {
    const adUrl = `${config.frontendUrl}/ads/${adId}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #28a745; text-align: center;">🎉 המודעה שלך אושרה ופורסמה בהצלחה!</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              שמחים לעדכן שהמודעה <strong>"${adTitle}"</strong> אושרה על ידי המערכת ופורסמה באתר מיעדליעד.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              המודעה זמינה כעת לצפייה ציבורית ומעניינים יוכלו ליצור איתך קשר.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${adUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                צפייה במודעה באתר
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              מערכת מיעדליעד - הלוח השבועי של בית שמש
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'המודעה שלך אושרה ופורסמה בהצלחה - מיעדליעד', html);
  }

  async sendAdRejectedEmail(to: string, adTitle: string, reason: string) {
    const myAdsUrl = `${config.frontendUrl}/my-ads`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; text-align: center;">המודעה שלך לא אושרה לפרסום</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              לצערנו, המודעה <strong>"${adTitle}"</strong> לא אושרה לפרסום.
            </p>
            <div style="background-color: #fee; padding: 15px; border-right: 4px solid #dc2626; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>סיבת הדחייה:</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 16px;">${reason}</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>תוכל לערוך את המודעה ולשלוח אותה שוב לאישור.</strong>
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${myAdsUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                עבור למודעות שלי
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              מערכת מיעדליעד - הלוח השבועי של בית שמש
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'המודעה שלך לא אושרה לפרסום - מיעדליעד', html);
  }

  async sendAdCreatedEmail(to: string, adTitle: string) {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">המודעה שלך נקלטה בהצלחה!</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              המודעה <strong>"${adTitle}"</strong> נקלטה במערכת ונשלחה לאישור.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              נעדכן אותך במייל ברגע שהמודעה תאושר ותפורסם באתר.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              לאחר האישור, תקבל מייל נפרד עם קישור למודעה וקובץ PDF מסודר.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              מערכת מיעדליעד - הלוח השבועי של בית שמש
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'המודעה שלך התקבלה והועברה לאישור - מיעדליעד', html);
  }

  /**
   * Send ad copy with PDF attachment to user after publishing
   */
  async sendAdCopyEmail(to: string, ad: any, pdfBuffer: Buffer) {
    if (!this.enabled) {
      console.log(`📧 SMTP disabled - ad copy email not sent to ${to}`);
      return;
    }
    
    const adUrl = `${config.frontendUrl}/ads/${ad.id}`;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">המודעה שלך פורסמה בהצלחה!</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום ${ad.contactName || 'משתמש יקר'},</p>
            <p style="font-size: 16px; line-height: 1.6;">
              המודעה שלך <strong>"${ad.title}"</strong> פורסמה בהצלחה באתר מיעדליעד.
            </p>
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>מספר מודעה:</strong> ${ad.adNumber || ad.id}</p>
              <p style="margin: 5px 0;"><strong>תאריך פרסום:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">
              לחיצה על הכפתור תפתח את המודעה באתר:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${adUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                צפייה במודעה באתר
              </a>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">
              מצורף קובץ PDF מסודר עם כל פרטי המודעה.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              מערכת מיעדליעד - הלוח השבועי של בית שמש
            </p>
          </div>
        </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject: 'המודעה שלך פורסמה - הנה העותק האישי שלך',
        html,
        attachments: [
          {
            filename: `modaa-${ad.adNumber || ad.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      console.log('✅ Ad copy email with PDF sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Ad copy email send error:', error);
      throw new Error('AD_COPY_EMAIL_SEND_FAILED');
    }
  }

  /**
   * שליחת מייל למפרסם על בקשת פגישה חדשה
   */
  async sendAppointmentRequestEmail(
    to: string,
    data: {
      adTitle: string;
      adId: string;
      requesterName: string;
      date: Date;
      note?: string;
      appointmentId: string;
    }
  ) {
    const dateStr = new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(data.date);

    const approveUrl = `${config.frontendUrl}/appointments/owner?action=approve&id=${data.appointmentId}`;
    const rejectUrl = `${config.frontendUrl}/appointments/owner?action=reject&id=${data.appointmentId}`;
    const manageUrl = `${config.frontendUrl}/appointments/owner`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">📅 בקשה חדשה להצגת נכס</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              קיבלת בקשה חדשה לתיאום פגישה להצגת הנכס:
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>נכס:</strong> ${data.adTitle}</p>
              <p style="margin: 5px 0;"><strong>מבקש:</strong> ${data.requesterName}</p>
              <p style="margin: 5px 0;"><strong>תאריך ושעה:</strong> ${dateStr}</p>
              ${data.note ? `<p style="margin: 5px 0;"><strong>הערה:</strong> ${data.note}</p>` : ''}
            </div>
            <p style="font-size: 16px; line-height: 1.6;">
              תוכל לאשר, לדחות או להציע מועד אחר:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${approveUrl}" 
                 style="display: inline-block; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">
                ✓ אשר פגישה
              </a>
              <a href="${rejectUrl}" 
                 style="display: inline-block; padding: 12px 30px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">
                ✗ דחה
              </a>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${manageUrl}" 
                 style="display: inline-block; padding: 12px 30px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ניהול כל הבקשות
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              מערכת מיעדליעד - הלוח השבועי של בית שמש
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'בקשה חדשה להצגת נכס - מיעדליעד', html);
  }

  /**
   * שליחת מייל למבקש על אישור פגישה
   */
  async sendAppointmentApprovedEmail(
    to: string,
    data: {
      adTitle: string;
      adAddress: string;
      ownerName: string;
      ownerPhone: string;
      date: Date;
      icsContent: string;
    }
  ) {
    const dateStr = new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(data.date);

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; text-align: center;">✓ הפגישה אושרה!</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              הפגישה להצגת הנכס אושרה בהצלחה:
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>נכס:</strong> ${data.adTitle}</p>
              <p style="margin: 5px 0;"><strong>כתובת:</strong> ${data.adAddress}</p>
              <p style="margin: 5px 0;"><strong>תאריך ושעה:</strong> ${dateStr}</p>
              <p style="margin: 5px 0;"><strong>איש קשר:</strong> ${data.ownerName}</p>
              <p style="margin: 5px 0;"><strong>טלפון:</strong> <a href="tel:${data.ownerPhone}" style="color: #2563eb;">${data.ownerPhone}</a></p>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              מצורף קובץ ICS להוספת הפגישה ליומן שלך.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              מערכת מיעדליעד - הלוח השבועי של בית שמש
            </p>
          </div>
        </body>
      </html>
    `;

    if (!this.enabled) {
      console.log(`📧 SMTP disabled - appointment approved email not sent to ${to}`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject: 'הפגישה אושרה! - מיעדליעד',
        html,
        attachments: [
          {
            filename: 'appointment.ics',
            content: data.icsContent,
            contentType: 'text/calendar',
          },
        ],
      });
      console.log('✅ Appointment approved email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Appointment approved email send error:', error);
      throw new Error('APPOINTMENT_APPROVED_EMAIL_SEND_FAILED');
    }
  }

  /**
   * שליחת מייל למבקש על דחיית פגישה
   */
  async sendAppointmentRejectedEmail(
    to: string,
    data: {
      adTitle: string;
      reason?: string;
    }
  ) {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #ef4444; text-align: center;">הפגישה נדחתה</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              לצערנו, בקשתך לתיאום פגישה להצגת הנכס "${data.adTitle}" נדחתה.
            </p>
            ${data.reason ? `<p style="font-size: 14px; color: #666; line-height: 1.6;"><strong>סיבה:</strong> ${data.reason}</p>` : ''}
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              אנו ממליצים לחפש נכסים אחרים באתר.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              מערכת מיעדליעד - הלוח השבועי של בית שמש
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'הפגישה נדחתה - מיעדליעד', html);
  }

  /**
   * שליחת מייל למבקש על הצעת מועד חלופי
   */
  async sendAppointmentRescheduleEmail(
    to: string,
    data: {
      adTitle: string;
      originalDate: Date;
      newDate: Date;
      appointmentId: string;
    }
  ) {
    const originalDateStr = new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(data.originalDate);

    const newDateStr = new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(data.newDate);

    const confirmUrl = `${config.frontendUrl}/appointments/me?action=confirm&id=${data.appointmentId}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #f59e0b; text-align: center;">הצעה למועד חלופי</h2>
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            <p style="font-size: 16px; line-height: 1.6;">
              בעל הנכס "${data.adTitle}" מציע מועד חלופי לפגישה:
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>המועד המקורי:</strong> ${originalDateStr}</p>
              <p style="margin: 5px 0; color: #10b981;"><strong>המועד החדש:</strong> ${newDateStr}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                אשר מועד חדש
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              מערכת מיעדליעד - הלוח השבועי של בית שמש
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, 'הצעה למועד פגישה חלופי - מיעדליעד', html);
  }
}

