import { Router, Request, Response } from 'express';
import { userManagementService } from './user-management.service';
import { validateRequest } from '../../middlewares/validation';
import { updateMeetingAccessSchema, getUsersQuerySchema } from './user-management.validation';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all users with filters
router.get('/', validateRequest({ query: getUsersQuerySchema }), async (req: Request, res: Response) => {
  try {
    const result = await userManagementService.getUsers(req.query as any);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
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
router.patch('/:userId/meeting-access', validateRequest({ body: updateMeetingAccessSchema }), async (req: Request, res: Response) => {
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
router.get('/:userId/meeting-access', async (req: Request, res: Response) => {
  try {
    const result = await userManagementService.getMeetingAccess(req.params.userId);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching meeting access:', error);
    res.status(500).json({ error: 'Failed to fetch meeting access' });
  }
});

// Export users to Excel
router.get('/export/excel', async (req: Request, res: Response) => {
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
