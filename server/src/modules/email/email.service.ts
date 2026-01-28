import nodemailer from 'nodemailer';
import { config } from '../../config';
import { unifiedEmailService } from './unified-email-template.service';
import { EmailType } from './email-types.enum';

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
      await this.transporter!.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      console.error('Please check your SMTP configuration in .env file');
    }
  }

  /**
   * Generic email sending function
   */
  async sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
    if (!this.enabled) {
      console.log(`📧 SMTP disabled - email not sent to ${to}: ${subject}`);
      return;
    }
    
    try {
      const info = await this.transporter!.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
        attachments,
      });
      console.log('✅ Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Email send error:', error);
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

