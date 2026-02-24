/**
 * 📧 Unified Email Template Service
 * 
 * מקור מרכזי ויחיד לכל תבניות המיילים במערכת
 * כל שליחת מייל MUST לעבור דרך שירות זה
 */

import { EmailType, getEmailSubject } from './email-types.enum';
import { config } from '../../config';

export interface EmailTemplateParams {
  // Common
  to: string;
  type: EmailType;
  
  // Auth
  token?: string;
  
  // Ads
  adTitle?: string;
  adId?: string;
  adNumber?: string | number;
  reason?: string;
  formUrl?: string;
  requestId?: string;
  
  // Appointments
  requesterName?: string;
  ownerName?: string;
  ownerPhone?: string;
  adAddress?: string;
  date?: Date;
  originalDate?: Date;
  newDate?: Date;
  appointmentId?: string;
  note?: string;
  icsContent?: string;
  
  // Mailing List
  categories?: string[];
  cities?: string[];
  unsubscribeUrl?: string;
  
  // Content Distribution
  content?: string;
  adsCount?: number;
  
  // PDF
  pdfBuffer?: Buffer;
  
  // Contact info
  contactName?: string;
  
  // Custom subject override (rarely used)
  customSubject?: string;
}

export class UnifiedEmailTemplateService {
  private emailService: any;
  
  getEmailService() {
    if (!this.emailService) {
      // Lazy loading to avoid circular dependency at module init time
      const EmailServiceModule = require('./email.service');
      this.emailService = new EmailServiceModule.EmailService();
    }
    return this.emailService;
  }
  
  /**
   * 🎯 Main method - send any email by type
   */
  async sendEmail(params: EmailTemplateParams): Promise<void> {
    const { type, to, customSubject } = params;
    
    // Get subject from metadata or use custom
    const subject = customSubject || getEmailSubject(type);
    
    // Get HTML content based on type
    const html = this.getEmailTemplate(params);
    
    // Get attachments if needed
    const attachments = this.getAttachments(params);
    
    // Send via EmailService
    const emailService = this.getEmailService();
    await emailService.sendEmail(to, subject, html, attachments);
    
    console.log(`✅ Sent ${type} email to ${to}`);
  }
  
