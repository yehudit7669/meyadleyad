import { Router, Request, Response } from 'express';
import { contentDistributionService } from './content-distribution.service';
import { validateRequest } from '../../middlewares/validation';
import { addSubscriberSchema, dispatchContentSchema } from './content-distribution.validation';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all subscribers
router.get('/subscribers', async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;
    const subscribers = await contentDistributionService.getSubscribers(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );
    res.json(subscribers);
  } catch (error: any) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Add subscriber
router.post('/subscribers', validateRequest({ body: addSubscriberSchema }), async (req: Request, res: Response) => {
  try {
    const subscriber = await contentDistributionService.addSubscriber(req.body);
    res.json(subscriber);
  } catch (error: any) {
    console.error('Error adding subscriber:', error);
    res.status(500).json({ error: 'Failed to add subscriber' });
  }
});

// Remove subscriber
router.delete('/subscribers/:email', async (req: Request, res: Response) => {
  try {
    await contentDistributionService.removeSubscriber(req.params.email);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing subscriber:', error);
    res.status(500).json({ error: 'Failed to remove subscriber' });
  }
});

// Dispatch content
router.post('/dispatch', validateRequest({ body: dispatchContentSchema }), async (req: Request, res: Response) => {
  try {
    const result = await contentDistributionService.dispatchContent(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error dispatching content:', error);
    res.status(500).json({ error: 'Failed to dispatch content' });
  }
});

// Get dispatch statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await contentDistributionService.getDispatchStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching dispatch stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get dispatch history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const history = await contentDistributionService.getDispatchHistory(limit);
    res.json(history);
  } catch (error: any) {
    console.error('Error fetching dispatch history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
