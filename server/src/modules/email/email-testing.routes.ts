/**
 * 🧪 Email Testing Routes (DEV ONLY)
 */

import { Router } from 'express';
import { emailTestingController } from './email-testing.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middleware/rbac.middleware';

const router = Router();

/**
 * GET /api/email-testing/types
 * קבלת רשימת כל סוגי המיילים (ללא auth בפיתוח)
 */
router.get(
  '/types',
  emailTestingController.getEmailTypes.bind(emailTestingController)
);

/**
 * POST /api/email-testing/send/:emailType
 * שליחת מייל טסט ספציפי
 * Body: { customEmail?: string }
 */
router.post(
  '/send/:emailType',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  emailTestingController.sendTestEmail.bind(emailTestingController)
);

/**
 * POST /api/email-testing/send-all
 * שליחת כל סוגי המיילים (לבדיקה מקיפה)
 * Body: { customEmail?: string }
 */
router.post(
  '/send-all',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  emailTestingController.sendAllTestEmails.bind(emailTestingController)
);

export default router;