  /**
   * Get HTML template based on email type
   */
  private getEmailTemplate(params: EmailTemplateParams): string {
    const { type } = params;
    
    switch (type) {
      // Auth
      case EmailType.USER_REGISTER_CONFIRMATION:
        return this.getVerificationEmailTemplate(params);
      case EmailType.PASSWORD_RESET:
        return this.getPasswordResetTemplate(params);
      case EmailType.ACCOUNT_DELETION_CONFIRMATION:
        return this.getAccountDeletionTemplate(params);
      
      // Email Operations - Not Registered
      case EmailType.USER_NOT_REGISTERED_REDIRECT_TO_SIGNUP:
        return this.getRegistrationRequiredTemplate(params);
      
      // Email Operations - Ad Requests
      case EmailType.AD_PUBLISH_REQUEST_RECEIVED:
      case EmailType.AD_WANTED_REQUEST_RECEIVED:
      case EmailType.AD_UPDATE_REQUEST_RECEIVED:
      case EmailType.AD_REMOVE_REQUEST_RECEIVED:
      case EmailType.AD_FORM_LINK_SENT:
        return this.getAdRequestReceivedTemplate(params);
      
      // Ad Lifecycle
      case EmailType.AD_CREATED_PENDING_APPROVAL:
        return this.getAdCreatedTemplate(params);
      case EmailType.AD_APPROVED:
        return this.getAdApprovedTemplate(params);
      case EmailType.AD_REJECTED:
        return this.getAdRejectedTemplate(params);
      case EmailType.AD_COPY_WITH_PDF:
        return this.getAdCopyTemplate(params);
      case EmailType.AD_UPDATED_CONFIRMATION:
        return this.getAdUpdatedTemplate(params);
      case EmailType.AD_REMOVED_CONFIRMATION:
        return this.getAdRemovedTemplate(params);
      
      // Appointments
      case EmailType.APPOINTMENT_REQUEST_SENT:
        return this.getAppointmentRequestTemplate(params);
      case EmailType.APPOINTMENT_APPROVED:
        return this.getAppointmentApprovedTemplate(params);
      case EmailType.APPOINTMENT_REJECTED:
        return this.getAppointmentRejectedTemplate(params);
      case EmailType.APPOINTMENT_RESCHEDULE:
        return this.getAppointmentRescheduleTemplate(params);
      
      // Broker Contact
      case EmailType.BROKER_CONTACT_REQUEST:
        return this.getBrokerContactRequestTemplate(params);
      
      // Mailing List
      case EmailType.MAILING_LIST_SUBSCRIBED:
        return this.getMailingListSubscribedTemplate(params);
      case EmailType.MAILING_LIST_UNSUBSCRIBED:
        return this.getMailingListUnsubscribedTemplate(params);
      case EmailType.MAILING_LIST_PREFERENCES_UPDATED:
        return this.getMailingListPreferencesUpdatedTemplate(params);
      
      // Content Distribution
      case EmailType.WEEKLY_CONTENT_DISTRIBUTION:
      case EmailType.MANUAL_CONTENT_DISTRIBUTION:
        return this.getContentDistributionTemplate(params);
      
      // Errors
      case EmailType.AD_NOT_FOUND:
        return this.getAdNotFoundTemplate(params);
      case EmailType.UNAUTHORIZED_ACTION:
        return this.getUnauthorizedTemplate(params);
      case EmailType.RATE_LIMIT_EXCEEDED:
        return this.getRateLimitTemplate(params);
      case EmailType.EMAIL_OPERATION_ERROR:
        return this.getErrorTemplate(params);
      
      // Admin
      case EmailType.ADMIN_NOTIFICATION:
      case EmailType.NEWSPAPER_SHEET_READY:
        return this.getAdminNotificationTemplate(params);
      
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  }
  
  /**
   * Get attachments based on email type
   */
  private getAttachments(params: EmailTemplateParams): any[] | undefined {
    const { type, pdfBuffer, adNumber, icsContent } = params;
    
    if (type === EmailType.AD_COPY_WITH_PDF && pdfBuffer) {
      return [{
        filename: `modaa-${adNumber || 'copy'}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }];
    }
    
    if (type === EmailType.APPOINTMENT_APPROVED && icsContent) {
      return [{
        filename: 'appointment.ics',
        content: icsContent,
        contentType: 'text/calendar',
      }];
    }
    
    return undefined;
  }
  
  // ========================================
  // 📧 Template Methods
  // ========================================
  
  private getVerificationEmailTemplate(params: EmailTemplateParams): string {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${params.token}`;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; text-align: center;">"ברוכים הבאים ל"המקום!</h2>
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
            <p style="font-size: 14px; color: #666;">או העתק את הקישור: ${verificationUrl}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              הקישור תקף ל-24 שעות. אם לא ביקשת הרשמה, התעלם ממייל זה.
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getPasswordResetTemplate(params: EmailTemplateParams): string {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${params.token}`;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #dc2626; text-align: center;">איפוס סיסמה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                איפוס סיסמה
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">או העתק: ${resetUrl}</p>
            <p style="font-size: 12px; color: #999;">הקישור תקף לשעה אחת.</p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAccountDeletionTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #dc2626; text-align: center;">החשבון שלך נמחק</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">החשבון שלך באתר המקום נמחק בהצלחה.</p>
            <p style="font-size: 14px; color: #666;">אם זו לא הייתה פעולה שלך, צור קשר עם התמיכה.</p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getRegistrationRequiredTemplate(params: EmailTemplateParams): string {
    const signupUrl = `${config.frontendUrl}/register?email=${encodeURIComponent(params.to)}`;
    const googleFormUrl = process.env.GOOGLE_FORM_REGISTRATION_URL || 'https://forms.gle/YOUR_FORM_ID_HERE';
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #f59e0b; text-align: center;">נדרשת הרשמה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              קיבלנו את בקשתך לפעולה במערכת "המקום", אך כתובת המייל שלך לא רשומה עדיין.
            </p>
            <p style="font-size: 16px;">
              נא להירשם תחילה, ואז נוכל לעבד את בקשתך.
            </p>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">בחר/י דרך הרשמה:</h3>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #1e40af;">📝 הרשמה מהירה דרך טופס Google:</strong>
                <p style="margin: 10px 0 15px 0; font-size: 14px;">
                  מלא/י את הטופס וצוות המערכת ייצור עבורך חשבון תוך 24 שעות
                </p>
                <a href="${googleFormUrl}" 
                   style="display: inline-block; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  📋 מעבר לטופס ההרשמה
                </a>
              </div>
              
              <div style="border-top: 1px solid #cbd5e1; margin: 20px 0; padding-top: 15px;">
                <strong style="color: #1e40af;">🔐 הרשמה עצמאית באתר:</strong>
                <p style="margin: 10px 0 15px 0; font-size: 14px;">
                  הירשם/י ישירות באתר וקבל/י גישה מיידית למערכת
                </p>
                <a href="${signupUrl}" 
                   style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  🚀 הרשמה לאתר
                </a>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
              לאחר ההרשמה, נעבד אוטומטית את הבקשה שלך ✨
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAdRequestReceivedTemplate(params: EmailTemplateParams): string {
    const { type, formUrl, requestId } = params;
    
    let actionText = 'לפרסום מודעה';
    if (type === EmailType.AD_WANTED_REQUEST_RECEIVED) actionText = 'לפרסום דרושים';
    else if (type === EmailType.AD_UPDATE_REQUEST_RECEIVED) actionText = 'לעדכון מודעה';
    else if (type === EmailType.AD_REMOVE_REQUEST_RECEIVED) actionText = 'להסרת מודעה';
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #10b981; text-align: center;">✓ בקשתך ${actionText} התקבלה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              קיבלנו את בקשתך ${actionText}.
            </p>
            ${formUrl ? `
              <p style="font-size: 16px;">
                נא למלא את הטופס הבא כדי להשלים את התהליך:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${formUrl}" 
                   style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  מלא טופס
                </a>
              </div>
            ` : ''}
            <p style="font-size: 14px; color: #666;">מספר בקשה: ${requestId || 'N/A'}</p>
            <p style="font-size: 12px; color: #999; text-align: center;">צוות "המקום"</p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAdCreatedTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">המודעה שלך נקלטה בהצלחה!</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              המודעה <strong>"${params.adTitle}"</strong> נקלטה במערכת ונשלחה לאישור.
            </p>
            <p style="font-size: 16px;">
              נעדכן אותך במייל ברגע שהמודעה תאושר ותפורסם באתר.
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAdApprovedTemplate(params: EmailTemplateParams): string {
    const adUrl = `${config.frontendUrl}/ads/${params.adId}`;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #28a745; text-align: center;">🎉 המודעה שלך אושרה ופורסמה!</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              המודעה <strong>"${params.adTitle}"</strong> אושרה ופורסמה בהצלחה.
            </p>
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>מספר מודעה:</strong> ${params.adNumber || 'בהמתנה למספור'}</p>
              <p style="margin: 5px 0;"><strong>צפייה:</strong> <a href="${adUrl}">${adUrl}</a></p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${adUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                צפייה במודעה
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              לעדכון: שלח מייל עם נושא "עדכון מודעה ${params.adNumber}"<br>
              להסרה: שלח מייל עם נושא "הסרת מודעה ${params.adNumber}"
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAdRejectedTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #dc2626; text-align: center;">המודעה לא אושרה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              לצערנו, המודעה <strong>"${params.adTitle}"</strong> לא אושרה לפרסום.
            </p>
            <div style="background-color: #fee; padding: 15px; border-right: 4px solid #dc2626; border-radius: 5px;">
              <p style="margin: 0;"><strong>סיבה:</strong></p>
              <p style="margin: 10px 0 0 0;">${params.reason || 'לא צוינה סיבה'}</p>
            </div>
            <p style="font-size: 16px; margin-top: 20px;">
              תוכל לערוך את המודעה ולשלוח שוב לאישור.
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAdCopyTemplate(params: EmailTemplateParams): string {
    const adUrl = `${config.frontendUrl}/ads/${params.adId}`;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">המודעה שלך פורסמה!</h2>
            <p style="font-size: 16px;">שלום ${params.contactName || ''},</p>
            <p style="font-size: 16px;">
              המודעה <strong>"${params.adTitle}"</strong> פורסמה בהצלחה.
            </p>
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>מספר מודעה:</strong> ${params.adNumber || 'בהמתנה למספור'}</p>
              <p style="margin: 5px 0;"><strong>תאריך:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${adUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                צפייה במודעה
              </a>
            </div>
            <p style="font-size: 16px;">מצורף קובץ PDF עם פרטי המודעה.</p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAdUpdatedTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #10b981; text-align: center;">✓ המודעה עודכנה בהצלחה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              המודעה <strong>"${params.adTitle}"</strong> (מספר ${params.adNumber || 'בהמתנה'}) עודכנה בהצלחה.
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAdRemovedTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #ef4444; text-align: center;">המודעה הוסרה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              המודעה <strong>"${params.adTitle}"</strong> (מספר ${params.adNumber || 'בהמתנה'}) הוסרה בהצלחה מהמערכת.
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAppointmentRequestTemplate(params: EmailTemplateParams): string {
    const dateStr = params.date ? new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(params.date) : '';
    
    const profileUrl = `${config.frontendUrl}/profile?tab=appointments`;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">📅 בקשה להצגת נכס</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">קיבלת בקשה חדשה לתיאום פגישה:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
              <p><strong>נכס:</strong> ${params.adTitle}</p>
              <p><strong>מבקש:</strong> ${params.requesterName}</p>
              <p><strong>תאריך:</strong> ${dateStr}</p>
              ${params.note ? `<p><strong>הערה:</strong> ${params.note}</p>` : ''}
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${profileUrl}" 
                 style="display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                לוח תיאומים
              </a>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAppointmentApprovedTemplate(params: EmailTemplateParams): string {
    const dateStr = params.date ? new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(params.date) : '';
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #10b981; text-align: center;">✓ הפגישה אושרה!</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">הפגישה אושרה בהצלחה:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
              <p><strong>נכס:</strong> ${params.adTitle}</p>
              <p><strong>כתובת:</strong> ${params.adAddress}</p>
              <p><strong>תאריך:</strong> ${dateStr}</p>
              <p><strong>איש קשר:</strong> ${params.ownerName}</p>
              <p><strong>טלפון:</strong> <a href="tel:${params.ownerPhone}">${params.ownerPhone}</a></p>
            </div>
            <p style="font-size: 14px; color: #666;">מצורף קובץ ICS להוספת הפגישה ליומן.</p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAppointmentRejectedTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #ef4444; text-align: center;">הפגישה נדחתה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              לצערנו, בקשתך לפגישה בנכס "${params.adTitle}" נדחתה.
            </p>
            ${params.reason ? `<p style="font-size: 14px; color: #666;"><strong>סיבה:</strong> ${params.reason}</p>` : ''}
          </div>
        </body>
      </html>
    `;
  }
  
  private getAppointmentRescheduleTemplate(params: EmailTemplateParams): string {
    const originalDateStr = params.originalDate ? new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(params.originalDate) : '';
    
    const newDateStr = params.newDate ? new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(params.newDate) : '';
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #f59e0b; text-align: center;">הצעה למועד חלופי</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              בעל הנכס "${params.adTitle}" מציע מועד חלופי:
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
              <p><strong>מועד מקורי:</strong> ${originalDateStr}</p>
              <p style="color: #10b981;"><strong>מועד חדש:</strong> ${newDateStr}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  private getBrokerContactRequestTemplate(params: EmailTemplateParams): string {
    const { contactName, ownerPhone, requesterName } = params;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; direction: rtl;">
            <h2 style="color: #c89b4c; text-align: center;">📧 פניה חדשה ממשתמש</h2>
            <p style="font-size: 16px; text-align: right;">שלום,</p>
            <p style="font-size: 16px; text-align: right;">קיבלת פניה חדשה דרך האתר:</p>
            <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; border-right: 4px solid #c89b4c; direction: rtl;">
              <p style="margin: 5px 0; text-align: right;"><strong>שם:</strong> ${contactName || 'לא צוין'}</p>
              <p style="margin: 5px 0; text-align: right;"><strong>טלפון:</strong> <a href="tel:${ownerPhone}" style="color: #c89b4c;">${ownerPhone || 'לא צוין'}</a></p>
              <p style="margin: 5px 0; text-align: right;"><strong>כתובת מייל:</strong> <a href="mailto:${requesterName}" style="color: #c89b4c;">${requesterName || 'לא צוין'}</a></p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px; text-align: right;">מומלץ ליצור קשר עם המשתמש בהקדם האפשרי.</p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #999;">מודעת המקום - מערכת ניהול מודעות נדל"ן</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  private getMailingListSubscribedTemplate(params: EmailTemplateParams): string {
    const unsubUrl = params.unsubscribeUrl || `${config.frontendUrl}/unsubscribe`;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #10b981; text-align: center;">✓ נרשמת לרשימת התפוצה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">נרשמת בהצלחה לרשימת התפוצה של "המקום".</p>
            ${params.categories && params.categories.length > 0 ? `
              <p style="font-size: 14px;"><strong>קטגוריות:</strong> ${params.categories.join(', ')}</p>
            ` : ''}
            ${params.cities && params.cities.length > 0 ? `
              <p style="font-size: 14px;"><strong>ערים:</strong> ${params.cities.join(', ')}</p>
            ` : ''}
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
              לביטול ההרשמה: <a href="${unsubUrl}">לחץ כאן</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getMailingListUnsubscribedTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #ef4444; text-align: center;">בוטלה ההרשמה לרשימת התפוצה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">ההרשמה שלך לרשימת התפוצה בוטלה בהצלחה.</p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getMailingListPreferencesUpdatedTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">העדפות עודכנו</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">העדפות רשימת התפוצה שלך עודכנו בהצלחה.</p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getContentDistributionTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">תפוצת תוכן - המקום</h2>
            <p style="font-size: 16px;">שלום,</p>
            ${params.content || '<p>תוכן לא זמין</p>'}
            ${params.adsCount ? `<p style="font-size: 14px; color: #666;">מספר מודעות: ${params.adsCount}</p>` : ''}
          </div>
        </body>
      </html>
    `;
  }
  
  private getAdNotFoundTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #ef4444; text-align: center;">המודעה לא נמצאה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              המודעה שציינת (מספר ${params.adNumber || 'לא זוהה'}) לא נמצאה במערכת.
            </p>
            <p style="font-size: 14px; color: #666;">
              אנא ודא שמספר המודעה נכון.
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getUnauthorizedTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #ef4444; text-align: center;">פעולה לא מורשית</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              אין לך הרשאה לבצע את הפעולה המבוקשת.
            </p>
            <p style="font-size: 14px; color: #666;">
              ${params.reason || 'רק בעל המודעה יכול לבצע פעולה זו.'}
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getRateLimitTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #f59e0b; text-align: center;">⚠️ חרגת ממכסת המיילים</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              חרגת ממכסת המיילים המותרת.
            </p>
            <p style="font-size: 14px; color: #666;">
              נא להמתין מספר שעות לפני שליחת בקשות נוספות.
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getErrorTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #ef4444; text-align: center;">שגיאה בעיבוד הבקשה</h2>
            <p style="font-size: 16px;">שלום,</p>
            <p style="font-size: 16px;">
              אירעה שגיאה בעיבוד הבקשה שלך.
            </p>
            <p style="font-size: 14px; color: #666;">
              ${params.reason || 'נא לנסות שוב מאוחר יותר.'}
            </p>
          </div>
        </body>
      </html>
    `;
  }
  
  private getAdminNotificationTemplate(params: EmailTemplateParams): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">התראת מנהל</h2>
            <p style="font-size: 16px;">שלום,</p>
            ${params.content || '<p>התראה ללא תוכן</p>'}
          </div>
        </body>
      </html>
    `;
  }
}

// ✅ Export singleton instance
export const unifiedEmailService = new UnifiedEmailTemplateService();
