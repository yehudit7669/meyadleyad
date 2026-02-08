import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin, requireAdminOrSuper } from '../../middleware/rbac.middleware';
import { checkPermission } from '../../middleware/check-permission.middleware';

const router = Router();
const adminController = new AdminController();

router.use(authenticate);
router.use(requireAdmin);

// סטטיסטיקות (All admin roles can view)
router.get('/statistics', checkPermission('export_stats'), adminController.getStatistics);

// ניהול משתמשים הועבר ל-/admin/users (users-admin.routes.ts)
// router.get('/users', adminController.getUsers); // REMOVED - use /admin/users instead
// router.put('/users/:id', adminController.updateUser); // REMOVED - use /admin/users/:id instead  
// router.delete('/users/:id', adminController.deleteUser); // REMOVED - use /admin/users/:id instead

// ניהול מודעות ממתינות (Read-only for Moderators)
router.get('/ads/pending', adminController.getPendingAds);

// ✅ ניהול שינויים ממתינים - חייב להיות לפני /ads/:id
router.get('/ads/pending-changes', adminController.getAdsWithPendingChanges);
router.post('/ads/:id/approve-changes', requireAdminOrSuper, adminController.approvePendingChanges);
router.post('/ads/:id/reject-changes', requireAdminOrSuper, adminController.rejectPendingChanges);

// ייצוא היסטוריה (Admin & Super Admin only)
router.post('/ads/export-history', checkPermission('export_ads'), adminController.exportAdsHistory);

// ניהול כל המודעות (Read-only for Moderators)
router.get('/ads', adminController.getAllAds);

// Routes עם :id parameters - חייבים להיות אחרונים!
router.get('/ads/:id', adminController.getAdById);
router.post('/ads/:id/approve', requireAdminOrSuper, adminController.approveAd);
router.post('/ads/:id/reject', requireAdminOrSuper, adminController.rejectAd);
router.patch('/ads/:id/status', requireAdminOrSuper, adminController.updateAdStatus);

// מחיקת מודעות משתמש הועבר ל-/admin/users (users-admin.routes.ts)
// router.delete('/users/:userId/ads', adminController.deleteUserAds); // REMOVED - use /admin/users/:id/ads/bulk-remove instead

export default router;
