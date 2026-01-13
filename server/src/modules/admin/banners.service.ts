import prisma from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { v4 as uuidv4 } from 'uuid';

interface CreateBannerData {
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  position: string;
  order?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

interface UpdateBannerData {
  title?: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  position?: string;
  order?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

interface BannerFilters {
  position?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class BannersService {
  async createBanner(data: CreateBannerData) {
    const banner = await prisma.bannerAd.create({
      data: {
        id: uuidv4(),
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        link: data.link || null,
        position: data.position,
        order: data.order || 0,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return banner;
  }

  async getBanners(filters: BannerFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (filters.position) {
      where.position = filters.position;
    }
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [banners, total] = await Promise.all([
      prisma.bannerAd.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { position: 'asc' },
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.bannerAd.count({ where }),
    ]);

    return {
      banners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBanner(id: string) {
    const banner = await prisma.bannerAd.findUnique({
      where: { id },
    });

    if (!banner) {
      throw new NotFoundError('באנר לא נמצא');
    }

    return banner;
  }

  async updateBanner(id: string, data: UpdateBannerData) {
    const exists = await prisma.bannerAd.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundError('באנר לא נמצא');
    }

    const updateData: any = {};
    
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl) updateData.imageUrl = data.imageUrl;
    if (data.link !== undefined) updateData.link = data.link || null;
    if (data.position) updateData.position = data.position;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const banner = await prisma.bannerAd.update({
      where: { id },
      data: updateData,
    });

    return banner;
  }

  async deleteBanner(id: string) {
    const exists = await prisma.bannerAd.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundError('באנר לא נמצא');
    }

    await prisma.bannerAd.delete({
      where: { id },
    });

    return { message: 'באנר נמחק בהצלחה' };
  }

  async incrementClicks(id: string) {
    const banner = await prisma.bannerAd.update({
      where: { id },
      data: {
        clicks: { increment: 1 },
      },
    });

    return banner;
  }

  async incrementImpressions(id: string) {
    const banner = await prisma.bannerAd.update({
      where: { id },
      data: {
        impressions: { increment: 1 },
      },
    });

    return banner;
  }

  // Get active banners for public display
  async getActiveBanners(position?: string) {
    const now = new Date();
    
    const where: any = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (position) {
      where.position = position;
    }

    const banners = await prisma.bannerAd.findMany({
      where,
      orderBy: [
        { position: 'asc' },
        { order: 'asc' },
      ],
    });

    return banners;
  }
}
