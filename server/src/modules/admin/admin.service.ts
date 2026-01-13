import prisma from '../../config/database';
import { EmailService } from '../email/email.service';
import { AdStatus } from '@prisma/client';

export class AdminService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // טיפול ב-log פעולות אדמין
  private async logAdminAction(
    adminId: string,
    adId: string,
    action: string,
    fromStatus?: AdStatus,
    toStatus?: AdStatus,
    reason?: string
  ) {
    try {
      await prisma.adminAdLog.create({
        data: {
          adminId,
          adId,
          action,
          fromStatus,
          toStatus,
          reason,
        },
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  async getPendingAds(
    page: number = 1,
    limit: number = 20,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      cityId?: string;
      cityName?: string;
      publisher?: string;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = { status: 'PENDING' };

    // מסננים
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    if (filters?.cityId) {
      where.cityId = filters.cityId;
    }

    if (filters?.cityName) {
      where.City = {
        name: {
          contains: filters.cityName,
          mode: 'insensitive',
        },
      };
    }

    if (filters?.publisher) {
      where.User = {
        OR: [
          { name: { contains: filters.publisher, mode: 'insensitive' } },
          { email: { contains: filters.publisher, mode: 'insensitive' } },
          { phone: { contains: filters.publisher } },
        ],
      };
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
          Street: true,
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          AdImage: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.ad.count({ where }),
    ]);

    return {
      ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdById(adId: string) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        Category: true,
        City: true,
        Street: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            companyName: true,
          },
        },
        AdImage: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    return ad;
  }

  async approveAd(adId: string, adminId: string) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: { User: true, Category: true },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (ad.status !== 'PENDING') {
      throw new Error('Only pending ads can be approved');
    }

    // חישוב תאריך פקיעה (30 יום)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: 'ACTIVE',
        publishedAt: new Date(),
        expiresAt,
      },
      include: {
        User: true,
        Category: true,
      },
    });

    // רישום לוג
    await this.logAdminAction(
      adminId,
      adId,
      'APPROVE',
      'PENDING',
      'ACTIVE'
    );

    // שליחת מייל אישור (ללא PDF - המשתמש כבר קיבל PDF בזמן הפרסום)
    try {
      if (ad.User.isEmailVerified) {
        await this.emailService.sendAdApprovedEmail(
          ad.User.email,
          ad.title,
          ad.id
        );
        console.log('✅ Approval email sent', { adId: updatedAd.id });
      }
    } catch (error) {
      console.error('Failed to send approval email:', error);
    }

    return updatedAd;
  }

  async rejectAd(adId: string, reason: string, adminId: string) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    if (reason.length > 250) {
      throw new Error('Rejection reason must be 250 characters or less');
    }

    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: { User: true },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (ad.status !== 'PENDING') {
      throw new Error('Only pending ads can be rejected');
    }

    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: 'REJECTED',
        rejectedReason: reason,
      },
      include: {
        User: true,
      },
    });

    // רישום לוג
    await this.logAdminAction(
      adminId,
      adId,
      'REJECT',
      'PENDING',
      'REJECTED',
      reason
    );

    // שליחת מייל דחייה
    try {
      if (ad.User.isEmailVerified) {
        await this.emailService.sendAdRejectedEmail(
          ad.User.email,
          ad.title,
          reason
        );
      }
    } catch (error) {
      console.error('Failed to send rejection email:', error);
    }

    return updatedAd;
  }

  async getAllAds(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: AdStatus;
      search?: string;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
        { User: {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
              { phone: { contains: filters.search } },
            ],
          },
        },
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
          Street: true,
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
      }),
      prisma.ad.count({ where }),
    ]);

    return {
      ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateAdStatus(
    adId: string,
    status: AdStatus,
    adminId: string
  ) {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    const oldStatus = ad.status;

    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: { status },
      include: {
        User: true,
        Category: true,
        City: true,
      },
    });

    // רישום לוג
    await this.logAdminAction(
      adminId,
      adId,
      'STATUS_CHANGE',
      oldStatus,
      status
    );

    return updatedAd;
  }

  async deleteUserAds(userId: string) {
    const result = await prisma.ad.deleteMany({
      where: { userId },
    });

    return result;
  }

  async getStatistics() {
    const [
      totalUsers,
      totalAds,
      pendingAds,
      approvedAds,
      activeAds,
      totalCategories,
      totalCities,
      todayAds,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.ad.count(),
      prisma.ad.count({ where: { status: 'PENDING' } }),
      prisma.ad.count({ where: { status: { in: ['APPROVED', 'ACTIVE'] } } }),
      prisma.ad.count({ where: { status: 'ACTIVE' } }),
      prisma.category.count(),
      prisma.city.count(),
      prisma.ad.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const topCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { Ad: true },
        },
      },
      orderBy: {
        Ad: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      totalUsers,
      totalAds,
      pendingAds,
      approvedAds,
      activeAds,
      totalCategories,
      totalCities,
      todayAds,
      topCategories,
    };
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          companyName: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: { Ad: true },
          },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(userId: string, data: { isAdmin?: boolean; role?: string }) {
    // אם נשלח isAdmin, המר אותו ל-role
    const updateData: any = {};
    if (data.isAdmin !== undefined) {
      updateData.role = data.isAdmin ? 'ADMIN' : 'USER';
    }
    if (data.role) {
      updateData.role = data.role;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        companyName: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { Ad: true },
        },
      },
    });

    return user;
  }

  async deleteUser(userId: string) {
    // מחק קודם את כל המודעות של המשתמש
    await prisma.ad.deleteMany({
      where: { userId },
    });

    // מחק את המשתמש
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'המשתמש נמחק בהצלחה' };
  }
}
