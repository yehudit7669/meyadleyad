/**
 * Email Inbound Controller
 * Webhook/Endpoint לקליטת אימיילים נכנסים
 * 
 * תומך ב:
 * - Webhook מספקי אימייל (SendGrid, Mailgun, etc.)
 * - IMAP polling (אופציונלי)
 */

import { Request, Response } from 'express';
import { emailOperationsOrchestrator, InboundEmailData } from './email-operations-orchestrator.service';

export class EmailInboundController {
  /**
   * Webhook endpoint לקבלת אימיילים נכנסים
   * POST /api/email-operations/inbound/webhook
   */
  async handleInboundWebhook(req: Request, res: Response) {
    try {
      console.log('📨 Received inbound email webhook');

      // ניתוח הנתונים מהספק (SendGrid/Mailgun/etc.)
      const emailData = this.parseWebhookPayload(req.body, req.headers);

      if (!emailData) {
        res.status(400).json({ error: 'Invalid webhook payload' });
        return;
      }

      // עיבוד אסינכרוני (לא לחסום את ה-webhook)
      this.processEmailAsync(emailData);

      // תשובה מיידית לספק האימייל
      res.status(200).json({ 
        success: true, 
        message: 'Email received and queued for processing' 
      });
    } catch (error) {
      console.error('❌ Error in inbound webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * עיבוד אסינכרוני של האימייל
   */
  private async processEmailAsync(emailData: InboundEmailData) {
    try {
      const result = await emailOperationsOrchestrator.processInboundEmail(emailData);
      console.log(`✅ Email processed: ${result.action}`);
    } catch (error) {
      console.error('❌ Failed to process email asynchronously:', error);
    }
  }

  /**
   * ניתוח payload מספק אימייל
   * תומך בפורמטים שונים של ספקים פופולריים
   */
  private parseWebhookPayload(
    body: any,
    headers: any
  ): InboundEmailData | null {
    // בדיקת ספק לפי headers
    const userAgent = headers['user-agent'] || '';
    
    // SendGrid Inbound Parse Webhook
    if (userAgent.includes('SendGrid') || body.from) {
      return this.parseSendGridPayload(body);
    }

    // Mailgun
    if (body.sender || body.Subject) {
      return this.parseMailgunPayload(body);
    }

    // פורמט כללי
    return this.parseGenericPayload(body);
  }

  /**
   * ניתוח SendGrid Inbound Parse
   */
  private parseSendGridPayload(body: any): InboundEmailData {
    return {
      messageId: body.headers?.['Message-ID'] || body.messageId || `sendgrid-${Date.now()}`,
      from: this.extractEmail(body.from),
      to: this.extractEmail(body.to),
      subject: body.subject || '',
      bodyText: body.text || '',
      bodyHtml: body.html || '',
      headers: body.headers || {},
      attachments: body.attachments || [],
      inReplyTo: body.headers?.['In-Reply-To'],
      references: body.headers?.['References'],
    };
  }

  /**
   * ניתוח Mailgun
   */
  private parseMailgunPayload(body: any): InboundEmailData {
    return {
      messageId: body['Message-Id'] || `mailgun-${Date.now()}`,
      from: body.sender || body.from,
      to: body.recipient || body.to,
      subject: body.Subject || body.subject || '',
      bodyText: body['body-plain'] || body.text || '',
      bodyHtml: body['body-html'] || body.html || '',
      headers: {
        'Message-ID': body['Message-Id'],
        'In-Reply-To': body['In-Reply-To'],
        References: body.References,
      },
      inReplyTo: body['In-Reply-To'],
      references: body.References,
    };
  }

  /**
   * ניתוח פורמט כללי
   */
  private parseGenericPayload(body: any): InboundEmailData | null {
    if (!body.from || !body.subject) {
      return null;
    }

    return {
      messageId: body.messageId || body['message-id'] || `generic-${Date.now()}`,
      from: this.extractEmail(body.from),
      to: this.extractEmail(body.to || 'info@meyadleyad.com'),
      subject: body.subject,
      bodyText: body.text || body.bodyText || '',
      bodyHtml: body.html || body.bodyHtml || '',
      headers: body.headers || {},
      attachments: body.attachments || [],
      inReplyTo: body.inReplyTo || body['in-reply-to'],
      references: body.references,
    };
  }

  /**
   * חילוץ כתובת אימייל נקייה מ-"Name <email@domain.com>"
   */
  private extractEmail(str: string): string {
    if (!str) return '';
    const match = str.match(/<(.+?)>/) || str.match(/([^\s<>]+@[^\s<>]+)/);
    return match ? match[1] : str.trim();
  }

  /**
   * Endpoint לטסט ידני
   * POST /api/email-operations/inbound/test
   */
  async handleTestEmail(req: Request, res: Response) {
    try {
      const { from, subject, text } = req.body;

      if (!from || !subject) {
        res.status(400).json({ error: 'Missing required fields: from, subject' });
        return;
      }

      const emailData: InboundEmailData = {
        messageId: `test-${Date.now()}`,
        from,
        to: 'test@meyadleyad.com',
        subject,
        bodyText: text || '',
        headers: {},
      };

      const result = await emailOperationsOrchestrator.processInboundEmail(emailData);

      res.status(200).json({
        success: true,
        result,
      });
    } catch (error) {
      console.error('❌ Error in test email:', error);
      res.status(500).json({ 
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * קבלת סטטיסטיקות אימיילים נכנסים (למנהל)
   * GET /api/email-operations/inbound/stats
   */
  async getInboundStats(req: Request, res: Response) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const [totalMessages, processedMessages, pendingMessages, last24h] = await Promise.all([
        prisma.emailInboundMessage.count(),
        prisma.emailInboundMessage.count({ where: { processed: true } }),
        prisma.emailInboundMessage.count({ where: { processed: false } }),
        prisma.emailInboundMessage.count({
          where: {
            receivedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const commandTypeStats = await prisma.emailRequest.groupBy({
        by: ['commandType', 'status'],
        _count: true,
      });

      res.status(200).json({
        totalMessages,
        processedMessages,
        pendingMessages,
        last24Hours: last24h,
        commandTypeStats,
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  /**
   * קבלת היסטוריה של אימייל ספציפי (למנהל)
   * GET /api/email-operations/inbound/history/:email
   */
  async getEmailHistory(req: Request, res: Response) {
    try {
      const { email } = req.params;
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const messages = await prisma.emailInboundMessage.findMany({
        where: {
          from: {
            contains: email,
            mode: 'insensitive',
          },
        },
        orderBy: { receivedAt: 'desc' },
        take: 50,
        include: {
          emailRequests: {
            select: {
              id: true,
              commandType: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      res.status(200).json({ messages });
    } catch (error) {
      console.error('❌ Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  }
}

// Export singleton instance
export const emailInboundController = new EmailInboundController();
