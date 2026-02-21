import { Router, Request, Response } from 'express';
import { contentDistributionService } from './content-distribution.service';
import { validateRequest } from '../../middlewares/validation';
import {
  createContentItemSchema,
  updateContentItemSchema,
  distributeContentSchema,
  addSubscriberSchema,
  updateSubscriberSchema,
} from './content-distribution.validation';
import { authenticate, AuthRequest } from '../../middlewares/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ========== Content Items Endpoints ==========

// Get all content items
router.get('/content-items', async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has access (Admin, Super Admin, or Moderator for read-only)
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const contentItems = await contentDistributionService.getContentItems();
    res.json(contentItems);
  } catch (error: any) {
    console.error('Error fetching content items:', error);
    res.status(500).json({ error: 'Failed to fetch content items' });
  }
});

// Create content item
router.post('/content-items', validateRequest({ body: createContentItemSchema }), async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const contentItem = await contentDistributionService.createContentItem({
      ...req.body,
      createdBy: req.user!.id,
    });
    res.json(contentItem);
  } catch (error: any) {
    console.error('Error creating content item:', error);
    res.status(500).json({ error: 'Failed to create content item' });
  }
});

// Update content item
router.patch('/content-items/:id', validateRequest({ body: updateContentItemSchema }), async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const contentItem = await contentDistributionService.updateContentItem(
      req.params.id,
      req.body,
      req.user!.id
    );
    res.json(contentItem);
  } catch (error: any) {
    console.error('Error updating content item:', error);
    res.status(500).json({ error: 'Failed to update content item' });
  }
});

// Delete content item
router.delete('/content-items/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await contentDistributionService.deleteContentItem(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting content item:', error);
    res.status(500).json({ error: 'Failed to delete content item' });
  }
});

// Distribute content
router.post('/content-items/:id/distribute', validateRequest({ body: distributeContentSchema }), async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await contentDistributionService.distributeContent({
      ...req.body,
      distributedBy: req.user!.id,
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error distributing content:', error);
    res.status(500).json({ error: 'Failed to distribute content' });
  }
});

// ========== Mailing List Endpoints ==========

// Get all subscribers
router.get('/mailing-list', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { status } = req.query;
    const subscribers = await contentDistributionService.getSubscribers(
      status as any
    );
    res.json(subscribers);
  } catch (error: any) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Get weekly digest subscribers (from UserPreference)
router.get('/weekly-digest-subscribers', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const subscribers = await contentDistributionService.getWeeklyDigestSubscribers();
    res.json(subscribers);
  } catch (error: any) {
    console.error('Error fetching weekly digest subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch weekly digest subscribers' });
  }
});

// Block user from weekly digest
router.post('/weekly-digest-subscribers/:userId/block', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await contentDistributionService.blockWeeklyDigestUser(req.params.userId, req.user!.id);
    res.json({ success: true, message: 'User blocked from weekly digest' });
  } catch (error: any) {
    console.error('Error blocking user from weekly digest:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock user from weekly digest
router.post('/weekly-digest-subscribers/:userId/unblock', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await contentDistributionService.unblockWeeklyDigestUser(req.params.userId, req.user!.id);
    res.json({ success: true, message: 'User unblocked from weekly digest' });
  } catch (error: any) {
    console.error('Error unblocking user from weekly digest:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// Add subscriber
router.post('/mailing-list', validateRequest({ body: addSubscriberSchema }), async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log('Adding subscriber:', req.body, 'by admin:', req.user!.id);
    
    const subscriber = await contentDistributionService.addSubscriber(
      req.body,
      req.user!.id
    );
    res.json(subscriber);
  } catch (error: any) {
    console.error('Error adding subscriber:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to add subscriber', details: error.message });
  }
});

// Update subscriber
router.patch('/mailing-list/:id', validateRequest({ body: updateSubscriberSchema }), async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const subscriber = await contentDistributionService.updateSubscriber(req.params.id, {
      ...req.body,
      adminId: req.user!.id,
    });
    res.json(subscriber);
  } catch (error: any) {
    console.error('Error updating subscriber:', error);
    res.status(500).json({ error: 'Failed to update subscriber' });
  }
});

// Remove/Block subscriber
router.delete('/mailing-list/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await contentDistributionService.removeSubscriber(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing subscriber:', error);
    res.status(500).json({ error: 'Failed to remove subscriber' });
  }
});

// ========== Statistics Endpoints ==========

// Get distribution statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const stats = await contentDistributionService.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Export statistics (ADMIN and SUPER_ADMIN only)
router.get('/stats/export', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions to export' });
    }

    const workbook = await contentDistributionService.exportStats(req.user!.id, userRole!);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=content-distribution-stats-${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error exporting stats:', error);
    res.status(500).json({ error: 'Failed to export statistics' });
  }
});

// Get distribution history
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const history = await contentDistributionService.getDistributionHistory(limit);
    res.json(history);
  } catch (error: any) {
    console.error('Error fetching distribution history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ========== Public Endpoints (No Auth) ==========

// Unsubscribe by token
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body;

    if (token) {
      await contentDistributionService.unsubscribeByToken(token);
    } else if (email) {
      await contentDistributionService.unsubscribeByEmail(email);
    } else {
      return res.status(400).json({ error: 'Token or email required' });
    }

    res.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error: any) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

export default router;
