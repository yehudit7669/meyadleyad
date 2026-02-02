import { Request, Response } from 'express';
import { pendingApprovalsService } from './pending-approvals.service';
import { PendingApprovalType, ApprovalStatus } from '@prisma/client';

export class PendingApprovalsController {
  /**
   * קבלת כל הבקשות
   */
  async getAllApprovals(req: Request, res: Response) {
    try {
      const { status, type } = req.query;

      const filters: any = {};
      if (status) filters.status = status as ApprovalStatus;
      if (type) filters.type = type as PendingApprovalType;

      const approvals = await pendingApprovalsService.getAllPendingApprovals(filters);
      
      return res.json({
        success: true,
        data: approvals,
      });
    } catch (error: any) {
      console.error('Error fetching approvals:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch approvals',
        error: error.message,
      });
    }
  }

  /**
   * קבלת בקשה ספציפית
   */
  async getApprovalById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const approval = await pendingApprovalsService.getApprovalById(id);
      
      if (!approval) {
        return res.status(404).json({
          success: false,
          message: 'Approval not found',
        });
      }

      return res.json({
        success: true,
        data: approval,
      });
    } catch (error: any) {
      console.error('Error fetching approval:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch approval',
        error: error.message,
      });
    }
  }

  /**
   * יצירת בקשה חדשה
   */
  async createApproval(req: Request, res: Response) {
    try {
      const { type, requestData, oldData, reason } = req.body;
      const userId = (req as any).user.id;

      const approval = await pendingApprovalsService.createApproval({
        userId,
        type,
        requestData,
        oldData,
        reason,
      });

      return res.status(201).json({
        success: true,
        message: 'Approval request created successfully',
        data: approval,
      });
    } catch (error: any) {
      console.error('Error creating approval:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create approval request',
        error: error.message,
      });
    }
  }

  /**
   * אישור בקשה
   */
  async approveApproval(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const adminId = (req as any).user.id;

      const approval = await pendingApprovalsService.approveApproval(id, adminId, adminNotes);

      return res.json({
        success: true,
        message: 'Approval approved successfully',
        data: approval,
      });
    } catch (error: any) {
      console.error('Error approving approval:', error);
      
      if (error.message === 'Approval not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      
      if (error.message === 'Approval already processed') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to approve approval',
        error: error.message,
      });
    }
  }

  /**
   * דחיית בקשה
   */
  async rejectApproval(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const adminId = (req as any).user.id;

      const approval = await pendingApprovalsService.rejectApproval(id, adminId, adminNotes);

      return res.json({
        success: true,
        message: 'Approval rejected successfully',
        data: approval,
      });
    } catch (error: any) {
      console.error('Error rejecting approval:', error);
      
      if (error.message === 'Approval not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      
      if (error.message === 'Approval already processed') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to reject approval',
        error: error.message,
      });
    }
  }

  /**
   * קבלת בקשות של משתמש מחובר
   */
  async getMyApprovals(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      
      const approvals = await pendingApprovalsService.getUserApprovals(userId);

      return res.json({
        success: true,
        data: approvals,
      });
    } catch (error: any) {
      console.error('Error fetching user approvals:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user approvals',
        error: error.message,
      });
    }
  }

  /**
   * קבלת סטטיסטיקות
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await pendingApprovalsService.getApprovalStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching approval stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch stats',
        error: error.message,
      });
    }
  }

  /**
   * קבלת מספר בקשות ממתינות
   */
  async getPendingCount(req: Request, res: Response) {
    try {
      const count = await pendingApprovalsService.getPendingCount();

      return res.json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      console.error('Error fetching pending count:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch pending count',
        error: error.message,
      });
    }
  }
}

export const pendingApprovalsController = new PendingApprovalsController();
