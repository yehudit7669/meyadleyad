import { Router, Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { validateRequest } from '../../middlewares/validation';
import { trackPageViewSchema, getAnalyticsQuerySchema } from './analytics.validation';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get overview statistics (admin only)
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getOverviewStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get page analytics (admin only)
router.get('/pages', validateRequest({ query: getAnalyticsQuerySchema }), async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getPageAnalytics(req.query as any);
    res.json(analytics);
  } catch (error: any) {
    console.error('Error fetching page analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Export analytics to Excel (admin only)
router.get('/export/excel', validateRequest({ query: getAnalyticsQuerySchema }), async (req: Request, res: Response) => {
  try {
    const workbook = await analyticsService.exportAnalyticsToExcel(req.query as any);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

// Get ads with view counts (admin only)
router.get('/ads-views', async (req: Request, res: Response) => {
  try {
    const { status, categoryId, limit } = req.query;
    const ads = await analyticsService.getAdsWithViews({
      status: status as string,
      categoryId: categoryId as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(ads);
  } catch (error: any) {
    console.error('Error fetching ads with views:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

// Track page view (public endpoint - can be called by anyone)
router.post('/track', validateRequest({ body: trackPageViewSchema }), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userAgent = req.get('user-agent');
    
    await analyticsService.trackPageView(userId, req.body, userAgent);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking page view:', error);
    // Don't fail the request if tracking fails
    res.json({ success: false });
  }
});

export default router;
