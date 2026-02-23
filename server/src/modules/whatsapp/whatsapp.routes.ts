/**
 * WhatsApp Distribution Routes
 * כל ה-routes למודול WhatsApp
 */

import { Router } from 'express';
import { whatsappDistributionController } from './whatsapp-distribution.controller';
import { whatsappGroupsController } from './whatsapp-groups.controller';
import {
  requireWhatsAppContentManager,
  requireWhatsAppSuperAdmin,
  checkWhatsAppFeatureFlag,
  rateLimit,
  logWhatsAppAction,
  canOverrideResend,
} from './whatsapp-rbac.middleware';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// Apply global middlewares
router.use(authenticate); // Require authentication
router.use(checkWhatsAppFeatureFlag); // Check if module is enabled
router.use(logWhatsAppAction); // Log all actions

// ==================== DISTRIBUTION ROUTES ====================

/**
 * אישור+שליחה למודעה
 * POST /api/admin/whatsapp/listings/:id/approve-and-distribute
 */
router.post(
  '/listings/:id/approve-and-distribute',
  requireWhatsAppContentManager,
  rateLimit(20, 60 * 1000), // 20 per minute
  whatsappDistributionController.approveAndDistribute.bind(whatsappDistributionController)
);

/**
 * יצירת distribution item ידנית (לאישור מודעה)
 * POST /api/admin/whatsapp/listings/:id/create-distribution
 */
router.post(
  '/listings/:id/create-distribution',
  requireWhatsAppContentManager,
  rateLimit(20, 60 * 1000),
  whatsappDistributionController.createManualDistributionItem.bind(whatsappDistributionController)
);

/**
 * קבלת טקסט הודעה למודעה
 * GET /api/admin/whatsapp/listings/:id/message-text
 */
router.get(
  '/listings/:id/message-text',
  requireWhatsAppContentManager,
  whatsappDistributionController.getAdMessageText.bind(whatsappDistributionController)
);

/**
 * תור הפצה
 * GET /api/admin/whatsapp/queue
 */
router.get(
  '/queue',
  requireWhatsAppContentManager,
  whatsappDistributionController.getQueue.bind(whatsappDistributionController)
);

/**
 * התחלת שליחה
 * POST /api/admin/whatsapp/queue/:itemId/start
 */
router.post(
  '/queue/:itemId/start',
  requireWhatsAppContentManager,
  rateLimit(50, 60 * 1000), // 50 per minute
  whatsappDistributionController.startSending.bind(whatsappDistributionController)
);

/**
 * סימון כבתהליך (המנהל לחץ על הפץ)
 * POST /api/admin/whatsapp/queue/:itemId/mark-in-progress
 */
router.post(
  '/queue/:itemId/mark-in-progress',
  requireWhatsAppContentManager,
  rateLimit(50, 60 * 1000),
  whatsappDistributionController.markItemAsInProgress.bind(whatsappDistributionController)
);

/**
 * ביטול תהליך שליחה - חזרה ל-PENDING
 * POST /api/admin/whatsapp/queue/:itemId/cancel-sending
 */
router.post(
  '/queue/:itemId/cancel-sending',
  requireWhatsAppContentManager,
  rateLimit(50, 60 * 1000),
  whatsappDistributionController.cancelSending.bind(whatsappDistributionController)
);

/**
 * קבלת clipboard text להעתקה (בלי לשנות סטטוס)
 * GET /api/admin/whatsapp/queue/:itemId/clipboard-text
 */
router.get(
  '/queue/:itemId/clipboard-text',
  requireWhatsAppContentManager,
  whatsappDistributionController.getClipboardText.bind(whatsappDistributionController)
);

/**
 * סימון כנשלח
 * POST /api/admin/whatsapp/queue/:itemId/mark-sent
 */
router.post(
  '/queue/:itemId/mark-sent',
  requireWhatsAppContentManager,
  rateLimit(50, 60 * 1000),
  whatsappDistributionController.markItemAsSent.bind(whatsappDistributionController)
);

/**
 * דחייה
 * POST /api/admin/whatsapp/queue/:itemId/defer
 */
router.post(
  '/queue/:itemId/defer',
  requireWhatsAppContentManager,
  whatsappDistributionController.deferItem.bind(whatsappDistributionController)
);

/**
 * Override resend (מנהל ראשי בלבד)
 * POST /api/admin/whatsapp/queue/:itemId/override-resend
 */
router.post(
  '/queue/:itemId/override-resend',
  requireWhatsAppSuperAdmin, // Only super admin
  whatsappDistributionController.overrideResend.bind(whatsappDistributionController)
);

