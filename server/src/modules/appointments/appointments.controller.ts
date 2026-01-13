import { Request, Response, NextFunction } from 'express';
import { AppointmentsService } from './appointments.service';
import { AuthRequest } from '../../middlewares/auth';
import {
  requestAppointmentSchema,
  approveRejectSchema,
  availabilitySchema,
} from './appointments.validation';

export class AppointmentsController {
  private appointmentsService: AppointmentsService;

  constructor() {
    this.appointmentsService = new AppointmentsService();
  }

  /**
   * POST /api/appointments - בקשת פגישה
   */
  requestAppointment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.id;
      const validated = requestAppointmentSchema.parse(req.body);

      const appointment =
        await this.appointmentsService.requestAppointment(userId, validated);

      res.status(201).json({
        success: true,
        data: appointment,
        message: 'הבקשה נשלחה בהצלחה. נעדכן אותך עם אישור הפגישה.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/appointments/me - הפגישות שלי (כמבקש)
   */
  getMyAppointments = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.id;
      const appointments =
        await this.appointmentsService.getRequesterAppointments(userId);

      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/appointments/owner - פגישות לנכסים שלי
   */
  getOwnerAppointments = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.id;
      const { status } = req.query;

      const appointments = await this.appointmentsService.getOwnerAppointments(
        userId,
        status as any
      );

      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/appointments/owner/action - אישור/דחייה/הצעת מועד
   */
  ownerAction = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.id;
      const validated = approveRejectSchema.parse(req.body);

      const result = await this.appointmentsService.ownerAction(
        userId,
        validated
      );

      res.json({
        success: true,
        data: result,
        message: 'הפעולה בוצעה בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/availability/:adId - קבלת זמינות מודעה (פומבי)
   */
  getAdAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { adId } = req.params;
      const slots = await this.appointmentsService.getAdAvailability(adId);

      res.json({
        success: true,
        data: slots,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/availability - קביעת זמינות למודעה
   */
  setAdAvailability = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.id;
      const validated = availabilitySchema.parse(req.body);

      const result = await this.appointmentsService.setAdAvailability(
        userId,
        validated
      );

      res.json({
        success: true,
        data: result,
        message: 'הזמינות עודכנה בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/appointments/confirm-reschedule/:id - אישור מועד חלופי על ידי המבקש
   */
  confirmReschedule = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await this.appointmentsService.confirmReschedule(userId, id);

      res.json({
        success: true,
        data: result,
        message: 'המועד החלופי אושר בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/appointments/:id - ביטול פגישה על ידי המבקש
   */
  cancelAppointment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await this.appointmentsService.cancelAppointment(userId, id);

      res.json({
        success: true,
        data: result,
        message: 'הפגישה בוטלה בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  };
}
