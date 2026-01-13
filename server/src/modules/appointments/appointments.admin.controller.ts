import { Request, Response, NextFunction } from 'express';
import { AppointmentsService } from './appointments.service';
import { AuthRequest } from '../../middlewares/auth';
import { blockUserSchema } from './appointments.validation';

export class AppointmentsAdminController {
  private appointmentsService: AppointmentsService;

  constructor() {
    this.appointmentsService = new AppointmentsService();
  }

  /**
   * GET /api/admin/appointment-policy/:userId - קבלת policy של משתמש
   */
  getUserPolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId } = req.params;
      const policy =
        await this.appointmentsService.getUserAppointmentPolicy(userId);

      res.json({
        success: true,
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/appointment-policy - חסימה/ביטול חסימה
   */
  setUserPolicy = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const adminId = req.user!.id;
      const validated = blockUserSchema.parse(req.body);

      const policy =
        await this.appointmentsService.setUserAppointmentPolicy(
          adminId,
          validated
        );

      res.json({
        success: true,
        data: policy,
        message: validated.isBlocked
          ? 'המשתמש נחסם מקביעת פגישות'
          : 'החסימה הוסרה בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  };
}
