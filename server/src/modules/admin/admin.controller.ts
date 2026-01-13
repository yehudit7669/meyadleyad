import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { AdStatus } from '@prisma/client';

const adminService = new AdminService();

export class AdminController {
  async getPendingAds(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const filters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        cityId: req.query.cityId as string,
        cityName: req.query.cityName as string,
        publisher: req.query.publisher as string,
      };

      const result = await adminService.getPendingAds(page, limit, filters);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdById(req: Request, res: Response, next: NextFunction) {
    try {
      const ad = await adminService.getAdById(req.params.id);
      res.json({
        status: 'success',
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveAd(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user.id;
      const ad = await adminService.approveAd(req.params.id, adminId);
      res.json({
        status: 'success',
        data: ad,
        message: 'המודעה אושרה בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectAd(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const adminId = (req as any).user.id;
      
      if (!reason || reason.trim().length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'נא להזין סיבת דחייה',
        });
        return;
      }

      if (reason.length > 250) {
        res.status(400).json({
          status: 'error',
          message: 'סיבת הדחייה חייבת להיות עד 250 תווים',
        });
        return;
      }

      const ad = await adminService.rejectAd(req.params.id, reason, adminId);
      res.json({
        status: 'success',
        data: ad,
        message: 'המודעה נדחתה',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllAds(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const filters = {
        status: req.query.status as AdStatus,
        search: req.query.search as string,
      };

      const result = await adminService.getAllAds(page, limit, filters);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAdStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const adminId = (req as any).user.id;

      // וולידציה של סטטוס
      const validStatuses: AdStatus[] = ['DRAFT', 'PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'EXPIRED', 'REMOVED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          status: 'error',
          message: 'סטטוס לא חוקי',
        });
        return;
      }

      const ad = await adminService.updateAdStatus(req.params.id, status, adminId);
      res.json({
        status: 'success',
        data: ad,
        message: 'הסטטוס עודכן בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUserAds(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteUserAds(req.params.userId);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getStatistics();
      res.json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const result = await adminService.getUsers(page, limit);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await adminService.updateUser(id, req.body);
      res.json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.deleteUser(id);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
