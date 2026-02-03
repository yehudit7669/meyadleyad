import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { ConversationStatus, SenderType, EmailDeliveryStatus } from '@prisma/client';

export interface CreateConversationDto {
  userId?: string;
  guestEmail?: string;
  initialMessage: string;
}

export interface SendMessageDto {
  conversationId: string;
  senderType: SenderType;
  senderUserId?: string;
  body: string;
}

export interface ConversationFilters {
  status?: ConversationStatus;
  search?: string; // email/username/content
  unread?: boolean;
}

class ConversationService {
  /**
   * Create a new conversation or return existing one
   */
  async createConversation(data: CreateConversationDto) {
    try {
      // Validate: must have either userId or guestEmail
      if (!data.userId && !data.guestEmail) {
        throw new Error('Either userId or guestEmail is required');
      }

      if (data.userId && data.guestEmail) {
        throw new Error('Cannot have both userId and guestEmail');
      }

      // Check if conversation already exists
      const existing = await prisma.conversation.findFirst({
        where: data.userId
          ? { userId: data.userId, status: ConversationStatus.OPEN }
          : { guestEmail: data.guestEmail, status: ConversationStatus.OPEN },
      });

      if (existing) {
        // Add message to existing conversation
        const message = await this.sendMessage({
          conversationId: existing.id,
          senderType: data.userId ? SenderType.USER : SenderType.GUEST,
          senderUserId: data.userId,
          body: data.initialMessage,
        });

        return { conversation: existing, message, isNew: false };
      }

      // Create new conversation with initial message
      const conversation = await prisma.conversation.create({
        data: {
          userId: data.userId,
          guestEmail: data.guestEmail,
          status: ConversationStatus.OPEN,
          lastMessageAt: new Date(),
          lastMessagePreview: data.initialMessage.substring(0, 100),
        },
        include: {
          user: true,
        },
      });

      const message = await this.sendMessage({
        conversationId: conversation.id,
        senderType: data.userId ? SenderType.USER : SenderType.GUEST,
        senderUserId: data.userId,
        body: data.initialMessage,
      });

      logger.info(`New conversation created: ${conversation.id}`);

      return { conversation, message, isNew: true };
    } catch (error) {
      logger.error('Error creating conversation:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(data: SendMessageDto) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: { user: true },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Determine email delivery status
      let emailDeliveryStatus: EmailDeliveryStatus = EmailDeliveryStatus.NOT_REQUIRED;
      
      // If admin is replying to a guest, mark for email delivery
      if (data.senderType === SenderType.ADMIN && conversation.guestEmail) {
        emailDeliveryStatus = EmailDeliveryStatus.PENDING;
      }

      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderType: data.senderType,
          senderUserId: data.senderUserId,
          body: data.body,
          emailDeliveryStatus,
        },
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: data.body.substring(0, 100),
          updatedAt: new Date(),
        },
      });

      logger.info(`Message sent in conversation ${data.conversationId}`);

      return message;
    } catch (error) {
      logger.error('Error sending message:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get conversations for admin with filters
   */
  async getAdminConversations(filters: ConversationFilters, page = 1, limit = 20) {
    try {
      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.search) {
        where.OR = [
          { guestEmail: { contains: filters.search, mode: 'insensitive' } },
          { user: { email: { contains: filters.search, mode: 'insensitive' } } },
          { user: { name: { contains: filters.search, mode: 'insensitive' } } },
          { lastMessagePreview: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where,
          include: {
            user: {
              select: { id: true, email: true, name: true, avatar: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: {
              select: { messages: true },
            },
          },
          orderBy: { lastMessageAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.conversation.count({ where }),
      ]);

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting admin conversations:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get conversation by ID with all messages
   */
  async getConversationById(id: string, userId?: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatar: true },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // If userId provided, verify access
      if (userId && conversation.userId !== userId) {
        throw new Error('Unauthorized access to conversation');
      }

      return conversation;
    } catch (error) {
      logger.error('Error getting conversation:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where: { userId },
          select: {
            id: true,
            status: true,
            createdAt: true,
            lastMessageAt: true,
            lastMessagePreview: true,
            userLastReadAt: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: {
              select: { messages: true },
            },
          },
          orderBy: { lastMessageAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.conversation.count({ where: { userId } }),
      ]);

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting user conversations:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Mark conversation as read for user
   */
  async markAsReadForUser(conversationId: string, userId: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation || conversation.userId !== userId) {
        throw new Error('Conversation not found or unauthorized');
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { userLastReadAt: new Date() },
      });

      // Mark notifications as read
      await prisma.supportNotification.updateMany({
        where: {
          conversationId,
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      logger.info(`Conversation ${conversationId} marked as read for user ${userId}`);
    } catch (error) {
      logger.error('Error marking conversation as read:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Mark conversation as read for admin
   */
  async markAsReadForAdmin(conversationId: string) {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { adminLastReadAt: new Date() },
      });

      logger.info(`Conversation ${conversationId} marked as read by admin`);
    } catch (error) {
      logger.error('Error marking conversation as read for admin:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Close a conversation
   */
  async closeConversation(conversationId: string) {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: ConversationStatus.CLOSED },
      });

      logger.info(`Conversation ${conversationId} closed`);
      return conversation;
    } catch (error) {
      logger.error('Error closing conversation:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get unread count for user
   */
  async getUnreadCountForUser(userId: string): Promise<number> {
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
}

export const conversationService = new ConversationService();
