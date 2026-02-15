/**
 * WhatsApp Distribution Service
 * הסרוויס המרכזי לניהול הפצת מודעות ל-WhatsApp
 */

import prisma from '../../../config/database';
import { messageBuilder, WhatsAppMessagePayload } from './message-builder.service';
import { routingEngine, RoutingMatch } from './routing-engine.service';
import { auditService } from './audit.service';
import { DistributionItemStatus, Ad } from '@prisma/client';

export interface CreateDistributionResult {
  created: number;
  skipped: number;
  items: Array<{
    id: string;
    groupId: string;
    groupName: string;
    status: DistributionItemStatus;
  }>;
}

export interface DigestInfo {
  digestId: string;
  itemCount: number;
  payload: WhatsAppMessagePayload;
}

export class WhatsAppDistributionService {
  /**
   * יצירת distribution items עבור מודעה מאושרת
   */
  async createDistributionItems(
    adId: string,
    userId: string
  ): Promise<CreateDistributionResult> {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: true,
        City: true,
        Street: true,
        AdImage: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // Find matching groups
    const matches = await routingEngine.findMatchingGroups(adId);

    // Build message payload once
    const payload = messageBuilder.buildAdMessage(ad);

    const result: CreateDistributionResult = {
      created: 0,
      skipped: 0,
      items: [],
    };

    // If no matches, create a placeholder item with null groupId
    if (matches.length === 0) {
      console.log(`⚠️ No matching groups found for ad ${adId}, creating placeholder item`);
      
      const item = await prisma.distributionItem.create({
        data: {
          adId,
          groupId: null,
          status: DistributionItemStatus.PENDING,
          priority: 0,
          payloadSnapshot: payload as any,
          dedupeKey: `${adId}-no-group`,
        },
      });

      console.log(`✅ Created placeholder item ${item.id} with groupId=null for ad ${adId}`);

      result.created = 1;
      result.items.push(item);

      await auditService.log({
        action: 'create_distribution_no_group',
        actorUserId: userId,
        entityType: 'distribution_item',
        entityId: item.id,
        payload: { adId, reason: 'No matching groups found' },
      });

      return result;
    }

    // Create distribution items
    for (const match of matches) {
      // Check for duplicates
      const isDuplicate = await routingEngine.checkDuplicate(adId, match.groupId);
      
      if (isDuplicate) {
        console.log(`⏭️ Skipping duplicate: ad ${adId} → group ${match.groupId}`);
        result.skipped++;
        continue;
      }

      // Check quota
      const quota = await routingEngine.checkDailyQuota(match.groupId);
      if (!quota.canSend) {
        console.log(`⏭️ Skipping (quota reached): group ${match.groupId}`);
        result.skipped++;
        continue;
      }

      // Create item
      const item = await prisma.distributionItem.create({
        data: {
          adId,
          groupId: match.groupId,
          status: DistributionItemStatus.PENDING,
          priority: match.priority,
          payloadSnapshot: payload as any,
          dedupeKey: `${adId}-${match.groupId}`,
        },
      });

      result.created++;
      result.items.push({
        id: item.id,
        groupId: match.groupId,
        groupName: match.groupName,
        status: item.status,
      });

      // Audit log
      await auditService.log({
        action: 'create_distribution_items',
        actorUserId: userId,
        entityType: 'distribution_item',
        entityId: item.id,
        payload: {
          adId,
          groupId: match.groupId,
          priority: match.priority,
        },
      });
    }

    console.log(`✅ Created ${result.created} distribution items for ad ${adId} (skipped ${result.skipped})`);

    return result;
  }

