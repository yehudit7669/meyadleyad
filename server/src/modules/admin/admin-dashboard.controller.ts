import { Request, Response, NextFunction } from 'express';
import { AdminDashboardService } from './admin-dashboard.service';

const dashboardService = new AdminDashboardService();

export class AdminDashboardController {
  /**
   * GET /api/admin/dashboard/summary
   * מחזיר סטטיסטיקות כוללות למערכת
   */
  async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getSummary();
      res.json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/dashboard/actions
   * מחזיר נקודות פעולה שדורשות טיפול
   */
  async getActions(_req: Request, res: Response, next: NextFunction) {
    try {
      const actions = await dashboardService.getActionItems();
      res.json({
        status: 'success',
        data: actions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/dashboard/usage
   * מחזיר נתוני שימוש במערכת (אם קיים tracking)
   */
  async getUsage(_req: Request, res: Response, next: NextFunction) {
    try {
      const usage = await dashboardService.getUsageStats();
      res.json({
        status: 'success',
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/dashboard/recent-activity
   * מחזיר פעילות אחרונה במערכת
   */
  async getRecentActivity(_req: Request, res: Response, next: NextFunction) {
    try {
      const activity = await dashboardService.getRecentActivity();
      res.json({
        status: 'success',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/dashboard/usage/export
   * ייצוא נתוני שימוש ל-CSV
   */
  async exportUsage(_req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await dashboardService.exportUsageToCsv();
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="usage-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}
