import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AuditService } from '../profile/audit.service';
import {
  updateServiceProviderProfileSchema,
  createOfficeAddressChangeSchema,
  createDataExportRequestSchema,
  createAccountDeletionRequestSchema,
  createHighlightRequestSchema,
} from './service-provider.schemas';
import { nanoid } from 'nanoid';

export class ServiceProviderController {
  // ============ Get Service Provider Profile ============
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          userType: true,
          serviceProviderType: true,
          firstName: true,
          lastName: true,
          phonePersonal: true,
          phoneBusinessOffice: true,
          businessName: true,
          businessPhone: true,
          officeAddress: true,
          officeAddressPending: true,
          officeAddressStatus: true,
          logoUrlPending: true,
          logoStatus: true,
          aboutBusiness: true,
          aboutBusinessPending: true,
          aboutBusinessStatus: true,
          publishOfficeAddress: true,
          businessHours: true,
          weeklyDigestSubscribed: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'משתמש לא נמצא',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Update Service Provider Profile ============
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const input = updateServiceProviderProfileSchema.parse(req.body);

      const updateData: any = {};

      // Direct updates (no approval needed)
      if (input.name !== undefined) updateData.name = input.name;
      if (input.phonePersonal !== undefined) updateData.phonePersonal = input.phonePersonal;
      if (input.phoneBusinessOffice !== undefined) updateData.phoneBusinessOffice = input.phoneBusinessOffice;
      if (input.publishOfficeAddress !== undefined) updateData.publishOfficeAddress = input.publishOfficeAddress;
      if (input.businessHours !== undefined) updateData.businessHours = input.businessHours;
      if (input.weeklyDigestSubscribed !== undefined) updateData.weeklyDigestSubscribed = input.weeklyDigestSubscribed;

      // Pending updates (require admin approval)
      if (input.aboutBusinessPending !== undefined) {
        updateData.aboutBusinessPending = input.aboutBusinessPending;
        updateData.aboutBusinessStatus = 'PENDING';
      }

      if (input.logoUrlPending !== undefined) {
        updateData.logoUrlPending = input.logoUrlPending;
        updateData.logoStatus = 'PENDING';
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      await AuditService.log(userId, 'UPDATE_SP_PROFILE', { changes: updateData });

      res.json({
        success: true,
        data: user,
        message: 'הפרופיל עודכן בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Request Office Address Change ============
  static async requestOfficeAddressChange(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const input = createOfficeAddressChangeSchema.parse(req.body);

      const request = await prisma.officeAddressChangeRequest.create({
        data: {
          id: nanoid(),
          userId,
          newAddress: input.newAddress,
          status: 'PENDING',
        },
      });

      // Update user's pending status
      await prisma.user.update({
        where: { id: userId },
        data: {
          officeAddressPending: input.newAddress,
          officeAddressStatus: 'PENDING',
        },
      });

      await AuditService.log(userId, 'REQUEST_OFFICE_CHANGE', { newAddress: input.newAddress });

      res.json({
        success: true,
        data: request,
        message: 'בקשת שינוי כתובת נשלחה ומחכה לאישור מנהל',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Request Data Export ============
  static async requestDataExport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const request = await prisma.dataExportRequest.create({
        data: {
          id: nanoid(),
          userId,
          status: 'PENDING',
        },
      });

      await AuditService.log(userId, 'REQUEST_DATA_EXPORT', {});

      res.json({
        success: true,
        data: request,
        message: 'בקשת ייצוא נתונים נשלחה בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Request Account Deletion ============
  static async requestAccountDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const input = createAccountDeletionRequestSchema.parse(req.body);

      const request = await prisma.accountDeletionRequest.create({
        data: {
          id: nanoid(),
          userId,
          reason: input.reason,
          status: 'PENDING',
        },
      });

      await AuditService.log(userId, 'REQUEST_ACCOUNT_DELETE', { reason: input.reason });

      res.json({
        success: true,
        data: request,
        message: 'בקשת מחיקת חשבון נשלחה ומחכה לאישור מנהל',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Request Highlight ============
  static async requestHighlight(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const input = createHighlightRequestSchema.parse(req.body);

      const request = await prisma.highlightRequest.create({
        data: {
          id: nanoid(),
          userId,
          requestType: input.requestType,
          reason: input.reason,
          status: 'PENDING',
        },
      });

      await AuditService.log(userId, 'REQUEST_HIGHLIGHT', { 
        requestType: input.requestType,
        reason: input.reason,
      });

      res.json({
        success: true,
        data: request,
        message: 'בקשת הדגשה נשלחה בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Get Public Profile (for business card) ============
  static async getPublicProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          businessName: true,
          serviceProviderType: true,
          logoUrlPending: true,
          logoStatus: true,
          aboutBusiness: true,
          aboutBusinessStatus: true,
          officeAddress: true,
          publishOfficeAddress: true,
          businessHours: true,
          phoneBusinessOffice: true,
          email: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'נותן שירות לא נמצא',
        });
      }

      // Build public data (only approved content)
      const publicData: any = {
        id: user.id,
        name: user.businessName || user.name,
        serviceProviderType: user.serviceProviderType,
        businessHours: user.businessHours,
        phoneBusinessOffice: user.phoneBusinessOffice,
        email: user.email,
        createdAt: user.createdAt,
      };

      // Only show logo if approved
      if (user.logoStatus === 'APPROVED' && user.logoUrlPending) {
        publicData.logoUrl = user.logoUrlPending;
      }

      // Only show about if approved
      if (user.aboutBusinessStatus === 'APPROVED' && user.aboutBusiness) {
        publicData.aboutBusiness = user.aboutBusiness;
      }

      // Only show office address if published and exists
      if (user.publishOfficeAddress && user.officeAddress) {
        publicData.officeAddress = user.officeAddress;
      }

      res.json({
        success: true,
        data: publicData,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Get Audit Log ============
  static async getAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
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
}