  /**
   * סימון פריט כ-"בתהליך" (המנהל התחיל לשלוח)
   */
  async markInProgress(itemId: string, userId: string): Promise<WhatsAppMessagePayload> {
    const item = await prisma.distributionItem.findUnique({
      where: { id: itemId },
      include: {
        Ad: {
          include: {
            Category: true,
            City: true,
            Street: true,
            AdImage: true,
          },
        },
        Group: true,
      },
    });

    if (!item) {
      throw new Error('Distribution item not found');
    }

    if (item.status !== DistributionItemStatus.PENDING) {
      throw new Error(`Item is not pending (current status: ${item.status})`);
    }

    // Update status
    await prisma.distributionItem.update({
      where: { id: itemId },
      data: {
        status: DistributionItemStatus.IN_PROGRESS,
      },
    });

    // Audit
    await auditService.log({
      action: 'mark_in_progress',
      actorUserId: userId,
      entityType: 'distribution_item',
      entityId: itemId,
      payload: {
        adId: item.adId,
        groupId: item.groupId,
      },
    });

    // Return payload (or rebuild)
    if (item.payloadSnapshot) {
      return item.payloadSnapshot as any as WhatsAppMessagePayload;
    }

    // Fallback: rebuild
    return messageBuilder.buildAdMessage(item.Ad);
  }

  /**
   * סימון פריט כנשלח (לאחר שהמנהל אישר)
   */
  async markSent(itemId: string, userId: string): Promise<void> {
    const item = await prisma.distributionItem.findUnique({
      where: { id: itemId },
      include: { Ad: true },
    });

    if (!item) {
      throw new Error('Distribution item not found');
    }

    const now = new Date();

    // Update item
    await prisma.distributionItem.update({
      where: { id: itemId },
      data: {
        status: DistributionItemStatus.SENT,
        sentAt: now,
        sentBy: userId,
      },
    });

    // Update ad (first sent)
    if (!item.Ad.whatsappSent) {
      await prisma.ad.update({
        where: { id: item.adId },
        data: {
          whatsappSent: true,
          whatsappSentAt: now,
          whatsappSentBy: userId,
        },
      });
    }

    // Audit
    await auditService.log({
      action: 'mark_sent',
      actorUserId: userId,
      entityType: 'distribution_item',
      entityId: itemId,
      payload: {
        adId: item.adId,
        groupId: item.groupId,
        sentAt: now.toISOString(),
      },
    });

    console.log(`✅ Marked item ${itemId} as sent`);
  }

  /**
   * דחיית שליחה (defer)
   */
  async deferItem(itemId: string, userId: string, reason?: string): Promise<void> {
    await prisma.distributionItem.update({
      where: { id: itemId },
      data: {
        status: DistributionItemStatus.DEFERRED,
        lastError: reason || 'Manually deferred',
      },
    });

    await auditService.log({
      action: 'mark_deferred',
      actorUserId: userId,
      entityType: 'distribution_item',
      entityId: itemId,
      payload: { reason },
    });

    console.log(`⏸️ Deferred item ${itemId}`);
  }

  /**
   * סימון כשגיאה
   */
  async markFailed(itemId: string, userId: string, error: string): Promise<void> {
    const item = await prisma.distributionItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('Distribution item not found');
    }

    await prisma.distributionItem.update({
      where: { id: itemId },
      data: {
        status: DistributionItemStatus.FAILED,
        lastError: error,
        attemptCount: item.attemptCount + 1,
      },
    });

