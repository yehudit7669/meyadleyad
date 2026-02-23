import { prisma } from '../../lib/prisma';
import { EmailService } from '../email/email.service';
import { logger } from '../../utils/logger';

const emailService = new EmailService();

interface AdFilters {
  categoryIds?: string[];
  cityIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: string[];
  publisherTypes?: string[]; // 'OWNER' | 'BROKER'
}

class NotificationsService {
  /**
   * Called when a new ad is published
   * Finds all matching users and sends notifications
   */
  async notifyNewAd(adId: string): Promise<void> {
    try {
      logger.info(`Starting notification process for ad: ${adId}`);

      // Fetch the ad with all relevant data
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
        include: {
          User: true,
          Category: true,
          City: true,
        },
      });

      if (!ad || ad.status !== 'ACTIVE') {
        logger.warn(`Ad ${adId} not found or not active`);
        return;
      }

      // Check global settings
      const globalSettings = await this.getGlobalSettings();
      if (!globalSettings.enabled) {
        logger.info('Global notifications are disabled');
      }

      // Get all users with active subscriptions
      const subscriptions = await prisma.userPreference.findMany({
        where: {
          notifyNewMatches: true,
        },
        include: {
          user: {
            include: {
              NotificationOverride: true,
            },
          },
        },
      });

      logger.info(`Found ${subscriptions.length} active subscriptions`);

      for (const subscription of subscriptions) {
        try {
          // Check if user is allowed to receive notifications
          const canReceive = await this.canUserReceiveNotification(
            subscription.user,
            globalSettings.enabled,
          );

          if (!canReceive) {
            logger.debug(
              `User ${subscription.userId} blocked from receiving notifications`,
            );
            continue;
          }

          // Check if ad matches user's filters
          const filters = subscription.filters as AdFilters | null;
          if (!this.doesAdMatchFilters(ad, filters)) {
            logger.debug(
              `Ad ${adId} doesn't match filters for user ${subscription.userId}`,
            );
            continue;
          }

          // Queue the notification (idempotency check)
          await this.queueNotification(subscription.userId, adId);
        } catch (error) {
          logger.error(
            `Error processing subscription for user ${subscription.userId}:`,
            error instanceof Error ? error : new Error(String(error)),
          );
          // Continue with next user
        }
      }

