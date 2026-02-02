import { Router } from 'express';
import { notificationsService } from './notifications.service';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middleware/rbac.middleware';

const router = Router();

// ===== ADMIN ROUTES =====

// Get global notification settings
router.get(
  '/admin/settings',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (req, res, next) => {
    try {
      const settings = await notificationsService.getGlobalSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  },
);

// Update global notification settings
router.put(
  '/admin/settings',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (req, res, next) => {
    try {
      const { enabled } = req.body;
      const settings = await notificationsService.updateGlobalSettings(enabled);
      res.json(settings);
    } catch (error) {
      next(error);
    }
  },
);

// Set user notification override
router.post(
  '/admin/override',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (req, res, next) => {
    try {
      const { email, mode, expiresAt, reason } = req.body;
      
      const override = await notificationsService.setUserOverrideByEmail(
        email,
        mode,
        new Date(expiresAt),
        reason,
      );
      res.json(override);
    } catch (error) {
      next(error);
    }
  },
);

// Remove user notification override
router.delete(
  '/admin/override/:userId',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      await notificationsService.removeUserOverride(userId);
      res.json({ message: 'Override removed successfully' });
    } catch (error) {
      next(error);
    }
  },
);

// Get user notification override
router.get(
  '/admin/override/:userId',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const override = await notificationsService.getUserOverride(userId);
      res.json(override);
    } catch (error) {
      next(error);
    }
  },
);

// Retry failed notifications
router.post(
  '/admin/retry-failed',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (req, res, next) => {
    try {
      const { maxRetries } = req.body;
      const count = await notificationsService.retryFailedNotifications(maxRetries);
      res.json({ 
        message: `Retried ${count} notifications successfully`,
        count 
      });
    } catch (error) {
      next(error);
    }
  },
);

// ===== USER ROUTES =====

// Get my notification status (override + global settings)
router.get('/my-status', authenticate, async (req, res, next) => {
  try {
    const status = await notificationsService.getUserNotificationStatus((req as any).user.id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Get my notification override (if any)
router.get('/my-override', authenticate, async (req, res, next) => {
  try {
    const override = await notificationsService.getUserOverride((req as any).user.id);
    res.json(override);
  } catch (error) {
    next(error);
  }
});

export default router;
