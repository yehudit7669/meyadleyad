import { Router, Request, Response } from 'express';
import { appointmentsAdminService } from './appointments.service';
import { validateRequest } from '../../middlewares/validation';
import { 
  getAppointmentsQuerySchema, 
  updateAppointmentStatusSchema,
  cancelAppointmentSchema 
} from './appointments.validation';
import { authenticate, authorize } from '../../middlewares/auth';
import { AuthRequest } from '../../middlewares/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all appointments with filters (all admin roles)
router.get(
  '/', 
  authorize('SUPER_ADMIN', 'ADMIN', 'MODERATOR'),
  validateRequest({ query: getAppointmentsQuerySchema }), 
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await appointmentsAdminService.getAppointments(
        req.query as any, 
        req.user!.role
      );
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  }
);

// Get single appointment by ID (all admin roles)
router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'MODERATOR'),
  async (req: AuthRequest, res: Response) => {
    try {
      const appointment = await appointmentsAdminService.getAppointmentById(
        req.params.id,
        req.user!.role
      );
      res.json(appointment);
    } catch (error: any) {
      console.error('Error fetching appointment:', error);
      if (error.message === 'Appointment not found') {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  }
);

// Update appointment status (Admin and Super Admin only)
router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validateRequest({ body: updateAppointmentStatusSchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, reason } = req.body;
      const updated = await appointmentsAdminService.updateAppointmentStatus(
        req.params.id,
        status,
        reason,
        req.user!.id,
        req.user!.role,
        req.ip
      );
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      if (error.message === 'Appointment not found') {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      if (error.message === 'Insufficient permissions') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      if (error.message.includes('Reason is required')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update appointment status' });
    }
  }
);

// Cancel appointment (Admin and Super Admin only)
router.post(
  '/:id/cancel',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validateRequest({ body: cancelAppointmentSchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { reason } = req.body;
      const updated = await appointmentsAdminService.cancelAppointment(
        req.params.id,
        reason,
        req.user!.id,
        req.user!.role,
        req.ip
      );
      res.json(updated);
    } catch (error: any) {
      console.error('Error canceling appointment:', error);
      if (error.message === 'Appointment not found') {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      if (error.message === 'Insufficient permissions') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  }
);

// Get appointment statistics (all admin roles)
router.get(
  '/stats/summary',
  authorize('SUPER_ADMIN', 'ADMIN', 'MODERATOR'),
  async (_req: Request, res: Response) => {
    try {
      const stats = await appointmentsAdminService.getAppointmentStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching appointment stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
);

export default router;
