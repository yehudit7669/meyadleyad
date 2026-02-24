import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AuditService } from '../profile/audit.service';
import { pendingApprovalsService } from '../admin/pending-approvals.service';
import { PendingApprovalType } from '@prisma/client';
import {
  updateServiceProviderProfileSchema,
  createOfficeAddressChangeSchema,
  createDataExportRequestSchema,
  createAccountDeletionRequestSchema,
  createHighlightRequestSchema,
  serviceProviderContactRequestSchema,
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
          weeklyDigestSubscribed: true, // Keep for backwards compatibility
          createdAt: true,
          UserPreference: {
            select: {
              weeklyDigest: true,
              weeklyDigestBlocked: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'משתמש לא נמצא',
        });
      }

      // Ensure weeklyDigestSubscribed reflects UserPreference value if it exists
      const userWithCompat = user as any;
      if (user.UserPreference) {
        userWithCompat.weeklyDigestSubscribed = user.UserPreference.weeklyDigest && !user.UserPreference.weeklyDigestBlocked;
      }

      console.log('📋 Service Provider getProfile response:', {
        userId: user.id,
        aboutBusiness: user.aboutBusiness,
        aboutBusinessPending: user.aboutBusinessPending,
        aboutBusinessStatus: user.aboutBusinessStatus,
        officeAddress: user.officeAddress,
        officeAddressPending: user.officeAddressPending,
        officeAddressStatus: user.officeAddressStatus,
      });

      res.json({
        success: true,
        data: userWithCompat,
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
      
      // Update weeklyDigest in UserPreference instead of User.weeklyDigestSubscribed
      if (input.weeklyDigestSubscribed !== undefined) {
        await prisma.userPreference.upsert({
          where: { userId },
          update: { weeklyDigest: input.weeklyDigestSubscribed },
          create: {
            userId,
            weeklyDigest: input.weeklyDigestSubscribed,
            notifyNewMatches: false,
          },
        });
      }

      // Get current user data for comparison
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      // Pending updates (require admin approval) - create PendingApproval records
      // Only create approval if the value actually changed from both approved AND pending versions
      if (
        input.aboutBusinessPending !== undefined && 
        input.aboutBusinessPending !== currentUser?.aboutBusiness &&
        input.aboutBusinessPending !== currentUser?.aboutBusinessPending
      ) {
        console.log('📝 Creating PendingApproval for aboutBusiness:', {
          userId,
          newValue: input.aboutBusinessPending,
          currentAboutBusiness: currentUser?.aboutBusiness,
          currentAboutBusinessPending: currentUser?.aboutBusinessPending,
        });
        
        await pendingApprovalsService.createApproval({
          userId,
          type: PendingApprovalType.BUSINESS_DESCRIPTION,
          requestData: { aboutBusiness: input.aboutBusinessPending },
          oldData: { aboutBusiness: currentUser?.aboutBusiness },
          reason: 'עדכון אודות העסק',
        });
        updateData.aboutBusinessPending = input.aboutBusinessPending;
        updateData.aboutBusinessStatus = 'PENDING';
        
        console.log('✅ PendingApproval created, updating User with:', {
          aboutBusinessPending: input.aboutBusinessPending,
          aboutBusinessStatus: 'PENDING',
        });
      }

      if (
        input.logoUrlPending !== undefined &&
        input.logoUrlPending !== currentUser?.logoUrlPending
      ) {
        await pendingApprovalsService.createApproval({
          userId,
          type: PendingApprovalType.LOGO_UPLOAD,
          requestData: { logoUrl: input.logoUrlPending },
          oldData: { logoUrl: currentUser?.logoUrlPending },
          reason: 'העלאת לוגו חדש',
        });
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

      // Get current address
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { officeAddress: true },
      });

      // Create pending approval
      await pendingApprovalsService.createApproval({
        userId,
        type: PendingApprovalType.OFFICE_ADDRESS_UPDATE,
        requestData: { address: input.newAddress },
        oldData: { address: currentUser?.officeAddress },
        reason: 'עדכון כתובת משרד',
      });

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

      // Create pending approval
      await pendingApprovalsService.createApproval({
        userId,
        type: PendingApprovalType.ACCOUNT_DELETION,
        requestData: { reason: input.reason },
        oldData: {},
        reason: input.reason,
      });

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

      // Create pending approval
      await pendingApprovalsService.createApproval({
        userId,
        type: PendingApprovalType.HIGHLIGHT_AD,
        requestData: { requestType: input.requestType, reason: input.reason },
        oldData: {},
        reason: input.reason,
      });

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
          aboutBusinessPending: true,
          aboutBusinessStatus: true,
          officeAddress: true,
          officeAddressPending: true,
          officeAddressStatus: true,
          publishOfficeAddress: true,
          businessHours: true,
          phoneBusinessOffice: true,
          phone: true,
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

      // Debug log for data validation
      console.log('🔍 Service Provider Public Profile Debug:', {
        userId: user.id,
        name: user.name,
        businessName: user.businessName,
        aboutBusiness: user.aboutBusiness,
        aboutBusinessPending: user.aboutBusinessPending,
        aboutBusinessStatus: user.aboutBusinessStatus,
        officeAddress: user.officeAddress,
        officeAddressPending: user.officeAddressPending,
        officeAddressStatus: user.officeAddressStatus,
        publishOfficeAddress: user.publishOfficeAddress,
        logoUrlPending: user.logoUrlPending,
        logoStatus: user.logoStatus,
        phoneBusinessOffice: user.phoneBusinessOffice,
        phone: user.phone,
      });

      // Build public data (only approved content)
      const publicData: any = {
        id: user.id,
        name: user.businessName || user.name,
        serviceProviderType: user.serviceProviderType,
        businessHours: user.businessHours,
        // Use business phone if exists, otherwise fall back to personal phone
        businessPhone: user.phoneBusinessOffice || user.phone,
        email: user.email,
        publishOfficeAddress: user.publishOfficeAddress,
        createdAt: user.createdAt,
      };

      // Logo - use logoUrlPending if APPROVED
      if (user.logoStatus === 'APPROVED' && user.logoUrlPending) {
        publicData.logoUrl = user.logoUrlPending;
      }

      // About Business - use the approved value or the Pending if status is APPROVED or not set
      if (!user.aboutBusinessStatus || user.aboutBusinessStatus === 'APPROVED') {
        // If aboutBusiness exists, use it (was copied from pending)
        // Otherwise use aboutBusinessPending (for backward compatibility)
        publicData.aboutBusiness = user.aboutBusiness || user.aboutBusinessPending;
      }

      // Office Address - only if published AND status is APPROVED or not set
      if (user.publishOfficeAddress && (!user.officeAddressStatus || user.officeAddressStatus === 'APPROVED')) {
        // If officeAddress exists, use it (was copied from pending)
        // Otherwise use officeAddressPending (for backward compatibility)
        publicData.businessAddress = user.officeAddress || user.officeAddressPending;
      }

      console.log('✅ Service Provider Public Profile Response:', {
        hasLogoUrl: !!publicData.logoUrl,
        hasAboutBusiness: !!publicData.aboutBusiness,
        hasBusinessAddress: !!publicData.businessAddress,
        aboutBusinessValue: publicData.aboutBusiness,
        businessAddressValue: publicData.businessAddress,
        businessPhone: publicData.businessPhone,
      });

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

  // ============ Send Contact Request (Public) ============
  static async sendContactRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = req.params.id;
      const result = serviceProviderContactRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        res.status(400).json({
          status: 'error',
          message: JSON.stringify(result.error.errors),
        });
        return;
      }
      
      // Get provider email
      const provider = await prisma.user.findUnique({
        where: { id: providerId },
        select: { 
          email: true,
          name: true,
        },
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'נותן השירות לא נמצא',
        });
        return;
      }

      // Send email using unified email service
      const { unifiedEmailService } = require('../email/unified-email-template.service');
      const { EmailType } = require('../email/email-types.enum');
      
      await unifiedEmailService.sendEmail({
        to: provider.email,
        type: EmailType.BROKER_CONTACT_REQUEST, // Reusing same email type
        contactName: result.data.name,
        ownerPhone: result.data.phone,
        requesterName: result.data.email,
      });

      console.log(`✅ Contact request sent to service provider ${providerId} (${provider.email})`);
      
      res.json({ 
        success: true,
        message: 'הפניה נשלחה בהצלחה' 
      });
    } catch (error) {
      next(error);
    }
  }
}
