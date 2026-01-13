import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AuditService } from './audit.service';
import {
  updatePreferencesSchema,
  updatePersonalDetailsSchema,
  createAppointmentSchema,
  myAdsQuerySchema,
  favoritesQuerySchema,
} from './profile.schemas';

export class ProfileController {
  // ============ Preferences ============
  static async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      let preferences = await prisma.userPreference.findUnique({
        where: { userId },
      });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await prisma.userPreference.create({
          data: {
            userId,
            weeklyDigest: false,
            notifyNewMatches: false,
          },
        });
      }

      res.json({
        success: true,
        data: {
          weeklyDigest: preferences.weeklyDigest,
          notifyNewMatches: preferences.notifyNewMatches,
          filters: preferences.filters || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const input = updatePreferencesSchema.parse(req.body);

      const updateData: any = {};
      if (input.weeklyDigest !== undefined) updateData.weeklyDigest = input.weeklyDigest;
      if (input.notifyNewMatches !== undefined) updateData.notifyNewMatches = input.notifyNewMatches;
      if (input.filters !== undefined) updateData.filters = input.filters;

      const preferences = await prisma.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          ...updateData,
        },
        update: updateData,
      });

      await AuditService.log(userId, 'UPDATE_PREFS', { changes: updateData });

      res.json({
        success: true,
        data: preferences,
        message: 'העדפות עודכנו בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ My Ads ============
  static async getMyAds(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const query = myAdsQuerySchema.parse(req.query);
      
      const page = parseInt(query.page);
      const limit = parseInt(query.limit);
      const skip = (page - 1) * limit;

      const [ads, total] = await Promise.all([
        prisma.ad.findMany({
          where: { userId },
          include: {
            Category: { select: { nameHe: true } },
            City: { select: { nameHe: true } },
            Street: { select: { name: true } },
            AdImage: { select: { url: true, brandedUrl: true }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.ad.count({ where: { userId } }),
      ]);

      res.json({
        success: true,
        data: {
          ads: ads.map(ad => ({
            id: ad.id,
            adNumber: ad.adNumber,
            title: ad.title,
            category: ad.Category.nameHe,
            status: ad.status,
            views: ad.views,
            createdAt: ad.createdAt,
            price: ad.price,
            address: ad.address,
            cityName: ad.City?.nameHe,
            streetName: ad.Street?.name,
            imageUrl: ad.AdImage[0]?.brandedUrl || ad.AdImage[0]?.url,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMyAd(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.id;
      const { adId } = req.params;

      // Verify ownership
      const ad = await prisma.ad.findFirst({
        where: { id: adId, userId },
      });

      if (!ad) {
        return res.status(404).json({
          success: false,
          message: 'מודעה לא נמצאה או שאין לך הרשאה למחוק אותה',
        });
      }

      await prisma.ad.delete({ where: { id: adId } });
      await AuditService.log(userId, 'DELETE_AD', { adId, adNumber: ad.adNumber });

      return res.json({
        success: true,
        message: 'המודעה נמחקה בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Favorites ============
  static async getFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const query = favoritesQuerySchema.parse(req.query);
      const limit = parseInt(query.limit);

      const favorites = await prisma.favorite.findMany({
        where: { userId },
        include: {
          ad: {
            include: {
              Category: { select: { nameHe: true } },
              City: { select: { nameHe: true } },
              AdImage: { select: { url: true, brandedUrl: true }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      // Filter out ads that no longer exist or aren't ACTIVE
      const validFavorites = favorites.filter(
        (fav: any) => fav.ad && fav.ad.status === 'ACTIVE'
      );

      res.json({
        success: true,
        data: validFavorites.map((fav: any) => ({
          id: fav.id,
          adId: fav.ad.id,
          createdAt: fav.createdAt,
          ad: {
            id: fav.ad.id,
            adNumber: fav.ad.adNumber,
            title: fav.ad.title,
            description: fav.ad.description,
            price: fav.ad.price,
            views: fav.ad.views,
            createdAt: fav.ad.createdAt,
            category: { nameHe: fav.ad.Category.nameHe },
            city: { nameHe: fav.ad.City?.nameHe },
            images: fav.ad.AdImage.map((img: any) => ({ url: img.brandedUrl || img.url })),
            user: { email: '', name: '' }, // Not needed for favorites display
          },
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async addFavorite(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.id;
      const { adId } = req.body;

      // Check if ad exists
      const ad = await prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) {
        return res.status(404).json({
          success: false,
          message: 'מודעה לא נמצאה',
        });
      }

      // Check if already favorited
      const existing = await prisma.favorite.findUnique({
        where: { userId_adId: { userId, adId } },
      });

      if (existing) {
        return res.json({
          success: true,
          message: 'המודעה כבר במועדפים',
        });
      }

      await prisma.favorite.create({
        data: { userId, adId },
      });

      return res.json({
        success: true,
        message: 'המודעה נוספה למועדפים',
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { adId } = req.params;

      // Check if favorite exists before deleting
      const favorite = await prisma.favorite.findUnique({
        where: { userId_adId: { userId, adId } },
      });

      if (favorite) {
        await prisma.favorite.delete({
          where: { userId_adId: { userId, adId } },
        });
      }

      res.json({
        success: true,
        message: 'המודעה הוסרה מהמועדפים',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Personal Details ============
  static async getPersonalDetails(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatar: true,
          companyName: true,
          brokerLogoApproved: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'משתמש לא נמצא',
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePersonalDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const input = updatePersonalDetailsSchema.parse(req.body);

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.phone !== undefined) updateData.phone = input.phone;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
        },
      });

      await AuditService.log(userId, 'UPDATE_PROFILE', { changes: updateData });

      res.json({
        success: true,
        data: user,
        message: 'פרטים אישיים עודכנו בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Appointments ============
  static async getAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const appointments = await prisma.appointment.findMany({
        where: { userId },
        include: {
          ad: {
            select: {
              id: true,
              adNumber: true,
              title: true,
              address: true,
            },
          },
        },
        orderBy: { startsAt: 'desc' },
      });

      res.json({
        success: true,
        data: appointments.map(apt => ({
          id: apt.id,
          startsAt: apt.startsAt,
          status: apt.status,
          notes: apt.notes,
          ad: apt.ad,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async createAppointment(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.id;
      const input = createAppointmentSchema.parse(req.body);

      const ad = await prisma.ad.findUnique({ where: { id: input.adId } });
      if (!ad) {
        return res.status(404).json({
          success: false,
          message: 'מודעה לא נמצאה',
        });
      }

      const appointment = await prisma.appointment.create({
        data: {
          userId,
          adId: input.adId,
          startsAt: new Date(input.startsAt),
          notes: input.notes,
          status: 'PENDING',
        },
        include: {
          ad: { select: { id: true, adNumber: true, title: true } },
        },
      });

      return res.json({
        success: true,
        data: appointment,
        message: 'תיאום נקבע בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = (req as any).user.id;
      const { appointmentId } = req.params;

      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, userId },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'תיאום לא נמצא',
        });
      }

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELED' },
      });

      return res.json({
        success: true,
        message: 'התיאום בוטל בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Account Management ============
  static async requestAccountDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      await AuditService.log(userId, 'DELETE_REQ', {
        timestamp: new Date(),
        requestedBy: userId,
      });

      // TODO: Notify admins about deletion request
      // For now, just log it

      res.json({
        success: true,
        message: 'בקשת מחיקת חשבון נשלחה למנהלי המערכת',
      });
    } catch (error) {
      next(error);
    }
  }
}