    await auditService.log({
      action: 'mark_failed',
      actorUserId: userId,
      entityType: 'distribution_item',
      entityId: itemId,
      payload: { error },
    });
  }

  /**
   * Override resend - שליחה חוזרת (רק מנהל ראשי)
   */
  async overrideResend(itemId: string, userId: string, reason: string): Promise<void> {
    const item = await prisma.distributionItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('Distribution item not found');
    }

    // Reset to pending
    await prisma.distributionItem.update({
      where: { id: itemId },
      data: {
        status: DistributionItemStatus.PENDING,
        lastError: null,
      },
    });

    // Critical audit
    await auditService.log({
      action: 'override_resend',
      actorUserId: userId,
      entityType: 'distribution_item',
      entityId: itemId,
      payload: {
        reason,
        previousStatus: item.status,
        adId: item.adId,
        groupId: item.groupId,
      },
    });

    console.log(`🔄 Override resend for item ${itemId} by ${userId}: ${reason}`);
  }

  /**
   * יצירת Digest - פוסט מרוכז למספר מודעות
   */
  async createDigest(
    groupId: string,
    userId: string,
    itemIds: string[]
  ): Promise<DigestInfo> {
    if (itemIds.length === 0) {
      throw new Error('No items provided for digest');
    }

    // Get group
    const group = await prisma.whatsAppGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    if (!group.allowDigest) {
      throw new Error('Group does not allow digest posts');
    }

    // Get items
    const items = await prisma.distributionItem.findMany({
      where: {
        id: { in: itemIds },
        groupId,
        status: DistributionItemStatus.PENDING,
      },
      include: {
        Ad: {
          include: {
            Category: true,
            City: true,
            Street: true,
            AdImage: true,
          },
        },
      },
    });

    if (items.length === 0) {
      throw new Error('No valid pending items found');
    }

    // Build digest message
    const ads = items.map((item) => item.Ad);
    const payload = messageBuilder.buildDigestMessage(ads, group.name);

    // Create digest entity
    const digest = await prisma.distributionDigest.create({
      data: {
        groupId,
        title: `Digest - ${group.name} - ${new Date().toLocaleDateString('he-IL')}`,
        itemCount: items.length,
        status: DistributionItemStatus.PENDING,
        payloadSnapshot: payload as any,
      },
    });

    // Link items to digest
    await prisma.distributionItem.updateMany({
      where: {
        id: { in: itemIds },
      },
      data: {
        digestId: digest.id,
        status: DistributionItemStatus.DEFERRED, // Mark as deferred (included in digest)
      },
    });

    // Audit
    await auditService.log({
      action: 'create_digest',
      actorUserId: userId,
      entityType: 'digest',
      entityId: digest.id,
      payload: {
        groupId,
        itemCount: items.length,
        itemIds,
      },
    });

    console.log(`📊 Created digest ${digest.id} with ${items.length} items for group ${groupId}`);

    return {
      digestId: digest.id,
      itemCount: items.length,
      payload,
    };
  }

  /**
   * סימון digest כנשלח
   */
  async markDigestSent(digestId: string, userId: string): Promise<void> {
    const now = new Date();

    await prisma.distributionDigest.update({
      where: { id: digestId },
      data: {
        status: DistributionItemStatus.SENT,
        sentAt: now,
        sentBy: userId,
      },
    });

    // Also mark linked items as part of digest (optional)
    // For now, they remain DEFERRED

    await auditService.log({
      action: 'mark_sent',
      actorUserId: userId,
      entityType: 'digest',
      entityId: digestId,
    });

    console.log(`✅ Marked digest ${digestId} as sent`);
  }

  /**
   * קבלת תור ההפצה עם פילטרים
   */
  async getQueue(filters?: {
    groupId?: string;
    channelId?: string;
    status?: DistributionItemStatus | DistributionItemStatus[];
    cityId?: string;
    categoryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.groupId) {
      where.groupId = filters.groupId;
    }

    if (filters?.channelId) {
      where.channelId = filters.channelId;
    }

    if (filters?.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    // Ad filters
    if (filters?.cityId || filters?.categoryId) {
      where.Ad = {};
      if (filters.cityId) where.Ad.cityId = filters.cityId;
      if (filters.categoryId) where.Ad.categoryId = filters.categoryId;
    }

    const [items, total] = await Promise.all([
      prisma.distributionItem.findMany({
        where,
        include: {
          Ad: {
            include: {
              Category: true,
              City: true,
              Street: true,
              AdImage: {
                orderBy: { order: 'asc' },
                take: 1,
              },
            },
          },
          Group: true,
          Channel: true,
        },
        orderBy: [
          { Ad: { adNumber: 'desc' } },
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.distributionItem.count({ where }),
    ]);

    // Transform items to include message text from payloadSnapshot
    const transformedItems = items.map(item => ({
      ...item,
      message: item.payloadSnapshot ? (item.payloadSnapshot as any).messageText : '',
    }));

    return {
      items: transformedItems,
      total,
    };
  }
}

// Export singleton
export const distributionService = new WhatsAppDistributionService();
