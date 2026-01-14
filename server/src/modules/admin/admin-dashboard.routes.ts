import { Router } from 'express';
import { AdminDashboardController } from './admin-dashboard.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const dashboardController = new AdminDashboardController();

// כל ה-routes דורשים אימות + הרשאת ADMIN
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard endpoints
router.get('/summary', dashboardController.getSummary);
router.get('/actions', dashboardController.getActions);
router.get('/usage', dashboardController.getUsage);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.post('/usage/export', dashboardController.exportUsage);

export default router;