      logger.info(`Notification process completed for ad: ${adId}`);
    } catch (error) {
      logger.error(`Error in notifyNewAd for ${adId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Check if user can receive notification based on global settings and overrides
   */
  private async canUserReceiveNotification(
    user: any,
    globalEnabled: boolean,
  ): Promise<boolean> {
    const override = user.NotificationOverride;

    // No override - follow global setting
    if (!override) {
      return globalEnabled;
    }

    // Check if override has expired
    const now = new Date();
    if (override.expiresAt < now) {
      // Override expired, delete it
      await prisma.userNotificationOverride.delete({
        where: { id: override.id },
      });
      return globalEnabled;
    }

    // Override is active
    if (override.mode === 'ALLOW') {
      return true; // Allow even if global is disabled
    } else if (override.mode === 'BLOCK') {
      return false; // Block even if global is enabled
    }

    return globalEnabled;
  }

  /**
   * Check if ad matches user's filter criteria
   */
  private doesAdMatchFilters(ad: any, filters: AdFilters | null): boolean {
    if (!filters) {
      return true; // No filters = match all
    }

    // Check category
    if (
      filters.categoryIds &&
      filters.categoryIds.length > 0 &&
      !filters.categoryIds.includes(ad.categoryId)
    ) {
      return false;
    }

    // Check city
    if (
      filters.cityIds &&
      filters.cityIds.length > 0 &&
      ad.cityId &&
      !filters.cityIds.includes(ad.cityId)
    ) {
      return false;
    }

    // Check price range
    if (ad.price) {
      if (filters.minPrice && ad.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && ad.price > filters.maxPrice) {
        return false;
      }
    }

    // Check property type (from customFields, not adType)
    if (
      filters.propertyTypes &&
      filters.propertyTypes.length > 0 &&
      (ad.customFields as any)?.propertyType
    ) {
      const propertyType = (ad.customFields as any).propertyType;
      
      // Map Hebrew to English values
      const hebrewToEnglish: Record<string, string> = {
        'דירה': 'APARTMENT',
        'בית': 'HOUSE',
        'דופלקס': 'DUPLEX',
        'גן': 'GARDEN_APARTMENT',
        'פנטהאוז': 'PENTHOUSE',
        'סטודיו': 'STUDIO',
        'מגרש': 'LAND',
        'חנות': 'STORE',
        'משרד': 'OFFICE',
        'מחסן': 'WAREHOUSE',
      };
      
      // Check both Hebrew and English values
      const matchesFilter = filters.propertyTypes.some(filterType => {
        // Direct match (English to English)
        if (filterType === propertyType) return true;
        // Hebrew to English match
        if (hebrewToEnglish[filterType] === propertyType) return true;
        return false;
      });
      
      if (!matchesFilter) {
        return false;
      }
    }

    // Check publisher type
    if (filters.publisherTypes && filters.publisherTypes.length > 0) {
      const userType = ad.User.userType;
      const isBroker = userType === 'BROKER' || userType === 'AGENCY';
      const isOwner = !isBroker;

      const wantsBroker = filters.publisherTypes.includes('BROKER');
      const wantsOwner = filters.publisherTypes.includes('OWNER');

      if (isBroker && !wantsBroker) {
        return false;
      }
      if (isOwner && !wantsOwner) {
        return false;
      }
    }

    return true;
  }

  /**
   * Queue a notification for sending (with idempotency)
   */
  private async queueNotification(
    userId: string,
    adId: string,
  ): Promise<void> {
    try {
      // Try to create queue entry (unique constraint prevents duplicates)
      const queue = await prisma.notificationQueue.create({
        data: {
          userId,
          adId,
          status: 'PENDING',
        },
      });

      // Send the email immediately
      await this.sendNotificationEmail(queue.id);
    } catch (error: any) {
      // P2002 = unique constraint violation = already queued
      if (error.code === 'P2002') {
        logger.debug(
          `Notification already queued for user ${userId} and ad ${adId}`,
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Send the actual notification email
   */
  private async sendNotificationEmail(queueId: string): Promise<void> {
    try {
      const queue = await prisma.notificationQueue.findUnique({
        where: { id: queueId },
        include: {
          user: true,
          ad: {
            include: {
              Category: true,
              City: true,
              AdImage: {
                take: 1,
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!queue || queue.status === 'SENT') {
        return;
      }

      const { user, ad } = queue;

      // Translation maps
      const adTypeToHebrew: Record<string, string> = {
        'FOR_SALE': 'למכירה',
        'FOR_RENT': 'להשכרה',
        'WANTED_FOR_SALE': 'מחפש לקנות',
        'WANTED_FOR_RENT': 'מחפש להשכיר',
        'WANTED_HOLIDAY': 'מחפש נופש',
        'WANTED_COMMERCIAL': 'מחפש מסחרי',
      };

      const propertyTypeToHebrew: Record<string, string> = {
        'APARTMENT': 'דירה',
        'HOUSE': 'בית פרטי',
        'GARDEN_APARTMENT': 'דירת גן',
        'PENTHOUSE': 'פנטהאוז',
        'DUPLEX': 'דופלקס',
        'STUDIO': 'סטודיו',
        'LAND': 'מגרש',
        'STORE': 'חנות',
        'OFFICE': 'משרד',
        'WAREHOUSE': 'מחסן',
      };

      // Prepare email content
      const adUrl = `${process.env.CLIENT_URL}/ads/${ad.id}`;
      const categoryName = ad.Category.nameHe || ad.Category.name;
      const cityName = ad.City?.nameHe || ad.City?.name || 'לא צוין';
      const price = ad.price ? `₪${ad.price.toLocaleString()}` : '';
      const imageUrl = ad.AdImage[0]?.url || '';
      const adTypeHebrew = ad.adType ? adTypeToHebrew[ad.adType] || ad.adType : '';
      const propertyType = (ad.customFields as any)?.propertyType;
      const propertyTypeHebrew = propertyType ? propertyTypeToHebrew[propertyType] || propertyType : '';

      const emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">נכס חדש התפרסם!</h2>
          
          ${imageUrl ? `<img src="${imageUrl}" alt="${ad.title}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;">` : ''}
          
          <h3>${ad.title}</h3>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>קטגוריה:</strong> ${categoryName}</p>
            <p><strong>עיר:</strong> ${cityName}</p>
            <p><strong>מחיר:</strong> ${price}</p>
            ${adTypeHebrew ? `<p><strong>סוג מודעה:</strong> ${adTypeHebrew}</p>` : ''}
            ${propertyTypeHebrew ? `<p><strong>סוג נכס:</strong> ${propertyTypeHebrew}</p>` : ''}
          </div>
          
          <div style="margin: 20px 0;">
            <p>${ad.description.substring(0, 200)}${ad.description.length > 200 ? '...' : ''}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adUrl}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              צפה בנכס
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            קיבלת מייל זה כי הפעלת התראות על נכסים חדשים.
            <br>
            <a href="${process.env.CLIENT_URL}/profile" style="color: #2563eb;">לניהול ההגדרות שלך</a>
          </p>
        </div>
      `;

      // Send email using the emailService
      await emailService.sendEmail(
        user.email,
        `נכס חדש: ${ad.title}`,
        emailHtml,
      );

      // Mark as sent
      await prisma.notificationQueue.update({
        where: { id: queueId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      logger.info(
        `Notification sent successfully to ${user.email} for ad ${ad.id}`,
      );
    } catch (error) {
      logger.error(`Error sending notification ${queueId}:`, error instanceof Error ? error : new Error(String(error)));

      // Mark as failed
      await prisma.notificationQueue.update({
        where: { id: queueId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: { increment: 1 },
        },
      });
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(maxRetries = 3): Promise<number> {
    const failed = await prisma.notificationQueue.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lt: maxRetries },
      },
      take: 50, // Process in batches
    });

    let successCount = 0;
    for (const notification of failed) {
      try {
        await this.sendNotificationEmail(notification.id);
        successCount++;
      } catch (error) {
        logger.error(
          `Retry failed for notification ${notification.id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    return successCount;
  }

  /**
   * Get or create global settings
   */
  async getGlobalSettings() {
    let settings = await prisma.notificationSettings.findFirst();

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { enabled: true },
      });
    }

    return settings;
  }

  /**
   * Update global settings (admin only)
   */
  async updateGlobalSettings(enabled: boolean) {
    const settings = await this.getGlobalSettings();
    return prisma.notificationSettings.update({
      where: { id: settings.id },
      data: { enabled },
    });
  }

  /**
   * Create or update user override by email (admin only)
   */
  async setUserOverrideByEmail(
    email: string,
    mode: 'ALLOW' | 'BLOCK',
    expiresAt: Date,
    reason?: string,
  ) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new Error(`משתמש עם אימייל ${email} לא נמצא במערכת`);
    }

    // Create or update override
    return prisma.userNotificationOverride.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        mode,
        expiresAt,
        reason,
      },
      update: {
        mode,
        expiresAt,
        reason,
      },
    });
  }

  /**
   * Create or update user override (admin only)
   */
  async setUserOverride(
    userId: string,
    mode: 'ALLOW' | 'BLOCK',
    expiresAt: Date,
    reason?: string,
  ) {
    return prisma.userNotificationOverride.upsert({
      where: { userId },
      create: {
        userId,
        mode,
        expiresAt,
        reason,
      },
      update: {
        mode,
        expiresAt,
        reason,
      },
    });
  }

  /**
   * Remove user override
   */
  async removeUserOverride(userId: string) {
    return prisma.userNotificationOverride.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get user override if exists and not expired
   */
  async getUserOverride(userId: string) {
    const override = await prisma.userNotificationOverride.findUnique({
      where: { userId },
    });

    if (!override) return null;

    // Check expiration
    if (override.expiresAt < new Date()) {
      await prisma.userNotificationOverride.delete({
        where: { id: override.id },
      });
      return null;
    }

    return override;
  }

  /**
   * Get user notification status (for UI display)
   */
  async getUserNotificationStatus(userId: string) {
    const globalSettings = await this.getGlobalSettings();
    const override = await this.getUserOverride(userId);

    let canReceive = globalSettings.enabled;
    let isBlocked = false;
    let blockReason = null;

    if (override) {
      if (override.mode === 'BLOCK') {
        canReceive = false;
        isBlocked = true;
        blockReason = override.reason || 'חסום על ידי מנהל המערכת';
      } else if (override.mode === 'ALLOW') {
        canReceive = true;
      }
    }

    return {
      canReceive,
      isBlocked,
      blockReason,
      globalEnabled: globalSettings.enabled,
      override,
    };
  }
}

export const notificationsService = new NotificationsService();
