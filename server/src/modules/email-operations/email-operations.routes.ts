/**
 * Email Operations Routes
 * נתיבים עבור מערכת הדיוור דרך אימייל
 */

import { Router } from 'express';
import multer from 'multer';
import { emailInboundController } from './email-inbound.controller';
import { emailOperationsFormController } from './email-operations-form.controller';
import { emailRateLimiter } from './email-rate-limiter.service';
import { emailAuditLogger } from './email-audit-logger.service';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middleware/rbac.middleware';

const router = Router();

// Multer configuration for SendGrid Inbound Parse (multipart/form-data)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // max 10 attachments
  },
});

// ===============================================
// Inbound Email Endpoints
// ===============================================

/**
 * Webhook לקבלת אימיילים נכנסים
 * POST /api/email-operations/inbound/webhook
 * 
 * נקרא ע"י ספק האימייל (SendGrid, Mailgun, etc.)
 * תומך ב-multipart/form-data (SendGrid) ו-JSON (Mailgun/Generic)
 */
router.post(
  '/inbound/webhook',
  upload.any(),
  (req, res) => emailInboundController.handleInboundWebhook(req, res)
);

/**
 * אנדפוינט לטסט ידני
 * POST /api/email-operations/inbound/test
 */
router.post(
  '/inbound/test',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  (req, res) => emailInboundController.handleTestEmail(req, res)
);

/**
 * סטטיסטיקות אימיילים נכנסים (למנהל)
 * GET /api/email-operations/inbound/stats
 */
router.get(
  '/inbound/stats',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  (req, res) => emailInboundController.getInboundStats(req, res)
);

/**
 * היסטוריה של אימייל ספציפי
 * GET /api/email-operations/inbound/history/:email
 */
router.get(
  '/inbound/history/:email',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  (req, res) => emailInboundController.getEmailHistory(req, res)
);

// ===============================================
// Form Submission Endpoints
// ===============================================

/**
 * קבלת טופס פרסום מודעה/בקשה
 * POST /api/email-operations/forms/submit
 */
router.post(
  '/forms/submit',
  (req, res) => emailOperationsFormController.handleFormSubmission(req, res)
);

/**
 * Webhook מ-Google Forms (Apps Script)
 * POST /api/email-operations/forms/google-forms-webhook
 */
router.post(
  '/forms/google-forms-webhook',
  (req, res) => emailOperationsFormController.handleGoogleFormsWebhook(req, res)
);

/**
 * השלמת הרשמה - עיבוד Pending Intents
 * POST /api/email-operations/registration-completed
 */
router.post(
  '/registration-completed',
  (req, res) => emailOperationsFormController.handleRegistrationCompleted(req, res)
);

/**
 * קבלת URL לטופס
 * GET /api/email-operations/forms/url/:category
 */
router.get(
  '/forms/url/:category',
  (req, res) => emailOperationsFormController.getFormUrl(req, res)
);

// ===============================================
// Mailing List Management (למנהל)
// ===============================================

/**
 * קבלת כל רשימת התפוצה
 * GET /api/email-operations/mailing-list
 */
router.get(
  '/mailing-list',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const list = await prisma.emailOperationsMailingList.findMany({
        orderBy: { createdAt: 'desc' },
      });

      res.json({ list });
    } catch (error) {
      console.error('Error fetching mailing list:', error);
      res.status(500).json({ error: 'Failed to fetch mailing list' });
    }
  }
);

/**
 * הוספה ידנית לרשימת תפוצה (למנהל)
 * POST /api/email-operations/mailing-list/add
 */
router.post(
  '/mailing-list/add',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { email, name } = req.body;
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const subscriber = await prisma.emailOperationsMailingList.upsert({
        where: { email: email.toLowerCase().trim() },
        update: {
          status: 'ACTIVE',
          removedAt: null,
          name,
        },
        create: {
          email: email.toLowerCase().trim(),
          name,
          status: 'ACTIVE',
          source: 'admin',
        },
      });

      res.json({ subscriber });
    } catch (error) {
      console.error('Error adding to mailing list:', error);
      res.status(500).json({ error: 'Failed to add to mailing list' });
    }
  }
);

/**
 * הסרה ידנית מרשימת תפוצה (למנהל)
 * POST /api/email-operations/mailing-list/remove
 */
router.post(
  '/mailing-list/remove',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { email } = req.body;
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      await prisma.emailOperationsMailingList.update({
        where: { email: email.toLowerCase().trim() },
        data: {
          status: 'REMOVED',
          removedAt: new Date(),
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing from mailing list:', error);
      res.status(500).json({ error: 'Failed to remove from mailing list' });
    }
  }
);

// ===============================================
// Audit & Monitoring (למנהל)
// ===============================================

/**
 * קבלת Audit Logs של מערכת האימייל
 * GET /api/email-operations/audit
 */
router.get(
  '/audit',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const { email, limit = '100', commandType } = req.query;

      const where: any = {};
      if (email) {
        where.email = { contains: email as string, mode: 'insensitive' };
      }
      if (commandType) {
        where.commandType = commandType;
      }

      const logs = await prisma.emailAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
      });

      res.json({ logs });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

/**
 * סטטיסטיקות כלליות של מערכת האימייל
 * GET /api/email-operations/stats
 */
router.get(
  '/stats',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const [
        totalInbound,
        totalRequests,
        totalAuditLogs,
        mailingListCount,
        pendingIntents,
      ] = await Promise.all([
        prisma.emailInboundMessage.count(),
        prisma.emailRequest.count(),
        prisma.emailAuditLog.count(),
        prisma.emailOperationsMailingList.count({ where: { status: 'ACTIVE' } }),
        prisma.pendingIntent.count({ where: { status: 'PENDING' } }),
      ]);

      const requestsByStatus = await prisma.emailRequest.groupBy({
        by: ['status'],
        _count: true,
      });

      const auditByCommand = await prisma.emailAuditLog.groupBy({
        by: ['commandType', 'success'],
        _count: true,
      });

      res.json({
        totalInbound,
        totalRequests,
        totalAuditLogs,
        mailingListCount,
        pendingIntents,
        requestsByStatus,
        auditByCommand,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
);

/**
 * ניקוי נתונים ישנים (maintenance)
 * POST /api/email-operations/cleanup
 */
router.post(
  '/cleanup',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { daysOld = 90 } = req.body;

      const rateLimitCleaned = await emailRateLimiter.cleanup(daysOld);
      const auditCleaned = await emailAuditLogger.cleanup(daysOld);

      res.json({
        success: true,
        rateLimitCleaned,
        auditCleaned,
      });
    } catch (error) {
      console.error('Error in cleanup:', error);
      res.status(500).json({ error: 'Cleanup failed' });
    }
  }
);

export default router;
