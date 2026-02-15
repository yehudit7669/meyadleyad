/**
 * WhatsApp Groups Controller
 * ניהול קבוצות WhatsApp, הצעות קבוצות חדשות, ועדכון מכסות
 */

import { Request, Response } from 'express';
import { WhatsAppAuthRequest, canChangeQuota, canApproveGroups } from './whatsapp-rbac.middleware';
import { auditService } from './distribution/audit.service';
import prisma from '../../config/database';
import { WhatsAppGroupStatus, WhatsAppSuggestionStatus } from '@prisma/client';

export class WhatsAppGroupsController {
  /**
   * קבלת כל הקבוצות
   * GET /api/admin/whatsapp/groups
   */
  async getGroups(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { status, search } = req.query;

      const where: any = {};

      if (status) {
        where.status = status as WhatsAppGroupStatus;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { internalCode: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const groups = await prisma.whatsAppGroup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              DistributionItem: true,
            },
          },
        },
      });

      // Enrich with category/city names
      const enrichedGroups = await Promise.all(
        groups.map(async (group) => {
          let Category = null;
          let City = null;

          // Get category if exists
          if (group.categoryScopes && Array.isArray(group.categoryScopes) && (group.categoryScopes as string[]).length > 0) {
            const categoryId = (group.categoryScopes as string[])[0];
            if (categoryId) {
              Category = await prisma.category.findUnique({
                where: { id: categoryId },
                select: { id: true, nameHe: true },
              });
            }
          }

          // Get city if exists
          if (group.cityScopes && Array.isArray(group.cityScopes) && (group.cityScopes as string[]).length > 0) {
            const cityId = (group.cityScopes as string[])[0];
            if (cityId) {
              City = await prisma.city.findUnique({
                where: { id: cityId },
                select: { id: true, nameHe: true },
              });
            }
          }

          return {
            ...group,
            Category,
            City,
          };
        })
      );

      res.status(200).json({
        status: 'success',
        data: { groups: enrichedGroups },
      });
    } catch (error) {
      console.error('❌ Error in getGroups:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בטעינת קבוצות',
      });
    }
  }

  /**
   * קבלת קבוצה לפי ID
   * GET /api/admin/whatsapp/groups/:id
   */
  async getGroupById(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const group = await prisma.whatsAppGroup.findUnique({
        where: { id },
      });

      if (!group) {
        return res.status(404).json({
          status: 'error',
          message: 'קבוצה לא נמצאה',
        });
      }

      res.status(200).json({
        status: 'success',
        data: group,
      });
    } catch (error) {
      console.error('❌ Error in getGroupById:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בטעינת קבוצה',
      });
    }
  }

  /**
   * יצירת קבוצה חדשה (מנהל ראשי בלבד)
   * POST /api/admin/whatsapp/groups
   */
  async createGroup(req: WhatsAppAuthRequest, res: Response) {
    try {
      console.log('🔵 createGroup called - request body:', req.body);
      
      const {
        name,
        inviteLink,
        categoryScopes,
        cityScopes,
        dailyQuota,
        status,
      } = req.body;

      const userId = req.user!.id;
      console.log('🔵 createGroup - userId:', userId);

      // Validate
      if (!name) {
        console.log('❌ createGroup - name is missing');
        return res.status(400).json({
          status: 'error',
          message: 'שם הקבוצה הוא שדה חובה',
        });
      }

      // Generate internal code from name
      const internalCode = name
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase() + '-' + Date.now();

      console.log('🔵 createGroup - internalCode:', internalCode);

      // Prepare city/category scopes - ensure arrays
      const finalCityScopes = Array.isArray(cityScopes) ? cityScopes : [];
      const finalCategoryScopes = Array.isArray(categoryScopes) ? categoryScopes : [];

      console.log('🔵 createGroup - cityScopes:', finalCityScopes);
      console.log('🔵 createGroup - categoryScopes:', finalCategoryScopes);

      // Create
      console.log('🔵 createGroup - about to create group with data:', {
        name: name.trim(),
        internalCode,
        status: status || 'ACTIVE',
        cityScopes: finalCityScopes,
        categoryScopes: finalCategoryScopes,
        dailyQuota: dailyQuota || 10,
        inviteLink: inviteLink && inviteLink.trim() ? inviteLink.trim() : null,
        createdById: userId,
      });

      const group = await prisma.whatsAppGroup.create({
        data: {
          name: name.trim(),
          internalCode,
          status: status || WhatsAppGroupStatus.ACTIVE,
          cityScopes: finalCityScopes,
          regionScopes: [],
          categoryScopes: finalCategoryScopes,
          dailyQuota: dailyQuota || 10,
          allowDigest: true,
          inviteLink: inviteLink && inviteLink.trim() ? inviteLink.trim() : null,
          createdById: userId,
        },
      });

      console.log('✅ createGroup - group created:', group.id);

      // Auto-assign pending distribution items without groups
      await this.autoAssignPendingItems(group.id);

      // Audit
      await auditService.log({
        action: 'create_group',
        actorUserId: userId,
        entityType: 'group',
        entityId: group.id,
        payload: { name, internalCode },
      });

      res.status(201).json({
        status: 'success',
        message: 'קבוצה נוצרה בהצלחה',
        data: group,
      });
    } catch (error) {
      console.error('❌ Error in createGroup:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה ביצירת קבוצה',
      });
    }
  }

  /**
   * עדכון קבוצה (מנהל ראשי בלבד)
   * PATCH /api/admin/whatsapp/groups/:id
   */
  async updateGroup(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const {
        name,
        inviteLink,
        categoryScopes,
        cityScopes,
        dailyQuota,
        status,
      } = req.body;

      // Check if user can change quota
      if (dailyQuota !== undefined && !canChangeQuota(req)) {
        return res.status(403).json({
          status: 'error',
          message: 'אין לך הרשאה לשנות מכסות',
        });
      }

      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (inviteLink !== undefined) {
        updateData.inviteLink = inviteLink && inviteLink.trim() ? inviteLink.trim() : null;
      }
      if (dailyQuota !== undefined) updateData.dailyQuota = dailyQuota;
      if (status !== undefined) updateData.status = status;

      // Handle city/category scopes - now expecting arrays
      if (cityScopes !== undefined) {
        updateData.cityScopes = Array.isArray(cityScopes) ? cityScopes : [];
      }
      if (categoryScopes !== undefined) {
        updateData.categoryScopes = Array.isArray(categoryScopes) ? categoryScopes : [];
      }

      const group = await prisma.whatsAppGroup.update({
        where: { id },
        data: updateData,
      });

      // Audit
      await auditService.log({
        action: 'update_group',
        actorUserId: userId,
        entityType: 'group',
        entityId: id,
        payload: updateData,
      });

      res.status(200).json({
        status: 'success',
        message: 'קבוצה עודכנה בהצלחה',
        data: group,
      });
    } catch (error) {
      console.error('❌ Error in updateGroup:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה בעדכון קבוצה',
      });
    }
  }

  /**
   * מחיקת קבוצה
   * DELETE /api/admin/whatsapp/groups/:id
   */
  async deleteGroup(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Delete the group
      await prisma.whatsAppGroup.delete({
        where: { id },
      });

      // Audit
      await auditService.log({
        action: 'delete_group',
        actorUserId: userId,
        entityType: 'group',
        entityId: id,
        payload: { groupId: id },
      });

      res.status(200).json({
        status: 'success',
        message: 'קבוצה נמחקה בהצלחה',
      });
    } catch (error) {
      console.error('❌ Error in deleteGroup:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה במחיקת קבוצה',
      });
    }
  }

  /**
   * Auto-assign pending items without groups to a newly created group
   */
  private async autoAssignPendingItems(groupId: string) {
    try {
      const { routingEngine } = await import('./distribution/routing-engine.service.js');
      
      // Get the group details
      const group = await prisma.whatsAppGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) return;

      // Find all pending items without a group
      const pendingItems = await prisma.distributionItem.findMany({
        where: {
          groupId: null,
          status: 'PENDING',
        },
        include: {
          Ad: {
            include: {
              Category: true,
              City: true,
            },
          },
        },
      });

      let assignedCount = 0;

      for (const item of pendingItems) {
        // Check if this ad matches the new group
        const matches = await routingEngine.findMatchingGroups(item.adId);
        const matchingGroup = matches.find(m => m.groupId === groupId);

        if (matchingGroup) {
          // Update the item with the new group
          await prisma.distributionItem.update({
            where: { id: item.id },
            data: {
              groupId: groupId,
              dedupeKey: `${item.adId}-${groupId}`,
              priority: matchingGroup.priority,
            },
          });
          assignedCount++;
        }
      }

      if (assignedCount > 0) {
        console.log(`✅ Auto-assigned ${assignedCount} pending items to group ${group.name}`);
      }
    } catch (error) {
      console.error('❌ Error in autoAssignPendingItems:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * שינוי סטטוס קבוצה
   * PATCH /api/admin/whatsapp/groups/:id/status
   */
  async changeStatus(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;

      if (!Object.values(WhatsAppGroupStatus).includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'סטטוס לא חוקי',
        });
      }

      const group = await prisma.whatsAppGroup.update({
        where: { id },
        data: { status },
      });

      // Audit
      const action = status === WhatsAppGroupStatus.ACTIVE ? 'activate_group' : 'pause_group';
      await auditService.log({
        action,
        actorUserId: userId,
        entityType: 'group',
        entityId: id,
        payload: { status },
      });

      res.status(200).json({
        status: 'success',
        message: 'סטטוס עודכן בהצלחה',
        data: group,
      });
    } catch (error) {
      console.error('❌ Error in changeStatus:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בשינוי סטטוס',
      });
    }
  }

  /**
   * הצעת קבוצה חדשה (מנהל תוכן)
   * POST /api/admin/whatsapp/groups/suggest
   */
  async suggestGroup(req: WhatsAppAuthRequest, res: Response) {
    try {
      const {
        name,
        internalCode,
        cityScopes,
        regionScopes,
        categoryScopes,
        dailyQuota,
        allowDigest,
      } = req.body;

      const userId = req.user!.id;

      if (!name || !internalCode) {
        return res.status(400).json({
          status: 'error',
          message: 'שם וקוד פנימי הם שדות חובה',
        });
      }

      const suggestion = await prisma.whatsAppGroupSuggestion.create({
        data: {
          name,
          internalCode,
          cityScopes: cityScopes || [],
          regionScopes: regionScopes || [],
          categoryScopes: categoryScopes || [],
          dailyQuota: dailyQuota || 10,
          allowDigest: allowDigest !== undefined ? allowDigest : true,
          status: WhatsAppSuggestionStatus.PENDING,
          suggestedBy: userId,
        },
      });

      // Audit
      await auditService.log({
        action: 'suggest_group',
        actorUserId: userId,
        entityType: 'suggestion',
        entityId: suggestion.id,
        payload: { name, internalCode },
      });

      res.status(201).json({
        status: 'success',
        message: 'הצעה נשלחה לאישור',
        data: suggestion,
      });
    } catch (error) {
      console.error('❌ Error in suggestGroup:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה ביצירת הצעה',
      });
    }
  }

  /**
   * אישור הצעת קבוצה (מנהל ראשי בלבד)
   * POST /api/admin/whatsapp/groups/suggestions/:id/approve
   */
  async approveSuggestion(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const userId = req.user!.id;

      const suggestion = await prisma.whatsAppGroupSuggestion.findUnique({
        where: { id },
      });

      if (!suggestion) {
        return res.status(404).json({
          status: 'error',
          message: 'הצעה לא נמצאה',
        });
      }

      if (suggestion.status !== WhatsAppSuggestionStatus.PENDING) {
        return res.status(400).json({
          status: 'error',
          message: 'הצעה זו כבר טופלה',
        });
      }

      // Create group
      const group = await prisma.whatsAppGroup.create({
        data: {
          name: suggestion.name,
          internalCode: suggestion.internalCode,
          status: WhatsAppGroupStatus.ACTIVE,
          cityScopes: suggestion.cityScopes as any,
          regionScopes: suggestion.regionScopes as any,
          categoryScopes: suggestion.categoryScopes as any,
          dailyQuota: suggestion.dailyQuota,
          allowDigest: suggestion.allowDigest,
          createdById: userId,
        },
      });

      // Update suggestion
      await prisma.whatsAppGroupSuggestion.update({
        where: { id },
        data: {
          status: WhatsAppSuggestionStatus.APPROVED,
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes,
          approvedGroupId: group.id,
        },
      });

      // Audit
      await auditService.log({
        action: 'approve_suggestion',
        actorUserId: userId,
        entityType: 'suggestion',
        entityId: id,
        payload: { groupId: group.id, reviewNotes },
      });

      res.status(200).json({
        status: 'success',
        message: 'הצעה אושרה והקבוצה נוצרה',
        data: { suggestion: { ...suggestion, approvedGroupId: group.id }, group },
      });
    } catch (error) {
      console.error('❌ Error in approveSuggestion:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'שגיאה באישור הצעה',
      });
    }
  }

  /**
   * דחיית הצעה
   * POST /api/admin/whatsapp/groups/suggestions/:id/reject
   */
  async rejectSuggestion(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const userId = req.user!.id;

      await prisma.whatsAppGroupSuggestion.update({
        where: { id },
        data: {
          status: WhatsAppSuggestionStatus.REJECTED,
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes,
        },
      });

      // Audit
      await auditService.log({
        action: 'reject_suggestion',
        actorUserId: userId,
        entityType: 'suggestion',
        entityId: id,
        payload: { reviewNotes },
      });

      res.status(200).json({
        status: 'success',
        message: 'הצעה נדחתה',
      });
    } catch (error) {
      console.error('❌ Error in rejectSuggestion:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בדחיית הצעה',
      });
    }
  }

  /**
   * קבלת כל ההצעות
   * GET /api/admin/whatsapp/groups/suggestions
   */
  async getSuggestions(req: WhatsAppAuthRequest, res: Response) {
    try {
      const { status } = req.query;

      const where: any = {};
      if (status) {
        where.status = status as WhatsAppSuggestionStatus;
      }

      const suggestions = await prisma.whatsAppGroupSuggestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        data: suggestions,
      });
    } catch (error) {
      console.error('❌ Error in getSuggestions:', error);
      res.status(500).json({
        status: 'error',
        message: 'שגיאה בטעינת הצעות',
      });
    }
  }
}

// Export singleton
export const whatsappGroupsController = new WhatsAppGroupsController();
