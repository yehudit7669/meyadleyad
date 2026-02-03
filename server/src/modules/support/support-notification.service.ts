import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { SupportNotificationType } from '@prisma/client';

class SupportNotificationService {
  /**
   * Create notification when admin replies to user
   */
  async notifyUserOfAdminReply(conversationId: string, userId: string) {
    try {
      await prisma.supportNotification.create({
        data: {
          userId,
          conversationId,
          type: SupportNotificationType.ADMIN_REPLY,
          isRead: false,
        },
      });

      logger.info(`Notification created for user ${userId} on conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error creating support notification:', error instanceof Error ? error : new Error(String(error)));
      // Don't throw - notification failure shouldn't break the main flow
    }
  }

  /**
   * Get unread notifications for user
   */
  async getUnreadNotifications(userId: string) {
    try {
      const notifications = await prisma.supportNotification.findMany({
        where: {
          userId,
          isRead: false,
        },
        include: {
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return notifications;
    } catch (error) {
      logger.error('Error getting unread notifications:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.supportNotification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      logger.error('Error getting unread count:', error instanceof Error ? error : new Error(String(error)));
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      await prisma.supportNotification.updateMany({
        where: {
          id: notificationId,
          userId, // Ensure user can only mark their own notifications
        },
        data: { isRead: true },
      });

      logger.info(`Notification ${notificationId} marked as read`);
    } catch (error) {
      logger.error('Error marking notification as read:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Mark all notifications as read for a conversation
   */
  async markConversationAsRead(conversationId: string, userId: string) {
    try {
      await prisma.supportNotification.updateMany({
        where: {
          conversationId,
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      logger.info(`All notifications marked as read for conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error marking conversation notifications as read:', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export const supportNotificationService = new SupportNotificationService();
