import { prisma } from '../../lib/prisma';
import { AddSubscriberDto, DispatchContentDto } from './content-distribution.validation';

export class ContentDistributionService {
  // Add subscriber
  async addSubscriber(data: AddSubscriberDto) {
    const subscriber = await prisma.mailingListSubscriber.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        isActive: true,
        unsubscribedAt: null,
      },
      create: {
        email: data.email,
        name: data.name,
      },
    });

    return subscriber;
  }

  // Remove subscriber
  async removeSubscriber(email: string) {
    await prisma.mailingListSubscriber.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });
  }

  // Get all subscribers
  async getSubscribers(isActive?: boolean) {
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const subscribers = await prisma.mailingListSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return subscribers;
  }

  // Dispatch content (simulate - actual email sending would use email service)
  async dispatchContent(data: DispatchContentDto) {
    let recipients: string[];

    if (data.recipientEmails && data.recipientEmails.length > 0) {
      recipients = data.recipientEmails;
    } else {
      // Get all active subscribers
      const subscribers = await prisma.mailingListSubscriber.findMany({
        where: { isActive: true },
        select: { email: true },
      });
      recipients = subscribers.map((s: any) => s.email);
    }

    // Create dispatch logs
    const logs = await Promise.all(
      recipients.map(email =>
        prisma.contentDispatchLog.create({
          data: {
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            recipientEmail: email,
            status: 'SENT', // In production, this would be based on actual email send result
          },
        })
      )
    );

    return {
      totalSent: logs.length,
      recipients,
    };
  }

  // Get dispatch statistics
  async getDispatchStats() {
    const [totalSubscribers, activeSubscribers, recentDispatches, lastDispatch] = await Promise.all([
      prisma.mailingListSubscriber.count(),
      prisma.mailingListSubscriber.count({ where: { isActive: true } }),
      prisma.contentDispatchLog.count({
        where: {
          sentAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.contentDispatchLog.findFirst({
        orderBy: { sentAt: 'desc' },
        select: {
          fileName: true,
          fileUrl: true,
          sentAt: true,
        },
      }),
    ]);

    // Get unique recipients from last dispatch
    let lastDispatchRecipients = 0;
    if (lastDispatch) {
      lastDispatchRecipients = await prisma.contentDispatchLog.count({
        where: {
          fileName: lastDispatch.fileName,
          sentAt: lastDispatch.sentAt,
        },
      });
    }

    return {
      totalSubscribers,
      activeSubscribers,
      recentDispatches,
      lastDispatch: lastDispatch ? {
        ...lastDispatch,
        recipients: lastDispatchRecipients,
      } : null,
    };
  }

  // Get dispatch history
  async getDispatchHistory(limit: number = 50) {
    const logs = await prisma.contentDispatchLog.findMany({
      take: limit,
      orderBy: { sentAt: 'desc' },
    });

    return logs;
  }
}

export const contentDistributionService = new ContentDistributionService();
