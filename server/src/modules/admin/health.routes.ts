/**
 * Health Check Endpoint with Browser Check
 * מספק endpoint לבדיקת תקינות המערכת כולל בדיקת Chromium בפרוד
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// Public health check
router.get('/health', async (_req: Request, res: Response) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Admin-only detailed health check
router.get('/health/detailed', authenticate, authorize('SUPER_ADMIN'), async (_req: Request, res: Response) => {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  // Check browser availability (only in production)
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    try {
      const { launchBrowser } = await import('../../utils/puppeteerConfig');
      const browser = await launchBrowser();
      const version = await browser.version();
      await browser.close();
      
      checks.browser = {
        status: 'available',
        version,
      };
    } catch (error) {
      checks.browser = {
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  } else {
    checks.browser = {
      status: 'not-checked',
      reason: 'Development environment',
    };
  }

  res.json(checks);
});

export default router;
