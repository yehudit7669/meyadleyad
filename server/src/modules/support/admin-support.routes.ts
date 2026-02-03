import { Router, Request, Response } from 'express';
import { conversationService } from './conversation.service';
import { supportNotificationService } from './support-notification.service';
import { supportEmailService } from './support-email.service';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validation';
import {
  sendMessageSchema,
  conversationFiltersSchema,
} from './support.validation';
import { SenderType } from '@prisma/client';
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';

const router = Router();

// All admin routes require ADMIN or SUPER_ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN', 'MODERATOR'));

/**
 * GET /admin/conversations
 * Get all conversations with filters
 */
router.get(
  '/',
  validateRequest({ query: conversationFiltersSchema }),
  async (req: Request, res: Response) => {
    try {
      const { status, search, unread, page = 1, limit = 20 } = req.query;

      const filters = {
        status: status as any,
        search: search as string,
        unread: unread === 'true',
      };

      const result = await conversationService.getAdminConversations(
        filters,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error getting admin conversations:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת השיחות',
      });
    }
  }
);

/**
 * GET /admin/conversations/unread-count
 * Get count of conversations with unread messages for admin
 * IMPORTANT: This MUST be before /:id route to avoid conflicts
 */
router.get(
  '/unread-count',
  async (req: Request, res: Response) => {
    try {
      logger.info('Fetching admin unread count...');
      
      // Get all conversations
      const conversations = await prisma.conversation.findMany({
        select: {
          id: true,
          adminLastReadAt: true,
          lastMessageAt: true,
        }
      });

      logger.info(`Found ${conversations.length} total conversations`);

      // Count conversations where admin hasn't read yet or new messages arrived
      const count = conversations.filter(conv => {
        // Skip conversations with no messages
        if (!conv.lastMessageAt) return false;
        
        // If admin never read this conversation
        if (!conv.adminLastReadAt) return true;
        
        // If there are new messages after admin last read
        if (conv.lastMessageAt > conv.adminLastReadAt) {
          return true;
        }
        
        return false;
      }).length;

      logger.info(`Admin unread count: ${count} conversations`, {
        total: conversations.length,
        unread: count
      });

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error('Error getting admin unread count:', error instanceof Error ? error : new Error(String(error)));
      if (error instanceof Error && error.stack) {
        logger.error('Stack trace: ' + error.stack);
      }
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת מספר הודעות',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * GET /api/admin/conversations/:id
 * Get a specific conversation with all messages
 * NOTE: Does NOT mark as read - use POST /:id/read endpoint for that
 */
router.get(
  '/:id',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const conversation = await conversationService.getConversationById(id);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      logger.error('Error getting conversation:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת השיחה',
      });
    }
  }
);

/**
 * POST /api/admin/conversations/:id/read
 * Mark a conversation as read by admin
 */
router.post(
  '/:id/read',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await conversationService.markAsReadForAdmin(id);

      res.json({
        success: true,
        message: 'השיחה סומנה כנקראה',
      });
    } catch (error) {
      logger.error('Error marking conversation as read:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בסימון השיחה כנקראה',
      });
    }
  }
);

/**
 * POST /api/admin/conversations/:id/messages
 * Admin sends a reply in a conversation
 */
router.post(
  '/:id/messages',
  validateRequest({ body: sendMessageSchema }),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { body } = req.body;

      const conversation = await conversationService.getConversationById(id);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'שיחה לא נמצאה',
        });
      }

      // Send message
      const message = await conversationService.sendMessage({
        conversationId: id,
        senderType: SenderType.ADMIN,
        senderUserId: user.id,
        body,
      });

      // Handle notifications based on conversation type
      if (conversation.userId) {
        // Logged-in user - create in-app notification
        await supportNotificationService.notifyUserOfAdminReply(id, conversation.userId);
      } else if (conversation.guestEmail) {
        // Guest user - send email
        await supportEmailService.sendGuestReplyEmail(message.id);
      }

      logger.info(`Admin replied to conversation ${id}`);

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      logger.error('Error sending admin message:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בשליחת ההודעה',
      });
    }
  }
);

/**
 * POST /api/admin/conversations/:id/close
 * Close a conversation
 */
router.post(
  '/:id/close',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const conversation = await conversationService.closeConversation(id);

      res.json({
        success: true,
        message: 'השיחה נסגרה בהצלחה',
        data: conversation,
      });
    } catch (error) {
      logger.error('Error closing conversation:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בסגירת השיחה',
      });
    }
  }
);

/**
 * POST /api/admin/conversations/:id/reopen
 * Reopen a closed conversation
 */
router.post(
  '/:id/reopen',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const conversation = await conversationService.getConversationById(id);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'שיחה לא נמצאה',
        });
      }

      const updated = await conversationService.closeConversation(id); // This actually just updates status
      // We need to update to OPEN instead
      const prisma = require('../../lib/prisma').prisma;
      const reopened = await prisma.conversation.update({
        where: { id },
        data: { status: 'OPEN' },
      });

      res.json({
        success: true,
        message: 'השיחה נפתחה מחדש',
        data: reopened,
      });
    } catch (error) {
      logger.error('Error reopening conversation:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בפתיחת השיחה מחדש',
      });
    }
  }
);

/**
 * POST /api/admin/conversations/process-emails
 * Manually trigger email processing (for pending emails to guests)
 */
router.post(
  '/process-emails',
  async (req: Request, res: Response) => {
    try {
      await supportEmailService.processPendingEmails();

      res.json({
        success: true,
        message: 'עיבוד מיילים הסתיים',
      });
    } catch (error) {
      logger.error('Error processing emails:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בעיבוד המיילים',
      });
    }
  }
);

/**
 * POST /api/admin/conversations/retry-failed-emails
 * Retry failed email deliveries
 */
router.post(
  '/retry-failed-emails',
  async (req: Request, res: Response) => {
    try {
      await supportEmailService.retryFailedEmails();

      res.json({
        success: true,
        message: 'ניסיון חוזר למיילים נכשלים הסתיים',
      });
    } catch (error) {
      logger.error('Error retrying failed emails:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בניסיון חוזר',
      });
    }
  }
);

export default router;
