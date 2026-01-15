import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const adminController = new AdminController();

router.use(authenticate);
router.use(authorize('ADMIN'));

// סטטיסטיקות ומשתמשים
router.get('/statistics', adminController.getStatistics);
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

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

// מחיקת מודעות משתמש
router.delete('/users/:userId/ads', adminController.deleteUserAds);

export default router;
