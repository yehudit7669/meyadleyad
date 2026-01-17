import { Router } from 'express';
import { UsersAdminController } from './users-admin.controller';
import { requireAdmin, requireSuperAdmin, requireAdminOrSuper } from '../../../middleware/rbac.middleware';
import { authenticate } from '../../../middlewares/auth';

const router = Router();
const controller = new UsersAdminController();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// POST /api/admin/users - Create new user (Super Admin only)
router.post('/', requireSuperAdmin, controller.createUser.bind(controller));

// GET /api/admin/users - List users (All admin roles)
router.get('/', controller.getUsers.bind(controller));

// POST /api/admin/users/export - Export users (Super Admin only) - MUST be before /:id
router.post('/export', requireSuperAdmin, controller.exportUsers.bind(controller));

// GET /api/admin/users/:id - Get user profile (All admin roles)
router.get('/:id', controller.getUserProfile.bind(controller));

// PATCH /api/admin/users/:id - Update user (Admin & Super Admin only)
router.patch('/:id', requireAdminOrSuper, controller.updateUser.bind(controller));

// POST /api/admin/users/:id/meetings-block - Block/unblock meetings (Admin & Super Admin only)
router.post('/:id/meetings-block', requireAdminOrSuper, controller.setMeetingsBlock.bind(controller));

// DELETE /api/admin/users/:id - Hard delete user (Super Admin only)
router.delete('/:id', requireSuperAdmin, controller.deleteUser.bind(controller));

// POST /api/admin/users/:id/ads/bulk-remove - Bulk remove user ads (Super Admin only)
router.post('/:id/ads/bulk-remove', requireSuperAdmin, controller.bulkRemoveUserAds.bind(controller));

export default router;
