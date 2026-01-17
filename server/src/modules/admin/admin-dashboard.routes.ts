import { Router } from 'express';
import { AdminDashboardController } from './admin-dashboard.controller';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();
const dashboardController = new AdminDashboardController();

// כל ה-routes דורשים אימות + הרשאת ADMIN
router.use(authenticate);
router.use(requireAdmin);

// Dashboard endpoints
router.get('/summary', dashboardController.getSummary);
router.get('/actions', dashboardController.getActions);
router.get('/usage', dashboardController.getUsage);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.post('/usage/export', dashboardController.exportUsage);

export default router;
