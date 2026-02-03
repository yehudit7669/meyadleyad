import { Router, Request, Response } from 'express';
import { conversationService } from './conversation.service';
import { supportNotificationService } from './support-notification.service';
import { supportEmailService } from './support-email.service';
import { auth, optionalAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validation';
import {
  createContactSchema,
  sendMessageSchema,
  conversationFiltersSchema,
} from './support.validation';
import { SenderType } from '@prisma/client';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /api/contact
 * Create a new contact request (for both logged-in users and guests)
 */
router.post(
  '/contact',
  optionalAuth, // Allow both authenticated and guest users
  validateRequest({ body: createContactSchema }),
  async (req: Request, res: Response) => {
    try {
      const { message, guestEmail } = req.body;
      const user = (req as any).user;

      // Validate: if not authenticated, guestEmail is required
      if (!user && !guestEmail) {
        return res.status(400).json({
          success: false,
          message: 'אימייל חובה למשתמשים לא מחוברים',
        });
      }

      // Validate: if authenticated, guestEmail should not be provided
      if (user && guestEmail) {
        return res.status(400).json({
          success: false,
          message: 'משתמשים מחוברים לא יכולים לספק אימייל',
        });
      }

      const result = await conversationService.createConversation({
        userId: user?.id,
        guestEmail: guestEmail?.toLowerCase(),
        initialMessage: message,
      });

      logger.info(`Contact request created: conversation ${result.conversation.id}`);

      res.status(201).json({
        success: true,
        message: 'ההודעה נשלחה בהצלחה',
        data: {
          conversationId: result.conversation.id,
          isNew: result.isNew,
        },
      });
    } catch (error) {
      logger.error('Error creating contact request:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בשליחת ההודעה',
      });
    }
  }
);

/**
 * GET /api/me/conversations
 * Get logged-in user's conversations
 */
router.get(
  '/me/conversations',
  auth,
  validateRequest({ query: conversationFiltersSchema }),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { page = 1, limit = 20 } = req.query;

      const result = await conversationService.getUserConversations(
        user.id,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error getting user conversations:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת השיחות',
      });
    }
  }
);

/**
 * GET /api/me/conversations/:id
 * Get a specific conversation with all messages
 * NOTE: Does NOT mark as read - use POST /read endpoint for that
 */
router.get(
  '/me/conversations/:id',
  auth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const conversation = await conversationService.getConversationById(id, user.id);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized access to conversation') {
        return res.status(403).json({
          success: false,
          message: 'אין לך גישה לשיחה זו',
        });
      }

      logger.error('Error getting conversation:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת השיחה',
      });
    }
  }
);

/**
 * POST /api/me/conversations/:id/messages
 * Send a new message in a conversation
 */
router.post(
  '/me/conversations/:id/messages',
  auth,
  validateRequest({ body: sendMessageSchema }),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { body } = req.body;

      // Verify user owns this conversation
      const conversation = await conversationService.getConversationById(id, user.id);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'שיחה לא נמצאה',
        });
      }

      const message = await conversationService.sendMessage({
        conversationId: id,
        senderType: SenderType.USER,
        senderUserId: user.id,
        body,
      });

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      logger.error('Error sending message:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בשליחת ההודעה',
      });
    }
  }
);

/**
 * POST /api/me/conversations/:id/read
 * Mark conversation as read
 */
router.post(
  '/me/conversations/:id/read',
  auth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      await conversationService.markAsReadForUser(id, user.id);

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
 * GET /api/me/support-notifications
 * Get user's unread support notifications
 */
router.get(
  '/me/support-notifications',
  auth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const notifications = await supportNotificationService.getUnreadNotifications(user.id);

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      logger.error('Error getting support notifications:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת ההתראות',
      });
    }
  }
);

/**
 * GET /api/me/support-notifications/count
 * Get unread support notifications count
 */
router.get(
  '/me/support-notifications/count',
  auth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const count = await supportNotificationService.getUnreadCount(user.id);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error('Error getting notification count:', error instanceof Error ? error : new Error(String(error)));
      res.json({
        success: true,
        data: { count: 0 },
      });
    }
  }
);

export default router;
