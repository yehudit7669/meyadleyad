import { Router } from 'express';
import { ServiceProviderController } from './service-provider.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// Protected routes - require authentication
router.get('/profile/me', authenticate, ServiceProviderController.getProfile);
router.patch('/profile/me', authenticate, ServiceProviderController.updateProfile);
router.post('/profile/office-address-request', authenticate, ServiceProviderController.requestOfficeAddressChange);
router.post('/account/export-request', authenticate, ServiceProviderController.requestDataExport);
router.post('/account/delete-request', authenticate, ServiceProviderController.requestAccountDeletion);
router.post('/highlight-request', authenticate, ServiceProviderController.requestHighlight);

// Audit Log
router.get('/audit-log', authenticate, ServiceProviderController.getAuditLog);

// Public routes
router.get('/:id', ServiceProviderController.getPublicProfile);
router.post('/contact/:id', ServiceProviderController.sendContactRequest);

export default router;
