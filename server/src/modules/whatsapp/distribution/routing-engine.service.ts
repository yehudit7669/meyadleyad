/**
 * WhatsApp Distribution Routing Engine
 * מנוע ההתאמה של מודעות לקבוצות/ערוצי הפצה
 */

import prisma from '../../../config/database';
import { Ad, WhatsAppGroup, DistributionChannel, WhatsAppGroupStatus, DistributionChannelStatus } from '@prisma/client';

export interface RoutingMatch {
  groupId: string;
  groupName: string;
  groupStatus?: string;
  channelId?: string;
  priority: number;
  reason: string;
}

export class RoutingEngineService {
  /**
   * מציאת כל הקבוצות הרלוונטיות למודעה
   */
  async findMatchingGroups(adId: string): Promise<RoutingMatch[]> {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: true,
        City: true,
      },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // Get all active groups
    const groups = await prisma.whatsAppGroup.findMany({
      where: {
        status: WhatsAppGroupStatus.ACTIVE,
      },
    });

    const matches: RoutingMatch[] = [];

    for (const group of groups) {
      const match = this.checkGroupMatch(ad, group);
      if (match) {
        matches.push({
          groupId: group.id,
          groupName: group.name,
          groupStatus: group.status,
          priority: match.priority,
          reason: match.reason,
        });
      }
    }

    // Sort by priority (higher first)
    matches.sort((a, b) => b.priority - a.priority);
    
    // Remove duplicates by groupId (safety check)
    const uniqueMatches = matches.filter((match, index, self) => 
      index === self.findIndex((m) => m.groupId === match.groupId)
    );
    
    if (uniqueMatches.length < matches.length) {
      console.warn(`⚠️ Removed ${matches.length - uniqueMatches.length} duplicate group matches`);
    }

