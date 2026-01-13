import prisma from '../../config/database';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export class CitiesService {
  async getAllCities() {
    // כרגע מוגבל רק לבית שמש - בעתיד ניתן להסיר את התנאי
    const cities = await prisma.city.findMany({
      where: { 
        isActive: true,
        OR: [
          { slug: 'beit-shemesh' },
          { name: 'Beit Shemesh' },
          { nameHe: { contains: 'בית שמש' } }
        ]
      },
      orderBy: { nameHe: 'asc' },
    });

    return cities;
  }

  async getCityBySlug(slug: string) {
    const city = await prisma.city.findUnique({
      where: { slug },
    });

    if (!city) {
      throw new NotFoundError('City not found');
    }

    return city;
  }

  async createCity(data: {
    name: string;
    nameHe: string;
    slug: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const existing = await prisma.city.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictError('City slug already exists');
    }

    const city = await prisma.city.create({
      data: {
        id: uuidv4(),
        ...data,
        updatedAt: new Date(),
      },
    });

    return city;
  }

  async updateCity(id: string, data: Partial<{
    name: string;
    nameHe: string;
    slug: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
  }>) {
    const city = await prisma.city.update({
      where: { id },
      data,
    });

    return city;
  }

  async deleteCity(id: string) {
    const adsCount = await prisma.ad.count({
      where: { cityId: id },
    });

    if (adsCount > 0) {
      throw new ConflictError('Cannot delete city with existing ads');
    }

    await prisma.city.delete({
      where: { id },
    });
  }
}