// ==================== DIGEST ROUTES ====================

/**
 * יצירת Digest
 * POST /api/admin/whatsapp/groups/:groupId/create-digest
 */
router.post(
  '/groups/:groupId/create-digest',
  requireWhatsAppContentManager,
  rateLimit(10, 60 * 1000), // 10 per minute
  whatsappDistributionController.createDigest.bind(whatsappDistributionController)
);

/**
 * סימון Digest כנשלח
 * POST /api/admin/whatsapp/digests/:digestId/mark-sent
 */
router.post(
  '/digests/:digestId/mark-sent',
  requireWhatsAppContentManager,
  whatsappDistributionController.markDigestSent.bind(whatsappDistributionController)
);

// ==================== REPORTS & DASHBOARD ====================

/**
 * דוח יומי
 * GET /api/admin/whatsapp/reports/daily
 */
router.get(
  '/reports/daily',
  requireWhatsAppContentManager,
  whatsappDistributionController.getDailyReport.bind(whatsappDistributionController)
);

/**
 * Dashboard KPIs
 * GET /api/admin/whatsapp/dashboard
 */
router.get(
  '/dashboard',
  requireWhatsAppContentManager,
  whatsappDistributionController.getDashboard.bind(whatsappDistributionController)
);

// ==================== GROUPS MANAGEMENT ====================

/**
 * קבלת כל הקבוצות
 * GET /api/admin/whatsapp/groups
 */
router.get(
  '/groups',
  requireWhatsAppContentManager,
  whatsappGroupsController.getGroups.bind(whatsappGroupsController)
);

/**
 * קבלת קבוצה לפי ID
 * GET /api/admin/whatsapp/groups/:id
 */
router.get(
  '/groups/:id',
  requireWhatsAppContentManager,
  whatsappGroupsController.getGroupById.bind(whatsappGroupsController)
);

/**
 * יצירת קבוצה חדשה (מנהל ראשי בלבד)
 * POST /api/admin/whatsapp/groups
 */
router.post(
  '/groups',
  requireWhatsAppSuperAdmin,
  whatsappGroupsController.createGroup.bind(whatsappGroupsController)
);

/**
 * עדכון קבוצה (מנהל ראשי בלבד)
 * PATCH /api/admin/whatsapp/groups/:id
 */
router.patch(
  '/groups/:id',
  requireWhatsAppSuperAdmin,
  whatsappGroupsController.updateGroup.bind(whatsappGroupsController)
);

/**
 * מחיקת קבוצה (מנהל ראשי בלבד)
 * DELETE /api/admin/whatsapp/groups/:id
 */
router.delete(
  '/groups/:id',
  requireWhatsAppSuperAdmin,
  whatsappGroupsController.deleteGroup.bind(whatsappGroupsController)
);

/**
 * שינוי סטטוס קבוצה
 * PATCH /api/admin/whatsapp/groups/:id/status
 */
router.patch(
  '/groups/:id/status',
  requireWhatsAppSuperAdmin,
  whatsappGroupsController.changeStatus.bind(whatsappGroupsController)
);

// ==================== GROUP SUGGESTIONS ====================

/**
 * הצעת קבוצה חדשה (מנהל תוכן)
 * POST /api/admin/whatsapp/groups/suggest
 */
router.post(
  '/groups/suggest',
  requireWhatsAppContentManager,
  rateLimit(5, 60 * 60 * 1000), // 5 per hour
  whatsappGroupsController.suggestGroup.bind(whatsappGroupsController)
);

/**
 * קבלת כל ההצעות
 * GET /api/admin/whatsapp/groups/suggestions
 */
router.get(
  '/groups/suggestions',
  requireWhatsAppSuperAdmin,
  whatsappGroupsController.getSuggestions.bind(whatsappGroupsController)
);

/**
 * אישור הצעה
 * POST /api/admin/whatsapp/groups/suggestions/:id/approve
 */
router.post(
  '/groups/suggestions/:id/approve',
  requireWhatsAppSuperAdmin,
  whatsappGroupsController.approveSuggestion.bind(whatsappGroupsController)
);

/**
 * דחיית הצעה
 * POST /api/admin/whatsapp/groups/suggestions/:id/reject
 */
router.post(
  '/groups/suggestions/:id/reject',
  requireWhatsAppSuperAdmin,
  whatsappGroupsController.rejectSuggestion.bind(whatsappGroupsController)
);

export default router;
