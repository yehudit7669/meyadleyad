import { PrismaClient, PendingApprovalType, ApprovalStatus } from '@prisma/client';
import { AdminAuditService } from './admin-audit.service';
import { AuditService } from '../profile/audit.service';

const prisma = new PrismaClient();

export class PendingApprovalsService {
  /**
   * קבלת כל הבקשות שממתינות לאישור
   */
  async getAllPendingApprovals(filters?: {
    status?: ApprovalStatus;
    type?: PendingApprovalType;
  }) {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }

    const approvals = await prisma.pendingApproval.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            userType: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return approvals;
  }

  /**
   * קבלת בקשה בודדת לפי ID
   */
  async getApprovalById(id: string) {
    const approval = await prisma.pendingApproval.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            userType: true,
            serviceProviderType: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return approval;
  }

  /**
   * יצירת בקשה חדשה
   */
  async createApproval(data: {
    userId: string;
    type: PendingApprovalType;
    requestData: any;
    oldData?: any;
    reason?: string;
  }) {
    console.log('📝 Creating PendingApproval:', {
      userId: data.userId,
      type: data.type,
      requestData: data.requestData,
      oldData: data.oldData,
      reason: data.reason,
    });
    
    // מחיקת בקשות קודמות מאותו סוג (גם REJECTED וגם APPROVED)
    // כך שההודעות הישנות לא יוצגו יותר כשיש בקשה חדשה
    await prisma.pendingApproval.deleteMany({
      where: {
        userId: data.userId,
        type: data.type,
        status: {
          in: [ApprovalStatus.REJECTED, ApprovalStatus.APPROVED],
        },
      },
    });

    const approval = await prisma.pendingApproval.create({
      data: {
        userId: data.userId,
        type: data.type,
        requestData: data.requestData,
        oldData: data.oldData || null,
        reason: data.reason,
        status: ApprovalStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log('✅ PendingApproval created:', {
      id: approval.id,
      type: approval.type,
      status: approval.status,
      requestData: approval.requestData,
    });

    return approval;
  }

  /**
   * אישור בקשה
   */
  async approveApproval(approvalId: string, adminId: string, adminNotes?: string) {
    const approval = await prisma.pendingApproval.findUnique({
      where: { id: approvalId },
      include: {
        user: true,
      },
    });

    if (!approval) {
      throw new Error('Approval not found');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error('Approval already processed');
    }

    console.log('✅ Admin approving PendingApproval:', {
      approvalId,
      type: approval.type,
      userId: approval.userId,
      requestData: approval.requestData,
      adminId,
    });

    // עדכון הסטטוס של הבקשה
    const updatedApproval = await prisma.pendingApproval.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        adminNotes,
      },
      include: {
        user: true,
        reviewer: true,
      },
    });

    // החלת השינויים על המשתמש בהתאם לסוג הבקשה
    await this.applyApprovalChanges(updatedApproval);

    // רישום בלוג פעולות - גם של המנהל וגם של המשתמש
    await AdminAuditService.log({
      adminId,
      action: 'APPROVE_PENDING_REQUEST',
      targetId: approvalId,
      entityType: 'PendingApproval',
      meta: {
        userId: approval.userId,
        type: approval.type,
        adminNotes,
      },
    });

    // רישום גם בלוג הפעולות של המשתמש עצמו
    await AuditService.log(
      approval.userId,
      'REQUEST_APPROVED',
      {
        approvalId,
        type: approval.type,
        approvedBy: adminId,
        adminNotes,
      }
    );

    return updatedApproval;
  }

  /**
   * דחיית בקשה
   */
  async rejectApproval(approvalId: string, adminId: string, adminNotes?: string) {
    const approval = await prisma.pendingApproval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new Error('Approval not found');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error('Approval already processed');
    }

    const updatedApproval = await prisma.pendingApproval.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.REJECTED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        adminNotes,
      },
      include: {
        user: true,
        reviewer: true,
      },
    });

    // רישום בלוג פעולות - גם של המנהל וגם של המשתמש
    await AdminAuditService.log({
      adminId,
      action: 'REJECT_PENDING_REQUEST',
      targetId: approvalId,
      entityType: 'PendingApproval',
      meta: {
        userId: approval.userId,
        type: approval.type,
        adminNotes,
      },
    });

    // רישום גם בלוג הפעולות של המשתמש עצמו
    await AuditService.log(
      approval.userId,
      'REQUEST_REJECTED',
      {
        approvalId,
        type: approval.type,
        rejectedBy: adminId,
        adminNotes,
      }
    );

    return updatedApproval;
  }

  /**
   * החלת השינויים על המשתמש לאחר אישור
   */
  private async applyApprovalChanges(approval: any) {
    const { type, requestData, userId } = approval;

    switch (type) {
      case PendingApprovalType.OFFICE_ADDRESS_UPDATE:
        // עדכון כתובת משרד - יכול להיות ב-BrokerOffice או ב-User (service provider)
        const brokerOffice = await prisma.brokerOffice.findUnique({
          where: { brokerOwnerUserId: userId },
        });
        
        console.log('🏢 Admin APPROVED: Office Address Update:', {
          userId,
          hasBrokerOffice: !!brokerOffice,
          requestData: requestData,
          willUpdateAddress: requestData.address || requestData.officeAddress,
        });
        
        if (brokerOffice) {
          // מתווך - עדכון ב-BrokerOffice
          await prisma.brokerOffice.update({
            where: { id: brokerOffice.id },
            data: {
              businessAddressApproved: requestData.address || requestData.officeAddress,
              businessAddressPending: null,
            },
          });
          console.log('✅ BrokerOffice updated (Broker)');
        } else {
          // נותן שירות - עדכון ב-User
          const updatedUserAddress = await prisma.user.update({
            where: { id: userId },
            data: {
              officeAddress: requestData.address || requestData.officeAddress,
              officeAddressStatus: ApprovalStatus.APPROVED,
              officeAddressPending: null,
            },
          });
          console.log('✅ User updated (Service Provider):', {
            userId: updatedUserAddress.id,
            officeAddress: updatedUserAddress.officeAddress,
            officeAddressStatus: updatedUserAddress.officeAddressStatus,
            officeAddressPending: updatedUserAddress.officeAddressPending,
          });
        }
        break;

      case PendingApprovalType.ABOUT_UPDATE:
        // עדכון אודות העסק - רק למתווכים
        const office = await prisma.brokerOffice.findUnique({
          where: { brokerOwnerUserId: userId },
        });
        
        if (office) {
          await prisma.brokerOffice.update({
            where: { id: office.id },
            data: {
              aboutBusinessApproved: requestData.aboutBusiness,
              aboutBusinessPending: null,
            },
          });
        }
        break;

      case PendingApprovalType.LOGO_UPLOAD:
        // עדכון לוגו - יכול להיות ב-BrokerOffice או ב-User (service provider)
        const officeForLogo = await prisma.brokerOffice.findUnique({
          where: { brokerOwnerUserId: userId },
        });
        
        if (officeForLogo) {
          // מתווך - עדכון ב-BrokerOffice
          await prisma.brokerOffice.update({
            where: { id: officeForLogo.id },
            data: {
              logoUrlApproved: requestData.logoUrl,
              logoUrlPending: null,
            },
          });
        } else {
          // נותן שירות - עדכון ב-User
          await prisma.user.update({
            where: { id: userId },
            data: {
              avatar: requestData.logoUrl,
              logoUrlPending: requestData.logoUrl,
              logoStatus: ApprovalStatus.APPROVED,
            },
          });
        }
        break;

      case PendingApprovalType.BUSINESS_DESCRIPTION:
        // תיאור העסק - רק לנותני שירות
        console.log('✅ Admin APPROVED: Copying aboutBusiness for Service Provider:', {
          userId,
          fromRequestData: requestData.aboutBusiness,
          willSaveToAboutBusiness: true,
          willClearAboutBusinessPending: true,
        });
        
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            aboutBusiness: requestData.aboutBusiness,
            aboutBusinessStatus: ApprovalStatus.APPROVED,
            aboutBusinessPending: null,
          },
        });
        
        console.log('✅ User updated successfully:', {
          userId: updatedUser.id,
          aboutBusiness: updatedUser.aboutBusiness,
          aboutBusinessStatus: updatedUser.aboutBusinessStatus,
          aboutBusinessPending: updatedUser.aboutBusinessPending,
        });
        break;

      case PendingApprovalType.IMPORT_PERMISSION:
        // כאן ניתן להוסיף שדה נוסף במודל User שמציין אישור להעלאת קבצים
        // לצורך הדוגמה, נשמור בשדה customFields
        await prisma.user.update({
          where: { id: userId },
          data: {
            // אפשר להוסיף שדה ייעודי או להשתמש ב-JSON
          },
        });
        break;

      case PendingApprovalType.IMPORT_PROPERTIES_PERMISSION:
        // אישור הרשאה לייבוא נכסים למתווך
        // הבקשה עצמה מספיקה - סטטוס APPROVED מאפשר גישה
        // אין צורך לעדכן שדות נוספים כי נבדוק את הבקשה המאושרת בזמן ייבוא
        break;

      case PendingApprovalType.ACCOUNT_DELETION:
        // במקרה של אישור הסרת חשבון, נמחק את המשתמש
        await prisma.user.update({
          where: { id: userId },
          data: {
            status: 'DELETED' as any,
          },
        });
        break;

      case PendingApprovalType.HIGHLIGHT_AD:
        // כאן ניתן להוסיף לוגיקה להבלטת מודעה
        if (requestData.adId) {
          // לדוגמה: עדכון שדה isHighlighted במודעה
          // await prisma.ad.update({...})
        }
        break;

      default:
        break;
    }
  }

  /**
   * קבלת בקשות של משתמש ספציפי
   */
  async getUserApprovals(userId: string) {
    const approvals = await prisma.pendingApproval.findMany({
      where: { userId },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return approvals;
  }

  /**
   * ספירת בקשות ממתינות
   */
  async getPendingCount() {
    const count = await prisma.pendingApproval.count({
      where: {
        status: ApprovalStatus.PENDING,
      },
    });

    return count;
  }

  /**
   * סטטיסטיקות בקשות
   */
  async getApprovalStats() {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.pendingApproval.count({ where: { status: ApprovalStatus.PENDING } }),
      prisma.pendingApproval.count({ where: { status: ApprovalStatus.APPROVED } }),
      prisma.pendingApproval.count({ where: { status: ApprovalStatus.REJECTED } }),
      prisma.pendingApproval.count(),
    ]);

    return {
      pending,
      approved,
      rejected,
      total,
    };
  }
}

export const pendingApprovalsService = new PendingApprovalsService();
