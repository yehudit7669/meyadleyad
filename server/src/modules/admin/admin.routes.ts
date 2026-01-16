import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const adminController = new AdminController();

router.use(authenticate);
router.use(authorize('ADMIN'));

// סטטיסטיקות
router.get('/statistics', adminController.getStatistics);

// ניהול משתמשים הועבר ל-/admin/users (users-admin.routes.ts)
// router.get('/users', adminController.getUsers); // REMOVED - use /admin/users instead
// router.put('/users/:id', adminController.updateUser); // REMOVED - use /admin/users/:id instead  
// router.delete('/users/:id', adminController.deleteUser); // REMOVED - use /admin/users/:id instead

// ניהול מודעות ממתינות
router.get('/ads/pending', adminController.getPendingAds);
router.get('/ads/:id', adminController.getAdById);
router.post('/ads/:id/approve', adminController.approveAd);
router.post('/ads/:id/reject', adminController.rejectAd);

// ניהול כל המודעות
router.get('/ads', adminController.getAllAds);
router.patch('/ads/:id/status', adminController.updateAdStatus);

// ייצוא היסטוריה (SuperAdmin בלבד)
router.post('/ads/export-history', adminController.exportAdsHistory);

// מחיקת מודעות משתמש הועבר ל-/admin/users (users-admin.routes.ts)
// router.delete('/users/:userId/ads', adminController.deleteUserAds); // REMOVED - use /admin/users/:id/ads/bulk-remove instead

export default router;
