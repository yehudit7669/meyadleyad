import sgMail from '@sendgrid/mail';
import { config } from '../../config';
import { unifiedEmailService } from './unified-email-template.service';
import { EmailType } from './email-types.enum';

export class EmailService {
  private enabled: boolean;

  constructor() {
    // Check if SendGrid is enabled (prioritized over SMTP)
    this.enabled = config.sendgrid.enabled;
    
    if (!this.enabled) {
      console.log('📧 SendGrid disabled - emails will not be sent');
      console.log('   Set SENDGRID_ENABLED=true in .env to enable email sending');
      return;
    }
    
    // Initialize SendGrid with API key
    if (!config.sendgrid.apiKey) {
      console.error('❌ SENDGRID_API_KEY is not configured');
      this.enabled = false;
      return;
    }

    sgMail.setApiKey(config.sendgrid.apiKey);
    console.log('✅ SendGrid initialized successfully');
  }

  /**
   * Generic email sending function - uses SendGrid API
   */
  async sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
    if (!this.enabled) {
      console.log(`📧 SendGrid disabled - email not sent to ${to}: ${subject}`);
      return;
    }
    
    try {
      const msg: sgMail.MailDataRequired = {
        to,
        from: {
          email: config.sendgrid.fromEmail,
          name: config.sendgrid.fromName,
        },
        subject,
        html,
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        msg.attachments = attachments.map((att: any) => {
          if (att.content && att.filename) {
            // If content is Buffer, convert to base64 string
            const contentBase64 = Buffer.isBuffer(att.content) 
              ? att.content.toString('base64')
              : att.content;
            
            return {
              content: contentBase64,
              filename: att.filename,
              type: att.contentType || att.type || 'application/octet-stream',
              disposition: att.disposition || 'attachment',
            };
          }
          return att;
        });
      }

      await sgMail.send(msg);
      console.log(`✅ Email sent successfully via SendGrid to ${to}`);
    } catch (error: any) {
      console.error('❌ SendGrid email send error:', error);
      if (error.response) {
        console.error('SendGrid error details:', error.response.body);
      }
      throw new Error('EMAIL_SEND_FAILED');
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.USER_REGISTER_CONFIRMATION,
      token,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.PASSWORD_RESET,
      token,
    });
  }

  async sendAdApprovedEmail(to: string, adTitle: string, adId: string, adNumber?: string) {
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.AD_APPROVED,
      adTitle,
      adId,
      adNumber,
    });
  }

  async sendAdRejectedEmail(to: string, adTitle: string, reason: string) {
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.AD_REJECTED,
      adTitle,
      reason,
    });
  }

  async sendAdCreatedEmail(to: string, adTitle: string) {
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.AD_CREATED_PENDING_APPROVAL,
      adTitle,
    });
  }

  /**
   * Send ad copy with PDF attachment to user after publishing
   */
  async sendAdCopyEmail(to: string, ad: any, pdfBuffer: Buffer) {
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.AD_COPY_WITH_PDF,
      adTitle: ad.title,
      adId: ad.id,
      adNumber: ad.adNumber || null,
      contactName: ad.contactName,
      pdfBuffer,
    });
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
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.APPOINTMENT_REQUEST_SENT,
      ...data,
    });
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
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.APPOINTMENT_APPROVED,
      ...data,
    });
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
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.APPOINTMENT_REJECTED,
      ...data,
    });
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
    // ✅ Using unified email system
    await unifiedEmailService.sendEmail({
      to,
      type: EmailType.APPOINTMENT_RESCHEDULE,
      ...data,
    });
  }
}

