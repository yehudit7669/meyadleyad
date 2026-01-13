import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Preferences
router.get('/preferences', ProfileController.getPreferences);
router.patch('/preferences', ProfileController.updatePreferences);

// My Ads
router.get('/my-ads', ProfileController.getMyAds);
router.delete('/ads/:adId', ProfileController.deleteMyAd);

// Favorites
router.get('/favorites', ProfileController.getFavorites);
router.post('/favorites', ProfileController.addFavorite);
router.delete('/favorites/:adId', ProfileController.removeFavorite);

// Personal Details
router.get('/me', ProfileController.getPersonalDetails);
router.patch('/me', ProfileController.updatePersonalDetails);

// Appointments
router.get('/appointments', ProfileController.getAppointments);
router.post('/appointments', ProfileController.createAppointment);
router.patch('/appointments/:appointmentId/cancel', ProfileController.cancelAppointment);

// Account Management
router.post('/account/delete-request', ProfileController.requestAccountDeletion);

// Audit Log
router.get('/audit-log', ProfileController.getAuditLog);

export default router;
