import { Response, NextFunction, Request } from 'express';
import { brokerService } from './broker.service';
import { AuthRequest } from '../../middlewares/auth';
import { AuditService } from '../profile/audit.service';
import {
  updatePersonalDetailsSchema,
  updateOfficeDetailsSchema,
  createTeamMemberSchema,
  updateTeamMemberSchema,
  updateCommunicationSchema,
  requestEmailChangeSchema,
  createFeaturedRequestSchema,
  respondToAppointmentSchema,
  createAvailabilitySlotSchema,
  createAccountDeletionRequestSchema,
} from './broker.validation';

export class BrokerController {
  // GET /api/broker/public/:id - Public endpoint (no auth required)
  async getPublicBrokerProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const brokerId = req.params.id;
      const profile = await brokerService.getPublicProfile(brokerId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/broker/profile
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const profile = await brokerService.getProfile(userId, ip);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/broker/profile/personal
  async updatePersonalDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const data = updatePersonalDetailsSchema.parse(req.body);
      const result = await brokerService.updatePersonalDetails(userId, data, ip);
      res.json({ message: 'פרטים אישיים עודכנו בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/broker/profile/office
  async updateOfficeDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const data = updateOfficeDetailsSchema.parse(req.body);
      const result = await brokerService.updateOfficeDetails(userId, data, ip);
      res.json({ message: 'פרטי משרד עודכנו בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/broker/profile/logo
  async uploadLogo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      
      // In real implementation, this would handle file upload with multer
      // For now, expecting logoUrl in body
      const { logoUrl } = req.body;
      
      if (!logoUrl) {
        res.status(400).json({ message: 'לוגו חייב להיות מוגדר' });
        return;
      }

      const result = await brokerService.uploadOfficeLogo(userId, logoUrl, ip);
      res.json({ message: 'לוגו הועלה בהצלחה וממתין לאישור', data: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/broker/team
  async getTeamMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const members = await brokerService.getTeamMembers(userId);
      res.json(members);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/broker/team
  async createTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const data = createTeamMemberSchema.parse(req.body);
      const result = await brokerService.createTeamMember(userId, data, ip);
      res.status(201).json({ message: 'איש צוות נוסף בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/broker/team/:id
  async updateTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const memberId = req.params.id;
      const ip = req.ip;
      const data = updateTeamMemberSchema.parse(req.body);
      const result = await brokerService.updateTeamMember(userId, memberId, data, ip);
      res.json({ message: 'איש צוות עודכן בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/broker/team/:id
  async deleteTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const memberId = req.params.id;
      const ip = req.ip;
      await brokerService.deleteTeamMember(userId, memberId, ip);
      res.json({ message: 'איש צוות הוסר בהצלחה' });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/broker/ads
  async getBrokerAds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ads = await brokerService.getBrokerAds(userId);
      res.json(ads);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/broker/appointments
  async getAppointments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const appointments = await brokerService.getAppointments(userId);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/broker/appointments/:id/respond
  async respondToAppointment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const appointmentId = req.params.id;
      const ip = req.ip;
      const data = respondToAppointmentSchema.parse(req.body);
      const result = await brokerService.respondToAppointment(userId, appointmentId, data, ip);
      res.json({ message: 'תגובה לפגישה נשלחה בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/broker/availability/:adId
  async getAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adId = req.params.adId;
      const slots = await brokerService.getAvailabilitySlots(adId);
      res.json(slots);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/broker/availability
  async createAvailabilitySlot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const data = createAvailabilitySlotSchema.parse(req.body);
      const result = await brokerService.createAvailabilitySlot(userId, data, ip);
      res.status(201).json({ message: 'זמינות נוספה בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/broker/availability/:id
  async deleteAvailabilitySlot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const slotId = req.params.id;
      const ip = req.ip;
      await brokerService.deleteAvailabilitySlot(userId, slotId, ip);
      res.json({ message: 'זמינות הוסרה בהצלחה' });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/broker/communication
  async updateCommunication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const data = updateCommunicationSchema.parse(req.body);
      const result = await brokerService.updateCommunication(userId, data, ip);
      res.json({ message: 'העדפות תקשורת עודכנו בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/broker/email/change-request
  async requestEmailChange(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const data = requestEmailChangeSchema.parse(req.body);
      const result = await brokerService.requestEmailChange(userId, data, ip);
      res.json({ message: 'בקשה לשינוי מייל נשלחה בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/broker/featured-request
  async createFeaturedRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const data = createFeaturedRequestSchema.parse(req.body);
      const result = await brokerService.createFeaturedRequest(userId, data, ip);
      res.status(201).json({ message: 'בקשה להדגשה נשלחה בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/broker/account/export-request
  async createExportRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const result = await brokerService.createDataExportRequest(userId, ip);
      res.status(201).json({ message: 'בקשה לייצוא נתונים נשלחה בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/broker/account/delete-request
  async createDeleteRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const data = createAccountDeletionRequestSchema.parse(req.body);
      const result = await brokerService.createAccountDeletionRequest(userId, data, ip);
      res.status(201).json({ message: 'בקשה למחיקת חשבון נשלחה בהצלחה', data: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/broker/audit-log - Get broker audit log
  async getAuditLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await AuditService.getAuditLog(userId, limit);
      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
  // POST /api/broker/import/request-permission
  async requestImportPermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const { reason } = req.body;
      
      const result = await brokerService.requestImportPermission(userId, reason, ip);
      res.json({ 
        message: 'בקשת הרשאת ייבוא נשלחה בהצלחה',
        data: result 
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/broker/import/properties-file/preview
  async importPropertiesPreview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const file = req.file;
      const { categoryId, adType } = req.body;
      
      if (!file) {
        res.status(400).json({ error: 'לא הועלה קובץ' });
        return;
      }
      
      const result = await brokerService.importPropertiesPreview(userId, file, categoryId, adType);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/broker/import/properties-file/commit
  async importPropertiesCommit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ip = req.ip;
      const { categoryId, adType, data } = req.body;
      
      const result = await brokerService.importPropertiesCommit(userId, categoryId, adType, data, ip);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const brokerController = new BrokerController();
