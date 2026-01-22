import { Router, Request, Response } from 'express';
import { userManagementService } from './user-management.service';
import { validateRequest } from '../../middlewares/validation';
import { updateMeetingAccessSchema, getUsersQuerySchema } from './user-management.validation';
import { authenticate, authorize } from '../../middlewares/auth';
import { checkPermission } from '../../middleware/check-permission.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all users with filters
router.get('/', authorize('ADMIN'), validateRequest({ query: getUsersQuerySchema }), async (req: Request, res: Response) => {
  try {
    const result = await userManagementService.getUsers(req.query as any);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/:userId', authorize('ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userManagementService.getUserDetails(req.params.userId);
    res.json(user);
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update meeting access
router.patch('/:userId/meeting-access', authorize('ADMIN'), validateRequest({ body: updateMeetingAccessSchema }), async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const result = await userManagementService.updateMeetingAccess(
      req.params.userId,
      adminId,
      req.body
    );
    res.json(result);
  } catch (error: any) {
    console.error('Error updating meeting access:', error);
    res.status(500).json({ error: 'Failed to update meeting access' });
  }
});

// Get meeting access
router.get('/:userId/meeting-access', authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const result = await userManagementService.getMeetingAccess(req.params.userId);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching meeting access:', error);
    res.status(500).json({ error: 'Failed to fetch meeting access' });
  }
});

// Export users to Excel (POST endpoint for client compatibility)
router.post('/export', checkPermission('export_users'), async (req: Request, res: Response) => {
  try {
    const params = req.query;
    const workbook = await userManagementService.exportUsersToExcel({
      role: params.role as string,
      search: params.search as string,
      roleType: params.roleType as string,
      status: params.status as string,
      dateFrom: params.dateFrom as string,
      dateTo: params.dateTo as string,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// Export users to Excel (GET endpoint - legacy)
router.get('/export/excel', checkPermission('export_users'), async (req: Request, res: Response) => {
  try {
    const { role, search } = req.query;
    const workbook = await userManagementService.exportUsersToExcel({
      role: role as string,
      search: search as string,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

export default router;
