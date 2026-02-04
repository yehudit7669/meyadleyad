import { Router } from 'express';
import { brokerController } from './broker.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = 'uploads/temp';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

// Public route - must be BEFORE authenticate middleware
router.get('/public/:id', brokerController.getPublicBrokerProfile.bind(brokerController));

// All broker routes require authentication and BROKER role
router.use(authenticate);
router.use(authorize('BROKER', 'SERVICE_PROVIDER')); // Support both BROKER and SERVICE_PROVIDER roles

// Profile routes
router.get('/profile', brokerController.getProfile.bind(brokerController));
router.patch('/profile/personal', brokerController.updatePersonalDetails.bind(brokerController));
router.patch('/profile/office', brokerController.updateOfficeDetails.bind(brokerController));
router.post('/profile/logo', brokerController.uploadLogo.bind(brokerController));

// Team management routes
router.get('/team', brokerController.getTeamMembers.bind(brokerController));
router.post('/team', brokerController.createTeamMember.bind(brokerController));
router.patch('/team/:id', brokerController.updateTeamMember.bind(brokerController));
router.delete('/team/:id', brokerController.deleteTeamMember.bind(brokerController));

// Ads routes
router.get('/ads', brokerController.getBrokerAds.bind(brokerController));

// Appointments routes
router.get('/appointments', brokerController.getAppointments.bind(brokerController));
router.patch('/appointments/:id/respond', brokerController.respondToAppointment.bind(brokerController));

// Availability routes
router.get('/availability/:adId', brokerController.getAvailability.bind(brokerController));
router.post('/availability', brokerController.createAvailabilitySlot.bind(brokerController));
router.delete('/availability/:id', brokerController.deleteAvailabilitySlot.bind(brokerController));

// Communication preferences
router.patch('/communication', brokerController.updateCommunication.bind(brokerController));

// Email change request
router.post('/email/change-request', brokerController.requestEmailChange.bind(brokerController));

// Featured request
router.post('/featured-request', brokerController.createFeaturedRequest.bind(brokerController));

// Account management
router.post('/account/export-request', brokerController.createExportRequest.bind(brokerController));
router.post('/account/delete-request', brokerController.createDeleteRequest.bind(brokerController));

// Audit log
router.get('/audit-log', brokerController.getAuditLog.bind(brokerController));

// Import routes - Re-use admin import logic but check permissions
router.post('/import/properties-file/preview', upload.single('file'), brokerController.importPropertiesPreview.bind(brokerController));
router.post('/import/properties-file/commit', brokerController.importPropertiesCommit.bind(brokerController));

// Request import permission
router.post('/import/request-permission', brokerController.requestImportPermission.bind(brokerController));

export default router;
