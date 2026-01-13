import { Router } from 'express';
import { AppointmentsController } from './appointments.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const appointmentsController = new AppointmentsController();

// בקשת פגישה חדשה (נדרש אימות)
router.post('/', authenticate, appointmentsController.requestAppointment);

// הפגישות שלי (כמבקש)
router.get('/me', authenticate, appointmentsController.getMyAppointments);

// פגישות לנכסים שלי (כבעל מודעה)
router.get('/owner', authenticate, appointmentsController.getOwnerAppointments);

// אישור/דחייה/הצעת מועד (כבעל מודעה)
router.post('/owner/action', authenticate, appointmentsController.ownerAction);

// קבלת זמינות מודעה (פומבי - ללא אימות)
router.get('/availability/:adId', appointmentsController.getAdAvailability);

// קביעת זמינות למודעה שלי (נדרש אימות)
router.post('/availability', authenticate, appointmentsController.setAdAvailability);

// אישור מועד חלופי על ידי המבקש (נדרש אימות)
router.post('/confirm-reschedule/:id', authenticate, appointmentsController.confirmReschedule);

// ביטול פגישה על ידי המבקש (נדרש אימות)
router.delete('/:id', authenticate, appointmentsController.cancelAppointment);

export default router;
