import { Response, NextFunction } from 'express';
import { UsersAdminService } from './users-admin.service';
import {
  getUsersQuerySchema,
  createUserSchema,
  updateUserSchema,
  meetingsBlockSchema,
  bulkRemoveAdsSchema,
} from './users-admin.validation';
import { AuthRequest } from '../../../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const usersService = new UsersAdminService();

export class UsersAdminController {
  /**
   * POST /api/admin/users
   * Create new user (Super Admin only)
   */
  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const adminId = req.user!.id;
      const ip = req.ip;

      const result = await usersService.createUser(data, adminId, ip);
      
      res.status(201).json({
        status: 'success',
        data: result,
        message: 'המשתמש נוצר בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users
   * Get users list with search, filters, and pagination
   */
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = getUsersQuerySchema.parse(req.query);
      const requestorRole = req.user!.role;

      const result = await usersService.getUsers(query, requestorRole);
      
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users/:id
   * Get user profile
   */
  async getUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id;
      const requestorRole = req.user!.role;
      const result = await usersService.getUserProfile(userId, requestorRole);
      
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id
   * Update user details
   */
  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id;
      const data = updateUserSchema.parse(req.body);
      const adminId = req.user!.id;
      const adminRole = req.user!.role;
      const ip = req.ip;

      const result = await usersService.updateUser(userId, data, adminId, adminRole, ip);
      
      res.json({
        status: 'success',
        data: result,
        message: 'פרטי המשתמש עודכנו בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/users/:id/meetings-block
   * Block/unblock meetings for user
   */
  async setMeetingsBlock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id;
      const data = meetingsBlockSchema.parse(req.body);
      const adminId = req.user!.id;
      const adminRole = req.user!.role;
      const ip = req.ip;

      const result = await usersService.setMeetingsBlock(userId, data, adminId, adminRole, ip);
      
      res.json({
        status: 'success',
        data: result,
        message: data.blocked 
          ? 'תיאום פגישות נחסם למשתמש' 
          : 'חסימת תיאום פגישות בוטלה',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/users/:id
   * Hard delete user (Super Admin only)
   */
  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id;
      const adminId = req.user!.id;
      const ip = req.ip;

      const result = await usersService.deleteUser(userId, adminId, ip);
      
      res.json({
        status: 'success',
        data: result,
        message: 'המשתמש נמחק לצמיתות',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/users/:id/ads/bulk-remove
   * Bulk remove all ads of a user (Super Admin only)
   */
  async bulkRemoveUserAds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id;
      const data = bulkRemoveAdsSchema.parse(req.body);
      const adminId = req.user!.id;
      const ip = req.ip;

      const result = await usersService.bulkRemoveUserAds(userId, data, adminId, ip);
      
      res.json({
        status: 'success',
        data: result,
        message: `הוסרו ${result.removedCount} מודעות בהצלחה`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/users/export
   * Export users list with AuditLog
   */
  async exportUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = getUsersQuerySchema.parse(req.query);
      const requestorRole = req.user!.role;
      const adminId = req.user!.id;
      const ip = req.ip;

      const buffer = await usersService.exportUsers(query, requestorRole);
      
      // Log export action
      const AdminAuditService = (await import('../admin-audit.service')).AdminAuditService;
      await AdminAuditService.log({
        adminId,
        action: 'ADMIN_EXPORT_USERS',
        entityType: 'USER',
        meta: {
          filters: query,
        },
        ip,
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `users-export-${timestamp}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
