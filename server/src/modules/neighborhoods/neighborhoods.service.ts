import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NeighborhoodsService {
  async getNeighborhoods(cityId?: string) {
    const where = cityId ? { cityId } : {};
    
    const neighborhoods = await prisma.neighborhood.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      include: {
        City: {
          select: {
            id: true,
            nameHe: true,
          },
        },
      },
    });

    return neighborhoods;
  }

  async getNeighborhoodById(id: string) {
    return await prisma.neighborhood.findUnique({
      where: { id },
      include: {
        City: true,
      },
    });
  }
}
