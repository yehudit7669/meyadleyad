import { Router } from 'express';
import { AppointmentsAdminController } from './appointments.admin.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const adminController = new AppointmentsAdminController();

// כל ה-routes דורשים הרשאות admin
router.use(authenticate);
router.use(authorize('ADMIN'));

// קבלת policy של משתמש
router.get('/appointment-policy/:userId', adminController.getUserPolicy);

// עדכון/יצירת policy (חסימה/ביטול חסימה)
router.patch('/appointment-policy', adminController.setUserPolicy);

export default router;
