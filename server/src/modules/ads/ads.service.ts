import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { AdStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { PDFService } from '../pdf/pdf.service';
import { config } from '../../config';
import { v4 as uuidv4 } from 'uuid';
import { emailPermissionsService } from '../admin/email-permissions.service';
import { notificationsService } from '../notifications/notifications.service';

export class AdsService {
  private emailService: EmailService;
  private whatsappService: WhatsAppService;
  private pdfService: PDFService;

  constructor() {
    this.emailService = new EmailService();
    this.whatsappService = new WhatsAppService();
    this.pdfService = new PDFService();
  }
  async createAd(userId: string, data: {
    title: string;
    description: string;
    price?: number;
    categoryId: string;
    cityId?: string;
    streetId?: string;
    houseNumber?: number;
    address?: string;
    latitude?: number;
    longitude?: number;
    customFields?: Record<string, any>;
    contactName?: string;
    contactPhone: string;
    adType?: string;
    requestedLocationText?: string;
    sendCopyToEmail?: boolean;
  }) {
    console.log('ADS SERVICE - Creating ad', {
      userId,
      categoryId: data.categoryId,
      adType: data.adType,
      isWanted: this.isWantedAd(data.adType),
      title: data.title,
      sendCopyToEmail: data.sendCopyToEmail,
    });

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    
    if (!category) {
      console.error('ADS SERVICE - Category not found', { categoryId: data.categoryId });
      throw new NotFoundError('הקטגוריה שנבחרה לא קיימת במערכת');
    }

    // Check if this is a wanted ad
    const isWanted = this.isWantedAd(data.adType);

    if (isWanted) {
      // For wanted ads: no validation of cityId/streetId/houseNumber
      return this.createWantedAd(userId, data);
    } else {
      // For regular property ads: validate city/street/houseNumber
      return this.createRegularAd(userId, data);
    }
  }

  private isWantedAd(adType?: string): boolean {
    const wantedTypes = ['WANTED_FOR_SALE', 'WANTED_FOR_RENT', 'WANTED_HOLIDAY', 'WANTED_COMMERCIAL'];
    return adType ? wantedTypes.includes(adType) : false;
  }

  private async createWantedAd(userId: string, data: any) {
    console.log('ADS SERVICE - Creating WANTED ad', {
      userId,
      requestedLocationText: data.requestedLocationText,
      adType: data.adType,
    });

    // Get user to check role and email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    });

    // Auto-approve for ADMIN and SUPER_ADMIN
    const isAdminOrSuperAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    
    // Check if user has special permission to publish without approval
    const hasPublishPermission = user?.email 
      ? await emailPermissionsService.hasPermission(user.email, 'publish_without_approval')
      : false;
    
    const shouldAutoApprove = isAdminOrSuperAdmin || hasPublishPermission;
    const adStatus = shouldAutoApprove ? AdStatus.ACTIVE : AdStatus.PENDING;

    console.log('ADS SERVICE - Auto-approve check:', {
      userEmail: user?.email,
      isAdminOrSuperAdmin,
      hasPublishPermission,
      shouldAutoApprove
    });

    // Prepare customFields with contact info and wanted-specific data
    const finalCustomFields = {
      ...data.customFields,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      adType: data.adType,
      isWanted: true,
    };

    try {
      const ad = await prisma.ad.create({
        data: {
          id: uuidv4(),
          title: data.title,
          description: data.description,
          price: data.price,
          adType: data.adType, // Include adType for wanted ads
          categoryId: data.categoryId,
          userId,
          isWanted: true,
          requestedLocationText: data.requestedLocationText,
          address: data.requestedLocationText, // For display purposes
          customFields: finalCustomFields,
          status: adStatus,
          publishedAt: shouldAutoApprove ? new Date() : null,
          updatedAt: new Date(),
        },
        include: {
          Category: true,
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      });

      console.log('ADS SERVICE - WANTED ad created successfully', {
        adId: ad.id,
        adNumber: ad.adNumber,
      });

      // If auto-approved, trigger notifications
      if (ad.status === AdStatus.ACTIVE) {
        try {
          await notificationsService.notifyNewAd(ad.id);
          console.log('ADS SERVICE - Notifications sent for new ACTIVE wanted ad', { adId: ad.id });
        } catch (notifError) {
          console.error('ADS SERVICE - Failed to send notifications for wanted ad', {
            adId: ad.id,
            error: notifError instanceof Error ? notifError.message : String(notifError)
          });
        }

        // ✅ הוספה ללוח מודעות עבור מודעות מבוקש שאושרו אוטומטית
        // Note: WANTED ads don't have a specific city, so we can't add them to newspaper sheets
        // Only regular ads with cityId can be added to newspaper sheets
        console.log('ADS SERVICE - WANTED ads are not added to newspaper sheets (no specific cityId)');
      }

      // Note: Email will be sent after images are uploaded
      // Wanted ads can have optional images

      return this.transformAdForResponse(ad);
    } catch (error) {
      console.error('ADS SERVICE - Error creating wanted ad in DB', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async createRegularAd(userId: string, data: any) {
    console.log('ADS SERVICE - Creating REGULAR property ad');

    // Validate required fields for regular ads
    if (!data.cityId || !data.streetId || !data.houseNumber) {
      throw new NotFoundError('עבור מודעת נכס נדרשים: עיר, רחוב ומספר בית');
    }

    // Validate city exists
    const city = await prisma.city.findUnique({
      where: { id: data.cityId },
    });
    
    if (!city) {
      console.error('ADS SERVICE - City not found', { cityId: data.cityId });
      throw new NotFoundError('העיר שנבחרה לא קיימת במערכת');
    }

    // Validate street exists and get neighborhood
    const street = await prisma.street.findUnique({
      where: { id: data.streetId },
      include: {
        Neighborhood: true,
      },
    });
    
    if (!street) {
      console.error('ADS SERVICE - Street not found', { streetId: data.streetId });
      throw new NotFoundError('הרחוב שנבחר לא קיים במערכת');
    }

    // Verify street belongs to the selected city
    if (street.cityId !== data.cityId) {
      throw new NotFoundError('הרחוב לא שייך לעיר שנבחרה');
    }

    console.log('ADS SERVICE - Validation passed, creating regular ad in DB');

    // Get user to check role and email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    });

    // Auto-approve for ADMIN and SUPER_ADMIN
    const isAdminOrSuperAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    
    // Check if user has special permission to publish without approval
    const hasPublishPermission = user?.email 
      ? await emailPermissionsService.hasPermission(user.email, 'publish_without_approval')
      : false;
    
    const shouldAutoApprove = isAdminOrSuperAdmin || hasPublishPermission;
    const adStatus = shouldAutoApprove ? AdStatus.ACTIVE : AdStatus.PENDING;

    console.log('ADS SERVICE - Auto-approve check:', {
      userEmail: user?.email,
      isAdminOrSuperAdmin,
      hasPublishPermission,
      shouldAutoApprove
    });

    // Prepare customFields with contact info
    const finalCustomFields = {
      ...data.customFields,
      houseNumber: data.houseNumber,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
    };

    try {
      const ad = await prisma.ad.create({
        data: {
          id: uuidv4(),
          title: data.title,
          description: data.description,
          price: data.price,
          adType: data.adType, // Include adType for regular ads
          categoryId: data.categoryId,
          cityId: data.cityId,
          streetId: data.streetId,
          neighborhood: street.Neighborhood?.name || null,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          customFields: finalCustomFields,
          userId,
          status: adStatus,
          publishedAt: shouldAutoApprove ? new Date() : null,
          updatedAt: new Date(),
        },
        include: {
          Category: true,
          City: true,
          Street: {
            include: {
              Neighborhood: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              companyName: true,
              isEmailVerified: true,
            },
          },
        },
      });
      
      console.log('ADS SERVICE - Ad created successfully', { 
        adId: ad.id,
        adNumber: ad.adNumber,
        neighborhood: ad.neighborhood 
      });
      
      // If auto-approved, trigger notifications
      if (ad.status === AdStatus.ACTIVE) {
        try {
          await notificationsService.notifyNewAd(ad.id);
          console.log('ADS SERVICE - Notifications sent for new ACTIVE regular ad', { adId: ad.id });
        } catch (notifError) {
          console.error('ADS SERVICE - Failed to send notifications for regular ad', {
            adId: ad.id,
            error: notifError instanceof Error ? notifError.message : String(notifError)
          });
        }

        // ✅ הוספה ללוח מודעות עבור נכסים שאושרו אוטומטית
        try {
          if (ad.cityId) {
            console.log(`📰 Adding auto-approved ad ${ad.id} to newspaper sheet...`);
            
            const { newspaperSheetService } = await import('../newspaper-sheets/newspaper-sheet.service.js');
            
            // קבלת או יצירת גיליון פעיל
            const sheet = await newspaperSheetService.getOrCreateActiveSheet(
              ad.categoryId,
              ad.cityId,
              userId
            );

            console.log(`📋 Sheet found/created:`, { sheetId: sheet.id, title: sheet.title });

            // הוספת המודעה לגיליון
            await newspaperSheetService.addListingToSheet(
              sheet.id,
              ad.id,
              userId
            );

            console.log(`✅ Ad ${ad.id} added to newspaper sheet ${sheet.id}`);

            // יצירת PDF לגיליון
            console.log(`📄 Generating PDF for sheet ${sheet.id}...`);
            const pdfResult = await newspaperSheetService.generateSheetPDF(sheet.id, userId);
            console.log(`✅ PDF generated: ${pdfResult.pdfPath} (version ${pdfResult.version})`);
          }
        } catch (newspaperError) {
          console.error('❌ Failed to add ad to newspaper sheet:', newspaperError);
          // לא לזרוק שגיאה - כשלון בהוספה לגיליון לא צריך לחסום את היצירה
        }
      }
      
      // Note: Do NOT send email here - images haven't been uploaded yet
      // Email will be sent after images are uploaded via uploadImages endpoint

      // If auto-approved (for admins/brokers), send to WhatsApp group
      if (ad.status === AdStatus.APPROVED) {
        this.sendToWhatsAppGroup(ad)
          .catch(error => console.error('Failed to send to WhatsApp:', error));
      }
      
      return this.transformAdForResponse(ad);
    } catch (prismaError: any) {
      console.error('ADS SERVICE - Prisma error', {
        error: prismaError.message,
        code: prismaError.code,
      });
      
      // Handle specific Prisma errors
      if (prismaError.code === 'P2003') {
        throw new NotFoundError('קטגוריה, עיר או רחוב לא תקינים');
      }
      
      throw prismaError;
    }
  }

  private async sendToWhatsAppGroup(ad: any) {
    try {
      const whatsappGroup = await prisma.whatsAppGroup.findUnique({
        where: { categoryId: ad.categoryId },
      });

      if (whatsappGroup && whatsappGroup.isActive) {
        const adUrl = `${config.clientUrl}/ads/${ad.id}`;
        await this.whatsappService.sendAdToGroup(whatsappGroup.groupId, {
          title: ad.title,
          description: ad.description,
          price: ad.price,
          category: ad.Category.nameHe,
          city: ad.City?.nameHe,
          url: adUrl,
        });
      }
    } catch (error) {
      console.error('Failed to send ad to WhatsApp group:', error);
    }
  }

  /**
   * Handle sending ad copy with PDF via email
   * This function is non-blocking and logs all attempts
   */
  private async handleAdCopyEmail(ad: any, sendCopyToEmail?: boolean) {
    // Default to true if not specified
    const shouldSend = sendCopyToEmail !== false;

    if (!shouldSend) {
      console.log('ADS SERVICE - Skipping ad copy email (user opted out)', { adId: ad.id });
      return;
    }

    const user = ad.User;

    // Validate user has email and it's verified
    if (!user.email) {
      console.log('ADS SERVICE - Skipping ad copy email (no email)', { adId: ad.id, userId: user.id });
      await this.logEmailAttempt({
        userId: user.id,
        adId: ad.id,
        type: 'AD_PUBLISHED_COPY',
        status: 'FAILED',
        recipientEmail: 'N/A',
        errorMessage: 'User has no email address',
      });
      return;
    }

    if (!user.isEmailVerified) {
      console.log('ADS SERVICE - Skipping ad copy email (email not verified)', {
        adId: ad.id,
        userId: user.id,
        email: user.email,
      });
      await this.logEmailAttempt({
        userId: user.id,
        adId: ad.id,
        type: 'AD_PUBLISHED_COPY',
        status: 'FAILED',
        recipientEmail: user.email,
        errorMessage: 'Email address not verified',
      });
      return;
    }

    // Attempt to generate PDF and send email
    try {
      console.log('ADS SERVICE - Generating PDF for ad copy email', { adId: ad.id });
      const pdfBuffer = await this.pdfService.generateAdPDFById(ad.id);

      console.log('ADS SERVICE - Sending ad copy email with PDF', {
        adId: ad.id,
        email: user.email,
      });
      await this.emailService.sendAdCopyEmail(user.email, ad, pdfBuffer);

      // Log success
      await this.logEmailAttempt({
        userId: user.id,
        adId: ad.id,
        type: 'AD_PUBLISHED_COPY',
        status: 'SUCCESS',
        recipientEmail: user.email,
      });

      console.log('✅ ADS SERVICE - Ad copy email sent successfully', {
        adId: ad.id,
        email: user.email,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ ADS SERVICE - Failed to send ad copy email', {
        adId: ad.id,
        email: user.email,
        error: errorMessage,
      });

      // Log failure
      await this.logEmailAttempt({
        userId: user.id,
        adId: ad.id,
        type: 'AD_PUBLISHED_COPY',
        status: 'FAILED',
        recipientEmail: user.email,
        errorMessage,
      });

      // Don't throw - we don't want to block ad creation
    }
  }

  /**
   * Log email sending attempt to database
   */
  private async logEmailAttempt(data: {
    userId: string;
    adId: string;
    type: 'AD_PUBLISHED_COPY' | 'AD_APPROVED' | 'AD_REJECTED' | 'VERIFICATION' | 'PASSWORD_RESET';
    status: 'SUCCESS' | 'FAILED';
    recipientEmail: string;
    errorMessage?: string;
  }) {
    try {
      await prisma.emailLog.create({
        data: {
          userId: data.userId,
          adId: data.adId,
          type: data.type,
          status: data.status,
          recipientEmail: data.recipientEmail,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      console.error('Failed to log email attempt:', error);
      // Don't throw - logging failure shouldn't break the flow
    }
  }

  async updateAd(adId: string, userId: string, userRole: string, data: Partial<{
    title: string;
    description?: string;
    price?: number;
    categoryId: string;
    adType?: string;
    cityId: string;
    streetId: string;
    houseNumber: number;
    address?: string;
    latitude?: number;
    longitude?: number;
    customFields?: Record<string, any>;
    contactName?: string;
    contactPhone?: string;
    images?: Array<{ url: string; order: number }>;
  }>) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: true,
        City: true,
        Street: {
          include: {
            Neighborhood: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        AdImage: true,
      },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    if (ad.userId !== userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError('You do not have permission to update this ad');
    }

    // If streetId is being updated, fetch the neighborhood
    let neighborhood = ad.neighborhood;
    if (data.streetId) {
      const street = await prisma.street.findUnique({
        where: { id: data.streetId },
        include: {
          Neighborhood: true,
        },
      });
      
      if (!street) {
        throw new NotFoundError('הרחוב שנבחר לא קיים במערכת');
      }
      
      neighborhood = street.Neighborhood?.name || null;
    }

    // אם המשתמש הוא מנהל - מעדכן ישירות
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      const updatedAd = await prisma.ad.update({
        where: { id: adId },
        data: {
          ...data,
          neighborhood,
        },
        include: {
          Category: true,
          City: true,
          Street: {
            include: {
              Neighborhood: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          AdImage: true,
        },
      });

      return this.transformAdForResponse(updatedAd);
    }

    // אם המשתמש רגיל ומודעה מאושרת - שומר שינויים בהמתנה
    if (ad.status === AdStatus.ACTIVE) {
      const pendingChanges = {
        ...data,
        neighborhood,
        requestedAt: new Date().toISOString(),
        requestedBy: userId,
      };

      const updatedAd = await prisma.ad.update({
        where: { id: adId },
        data: {
          hasPendingChanges: true,
          pendingChanges: pendingChanges,
          pendingChangesAt: new Date(),
        },
        include: {
          Category: true,
          City: true,
          Street: {
            include: {
              Neighborhood: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          AdImage: true,
        },
      });

      console.log(`✅ User ${userId} requested changes for ad ${adId}. Changes pending admin approval.`);
      
      return this.transformAdForResponse(updatedAd);
    }

    // אם המודעה לא מאושרת (PENDING/REJECTED) - מעדכן ישירות
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        ...data,
        neighborhood,
      },
      include: {
        Category: true,
        City: true,
        Street: {
          include: {
            Neighborhood: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        AdImage: true,
      },
    });

    return this.transformAdForResponse(updatedAd);
  }

  async deleteAd(adId: string, userId: string, userRole: string) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    if (ad.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this ad');
    }

    // ✅ הסרה מגיליונות עיתון ועדכון/מחיקת גיליונות
    const sheetsToUpdate: string[] = [];
    const sheetsToDelete: string[] = [];
    
    try {
      // מציאת כל הגיליונות שמכילים את הנכס הזה
      const sheetListings = await prisma.newspaperSheetListing.findMany({
        where: { listingId: adId },
        select: { 
          sheetId: true,
          sheet: {
            select: {
              id: true,
              _count: {
                select: { listings: true }
              }
            }
          }
        }
      });

      console.log(`🗑️ Processing ad ${adId} removal from ${sheetListings.length} newspaper sheet(s)...`);

      // בדיקה לכל גיליון: האם יש עוד נכסים או שזה הנכס היחיד
      for (const sheetListing of sheetListings) {
        const listingsCount = sheetListing.sheet._count.listings;
        
        if (listingsCount === 1) {
          // זה הנכס היחיד - נמחק את הגיליון כולו
          sheetsToDelete.push(sheetListing.sheetId);
          console.log(`📋 Sheet ${sheetListing.sheetId} will be deleted (last listing)`);
        } else {
          // יש עוד נכסים - רק נעדכן PDF
          sheetsToUpdate.push(sheetListing.sheetId);
          console.log(`📋 Sheet ${sheetListing.sheetId} will be updated (${listingsCount - 1} listings remaining)`);
        }
      }

      // מחיקת הנכס עצמו - ה-Cascade ידאג למחיקה מ-NewspaperSheetListing
      await prisma.ad.delete({
        where: { id: adId },
      });

      console.log(`✅ Ad ${adId} deleted successfully`);

      // מחיקת גיליונות שנשארו ריקים
      if (sheetsToDelete.length > 0) {
        await prisma.newspaperSheet.deleteMany({
          where: { id: { in: sheetsToDelete } }
        });
        console.log(`✅ Deleted ${sheetsToDelete.length} empty newspaper sheet(s)`);
      }

      // עדכון PDF לגיליונות שנשארו עם נכסים
      if (sheetsToUpdate.length > 0) {
        const { newspaperSheetService } = await import('../newspaper-sheets/newspaper-sheet.service.js');
        
        for (const sheetId of sheetsToUpdate) {
          try {
            console.log(`📄 Regenerating PDF for sheet ${sheetId}...`);
            await newspaperSheetService.generateSheetPDF(sheetId, userId, true);
            console.log(`✅ PDF regenerated for sheet ${sheetId}`);
          } catch (pdfError) {
            console.error(`❌ Failed to regenerate PDF for sheet ${sheetId}:`, pdfError);
            // ממשיכים לגיליון הבא
          }
        }
      }

    } catch (error) {
      console.error('❌ Failed to process newspaper sheets:', error);
      throw error; // זורקים את השגיאה כדי שהמחיקה לא תצליח אם יש בעיה
    }
  }

  async getAd(adId: string, incrementView: boolean = true) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: true,
        City: true,
        Street: {
          include: {
            Neighborhood: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            companyName: true,
            avatar: true,
          },
        },
        AdImage: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    if (incrementView) {
      await prisma.ad.update({
        where: { id: adId },
        data: { views: { increment: 1 } },
      });
    }

    return this.transformAdForResponse(ad);
  }

  async getAds(filters: {
    page?: number;
    limit?: number;
    categoryId?: string;
    cityId?: string;
    cities?: string; // Comma-separated city slugs
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    userId?: string;
    status?: AdStatus;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    // Handle multiple cities filter
    if (filters.cities) {
      const citySlugs = filters.cities.split(',').map(s => s.trim()).filter(Boolean);
      if (citySlugs.length > 0) {
        // First get all city IDs from slugs
        const cities = await prisma.city.findMany({
          where: {
            slug: { in: citySlugs }
          },
          select: { id: true }
        });
        
        const cityIds = cities.map(c => c.id);
        if (cityIds.length > 0) {
          where.cityId = { in: cityIds };
        }
      }
    } else if (filters.cityId) {
      // Single city filter (backward compatibility)
      where.cityId = filters.cityId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    } else {
      // Default to approved/active ads for public listing
      where.status = { in: [AdStatus.APPROVED, AdStatus.ACTIVE] };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
        { neighborhood: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Category: true,
          City: true,
          Street: {
            include: {
              Neighborhood: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              companyName: true,
            },
          },
          AdImage: {
            take: 1,
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.ad.count({ where }),
    ]);

    return {
      ads: ads.map(ad => this.transformAdForResponse(ad)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addImages(
    adId: string,
    userId: string,
    images: Array<{
      url: string;
      originalUrl?: string;
      brandedUrl?: string | null;
      order: number;
    }>
  ) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    if (ad.userId !== userId) {
      throw new ForbiddenError('You do not have permission to add images to this ad');
    }

    await prisma.adImage.createMany({
      data: images.map(img => ({
        id: uuidv4(),
        adId,
        url: img.url,
        originalUrl: img.originalUrl || img.url,
        brandedUrl: img.brandedUrl,
        order: img.order,
      })),
    });

    console.log('ADS SERVICE - Images uploaded successfully', { 
      adId,
      imageCount: images.length 
    });

    // Now that images are uploaded, send the ad copy email with PDF
    const fullAd = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isEmailVerified: true,
          },
        },
      },
    });

    if (fullAd) {
      // Send email after images are uploaded (non-blocking)
      this.handleAdCopyEmail(fullAd, true).catch(err =>
        console.error('Failed to send ad copy email after image upload:', err)
      );
    }

    return this.getAd(adId, false);
  }

  async deleteImage(imageId: string, userId: string) {
    const image = await prisma.adImage.findUnique({
      where: { id: imageId },
      include: { Ad: true },
    });

    if (!image) {
      throw new NotFoundError('Image not found');
    }

    if (image.Ad.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this image');
    }

    await prisma.adImage.delete({
      where: { id: imageId },
    });
  }

  async incrementContactClick(adId: string) {
    await prisma.ad.update({
      where: { id: adId },
      data: { contactClicks: { increment: 1 } },
    });
  }

  /**
   * Transform Prisma PascalCase relations to camelCase for API responses
   */
  private transformAdForResponse(ad: any): any {
    return {
      ...ad,
      category: ad.Category,
      city: ad.City,
      street: ad.Street,
      user: ad.User,
      images: ad.AdImage,
      // Remove PascalCase versions
      Category: undefined,
      City: undefined,
      Street: undefined,
      User: undefined,
      AdImage: undefined,
    };
  }
}
