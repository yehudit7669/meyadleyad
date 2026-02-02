import { Router } from 'express';
import { pendingApprovalsController } from './pending-approvals.controller';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// Routes for regular users (no admin required)
// These work under both /approvals and /admin/pending-approvals
router.get(
  '/my/approvals',
  authenticate,
  pendingApprovalsController.getMyApprovals.bind(pendingApprovalsController)
);

router.post(
  '/',
  authenticate,
  pendingApprovalsController.createApproval.bind(pendingApprovalsController)
);

// Routes for admins only
router.get(
  '/',
  authenticate,
  requireAdmin,
  pendingApprovalsController.getAllApprovals.bind(pendingApprovalsController)
);

router.get(
  '/stats',
  authenticate,
  requireAdmin,
  pendingApprovalsController.getStats.bind(pendingApprovalsController)
);

router.get(
  '/pending-count',
  authenticate,
  requireAdmin,
  pendingApprovalsController.getPendingCount.bind(pendingApprovalsController)
);

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  pendingApprovalsController.getApprovalById.bind(pendingApprovalsController)
);

router.patch(
  '/:id/approve',
  authenticate,
  requireAdmin,
  pendingApprovalsController.approveApproval.bind(pendingApprovalsController)
);

router.patch(
  '/:id/reject',
  authenticate,
  requireAdmin,
  pendingApprovalsController.rejectApproval.bind(pendingApprovalsController)
);

export default router;