    return uniqueMatches;
  }

  /**
   * בדיקה האם מודעה מתאימה לקבוצה
   */
  private checkGroupMatch(
    ad: Ad & { Category?: any; City?: any },
    group: WhatsAppGroup
  ): { priority: number; reason: string } | null {
    let priority = 0;
    const reasons: string[] = [];

    // Check city scopes
    if (group.cityScopes && ad.cityId) {
      const cityScopes = Array.isArray(group.cityScopes) 
        ? group.cityScopes 
        : (group.cityScopes as any);
      
      if (Array.isArray(cityScopes) && cityScopes.length > 0) {
        if (!cityScopes.includes(ad.cityId)) {
          return null; // City mismatch
        }
        priority += 10;
        reasons.push('city match');
      }
    }

    // Check region scopes (if cities not set)
    if (group.regionScopes && ad.City?.region) {
      const regionScopes = Array.isArray(group.regionScopes)
        ? group.regionScopes
        : (group.regionScopes as any);
      
      if (Array.isArray(regionScopes) && regionScopes.length > 0) {
        if (!regionScopes.includes(ad.City.region)) {
          return null; // Region mismatch
        }
        priority += 5;
        reasons.push('region match');
      }
    }

    // Check category scopes
    if (group.categoryScopes && ad.categoryId) {
      const categoryScopes = Array.isArray(group.categoryScopes)
        ? group.categoryScopes
        : (group.categoryScopes as any);
      
      if (Array.isArray(categoryScopes) && categoryScopes.length > 0) {
        if (!categoryScopes.includes(ad.categoryId)) {
          return null; // Category mismatch
        }
        priority += 10;
        reasons.push('category match');
      }
    }

    // If no scopes defined at all, group accepts all
    const hasCityScopes = group.cityScopes && Array.isArray(group.cityScopes) && group.cityScopes.length > 0;
    const hasRegionScopes = group.regionScopes && Array.isArray(group.regionScopes) && group.regionScopes.length > 0;
    const hasCategoryScopes = group.categoryScopes && Array.isArray(group.categoryScopes) && group.categoryScopes.length > 0;

    if (!hasCityScopes && !hasRegionScopes && !hasCategoryScopes) {
      priority += 1;
      reasons.push('accepts all');
    }

    if (priority > 0) {
      return {
        priority,
        reason: reasons.join(', '),
      };
    }

    return null;
  }

  /**
   * בדיקת מכסה יומית של קבוצה
   */
  async checkDailyQuota(groupId: string): Promise<{
    available: number;
    used: number;
    total: number;
    canSend: boolean;
  }> {
    const group = await prisma.whatsAppGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await prisma.distributionItem.count({
      where: {
        groupId,
        status: 'SENT',
        sentAt: {
          gte: today,
        },
      },
    });

    return {
      available: Math.max(0, group.dailyQuota - sentToday),
      used: sentToday,
      total: group.dailyQuota,
      canSend: sentToday < group.dailyQuota,
    };
  }

  /**
   * בחירת קבוצה מתוך רשימת התאמות לפי אסטרטגיה
   */
  async selectGroupByStrategy(
    matches: RoutingMatch[],
    strategy: 'ROUND_ROBIN' | 'LEAST_LOADED' | 'MANUAL' = 'LEAST_LOADED'
  ): Promise<RoutingMatch | null> {
    if (matches.length === 0) {
      return null;
    }

    // Filter by quota
    const availableMatches: Array<RoutingMatch & { quota: any }> = [];
    
    for (const match of matches) {
      const quota = await this.checkDailyQuota(match.groupId);
      if (quota.canSend) {
        availableMatches.push({ ...match, quota });
      }
    }

    if (availableMatches.length === 0) {
      return null; // All groups at quota
    }

    switch (strategy) {
      case 'ROUND_ROBIN':
        // Simple: return first available
        return availableMatches[0];

      case 'LEAST_LOADED':
        // Select group with most available quota
        availableMatches.sort((a, b) => b.quota.available - a.quota.available);
        return availableMatches[0];

      case 'MANUAL':
        // Return highest priority
        return availableMatches[0];

      default:
        return availableMatches[0];
    }
  }

  /**
   * קבלת סטטיסטיקת קבוצות היום
   */
  async getTodayGroupStats(): Promise<Array<{
    groupId: string;
    groupName: string;
    sent: number;
    pending: number;
    quota: number;
    available: number;
    utilizationPercent: number;
  }>> {
    const groups = await prisma.whatsAppGroup.findMany({
      where: {
        status: WhatsAppGroupStatus.ACTIVE,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Promise.all(
      groups.map(async (group) => {
        const [sent, pending] = await Promise.all([
          prisma.distributionItem.count({
            where: {
              groupId: group.id,
              status: 'SENT',
              sentAt: { gte: today },
            },
          }),
          prisma.distributionItem.count({
            where: {
              groupId: group.id,
              status: { in: ['PENDING', 'IN_PROGRESS'] },
            },
          }),
        ]);

        const available = Math.max(0, group.dailyQuota - sent);
        const utilizationPercent = group.dailyQuota > 0 
          ? Math.round((sent / group.dailyQuota) * 100) 
          : 0;

        return {
          groupId: group.id,
          groupName: group.name,
          sent,
          pending,
          quota: group.dailyQuota,
          available,
          utilizationPercent,
        };
      })
    );

    return stats.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
  }

  /**
   * בדיקה אם יש כפילות (האם כבר נוצר distribution item למודעה זו + קבוצה זו)
   */
  async checkDuplicate(adId: string, groupId: string): Promise<boolean> {
    const existing = await prisma.distributionItem.findUnique({
      where: {
        dedupeKey: `${adId}-${groupId}`,
      },
    });

    return !!existing;
  }

  /**
   * בדיקת מכסה עבור מספר קבוצות בבת אחת
   */
  async checkQuotasForGroups(groupIds: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const groupId of groupIds) {
      const quota = await this.checkDailyQuota(groupId);
      results.set(groupId, quota.canSend);
    }

    return results;
  }
}

// Export singleton
export const routingEngine = new RoutingEngineService();
