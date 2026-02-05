import { prisma } from '../../lib/prisma';
import { EmailService } from '../email/email.service';
import { logger } from '../../utils/logger';
import { EmailDeliveryStatus } from '@prisma/client';

const emailService = new EmailService();

class SupportEmailService {
  /**
   * Send email to guest when admin replies
   */
  async sendGuestReplyEmail(messageId: string) {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          conversation: true,
        },
      });

      if (!message || !message.conversation.guestEmail) {
        logger.warn(`Message ${messageId} not found or no guest email`);
        return;
      }

      if (message.emailDeliveryStatus !== EmailDeliveryStatus.PENDING) {
        logger.info(`Message ${messageId} already processed for email delivery`);
        return;
      }

      const guestEmail = message.conversation.guestEmail;
      const subject = 'תשובה לפנייתך באתר מקומי';
      const html = this.buildGuestReplyEmailTemplate(message.body, message.conversation.id);

      await emailService.sendEmail(guestEmail, subject, html);

      // Update message delivery status
      await prisma.message.update({
        where: { id: messageId },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.SENT,
          deliveredToEmailAt: new Date(),
        },
      });

      logger.info(`Email sent to guest ${guestEmail} for message ${messageId}`);
    } catch (error) {
      logger.error(`Error sending email for message ${messageId}:`, error instanceof Error ? error : new Error(String(error)));
      
      // Mark as failed
      await prisma.message.update({
        where: { id: messageId },
        data: {
          emailDeliveryStatus: EmailDeliveryStatus.FAILED,
        },
      }).catch((err: unknown) => logger.error('Failed to update message status:', err instanceof Error ? err : new Error(String(err))));
    }
  }

  /**
   * Build email template for guest reply
   */
  private buildGuestReplyEmailTemplate(messageBody: string, conversationId: string): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>תשובה לפנייתך</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <tr>
      <td style="background-color: #1F3F3A; padding: 30px; text-align: center;">
        <h1 style="color: #E6D3A3; margin: 0; font-size: 28px;">מקומי</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1F3F3A; margin-top: 0; font-size: 22px;">קיבלת תשובה לפנייתך</h2>
        <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
          צוות התמיכה שלנו השיב לפנייתך:
        </p>
        <div style="background-color: #f9f9f9; border-right: 4px solid #C9A24D; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #333; white-space: pre-wrap; font-size: 15px;">${this.escapeHtml(messageBody)}</p>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          אם יש לך שאלות נוספות, ניתן לשלוח הודעה חדשה דרך האתר.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f4f4f4; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} מקומי. כל הזכויות שמורות.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Process pending email deliveries (can be called by cron/queue)
   */
  async processPendingEmails() {
    try {
      const pendingMessages = await prisma.message.findMany({
        where: {
          emailDeliveryStatus: EmailDeliveryStatus.PENDING,
        },
        take: 50, // Process in batches
      });

      logger.info(`Processing ${pendingMessages.length} pending email deliveries`);

      for (const message of pendingMessages) {
        await this.sendGuestReplyEmail(message.id);
        // Small delay to avoid overwhelming SMTP server
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      logger.info('Pending email processing completed');
    } catch (error) {
      logger.error('Error processing pending emails:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Retry failed email deliveries
   */
  async retryFailedEmails() {
    try {
      const failedMessages = await prisma.message.findMany({
        where: {
          emailDeliveryStatus: EmailDeliveryStatus.FAILED,
        },
        take: 20,
      });

      logger.info(`Retrying ${failedMessages.length} failed email deliveries`);

      for (const message of failedMessages) {
        // Reset to pending and retry
        await prisma.message.update({
          where: { id: message.id },
          data: { emailDeliveryStatus: EmailDeliveryStatus.PENDING },
        });

        await this.sendGuestReplyEmail(message.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info('Failed email retry completed');
    } catch (error) {
      logger.error('Error retrying failed emails:', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export const supportEmailService = new SupportEmailService();
