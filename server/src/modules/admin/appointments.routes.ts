import { Router, Request, Response } from 'express';
import { appointmentsAdminService } from './appointments.service';
import { validateRequest } from '../../middlewares/validation';
import { getAppointmentsQuerySchema } from './appointments.validation';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all appointments with filters
router.get('/', validateRequest({ query: getAppointmentsQuerySchema }), async (req: Request, res: Response) => {
  try {
    const result = await appointmentsAdminService.getAppointments(req.query as any);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointment statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await appointmentsAdminService.getAppointmentStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
