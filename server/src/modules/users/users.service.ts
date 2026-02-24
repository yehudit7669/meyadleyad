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
        firstName: true,
        lastName: true,
        phone: true,
        phonePersonal: true,
        role: true,
        userType: true,
        serviceProviderType: true,
        avatar: true,
        companyName: true,
        businessName: true,
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

    console.log('✅ GET PROFILE - CURRENT USER ROLE:', user.role, 'userType:', user.userType, 'serviceProviderType:', user.serviceProviderType);

    return {
      ...user,
      emailVerified: user.isEmailVerified, // Alias for frontend
      isAdmin: user.role === 'ADMIN',
      isBroker: user.role === 'BROKER',
      isServiceProvider: user.userType === 'SERVICE_PROVIDER',
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

  /**
   * Get all brokers
   */
  async getBrokers(cityId?: string) {
    const where: any = {
      role: 'BROKER',
    };

    if (cityId) {
      where.brokerCityId = cityId;
    }

    const brokers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        BrokerCity: {
          select: {
            nameHe: true,
          },
        },
        brokerCityId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get BrokerOffice info for each broker
    const brokersWithOffice = await Promise.all(
      brokers.map(async (broker) => {
        const office = await prisma.brokerOffice.findUnique({
          where: { brokerOwnerUserId: broker.id },
          select: {
            businessName: true,
            logoUrlApproved: true,
            businessAddressApproved: true,
            publishOfficeAddress: true,
          },
        });

        return {
          id: broker.id,
          name: broker.name,
          businessName: office?.businessName || broker.name,
          logo: office?.logoUrlApproved || null,
          city: broker.BrokerCity?.nameHe || null,
          cityId: broker.brokerCityId,
          officeAddress: office?.publishOfficeAddress ? office.businessAddressApproved : null,
        };
      })
    );

    return brokersWithOffice;
  }

  /**
   * Get all service providers
   */
  async getServiceProviders(cityId?: string) {
    const where: any = {
      role: 'SERVICE_PROVIDER',  // Fixed: should be role, not userType
    };

    if (cityId) {
      where.brokerCityId = cityId;
    }

    const providers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        businessName: true,
        logoUrlPending: true,
        logoStatus: true,
        officeAddress: true,  // כתובת מאושרת
        BrokerCity: {
          select: {
            nameHe: true,
          },
        },
        brokerCityId: true,
        userType: true,
        serviceProviderType: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      businessName: provider.businessName || provider.name,
      logo: provider.logoStatus === 'APPROVED' ? provider.logoUrlPending : null,
      officeAddress: provider.officeAddress || null,  // הכתובת המאושרת
      city: provider.BrokerCity?.nameHe || null,
      cityId: provider.brokerCityId,
      serviceProviderType: provider.serviceProviderType,
    }));
  }
}

