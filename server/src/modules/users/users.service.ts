import prisma from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class UsersService {
  async getProfile(userId: string) {
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
        licenseNumber: true,
        description: true,
        website: true,
        createdAt: true,
        isEmailVerified: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...user,
      emailVerified: user.isEmailVerified, // Alias for frontend
      isAdmin: user.role === 'ADMIN',
      isBroker: user.role === 'BROKER',
    };
  }

  async updateProfile(userId: string, data: Partial<{
    name: string;
    phone: string;
    avatar: string;
    companyName: string;
    licenseNumber: string;
    description: string;
    website: string;
  }>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        companyName: true,
        licenseNumber: true,
        description: true,
        website: true,
      },
    });

    return user;
  }

  async getUserAds(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Category: true,
          City: true,
          AdImage: {
            take: 5,
            orderBy: { order: 'asc' },
            select: {
              id: true,
              url: true,
              order: true,
            },
          },
        },
      }),
      prisma.ad.count({ where: { userId } }),
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

  async getBrokerProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        avatar: true,
        companyName: true,
        licenseNumber: true,
        description: true,
        website: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role !== 'BROKER') {
      throw new NotFoundError('User is not a broker');
    }

    const ads = await prisma.ad.findMany({
      where: {
        userId,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        Category: true,
        City: true,
        AdImage: {
          take: 1,
          orderBy: { order: 'asc' },
        },
      },
    });

    return {
      ...user,
      ads,
    };
  }
}
