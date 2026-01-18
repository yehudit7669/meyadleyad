import prisma from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class StreetsService {
  /**
   * Get streets by city with optional search query
   */
  async getStreets(params: {
    cityId?: string;
    query?: string;
    limit?: number;
  }) {
    const { cityId, query, limit = 100 } = params;
    
    const where: any = {};
    
    // Filter by city
    if (cityId) {
      where.cityId = cityId;
    }
    
    // Search by street name (case-insensitive, supports Hebrew)
    if (query && query.trim()) {
      const searchTerm = query.trim();
      where.name = {
        contains: searchTerm,
        mode: 'insensitive' as const,
      };
    }
    
    const streets = await prisma.street.findMany({
      where,
      include: {
        Neighborhood: {
          select: {
            id: true,
            name: true,
          },
        },
        City: {
          select: {
            id: true,
            name: true,
            nameHe: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });
    
    console.log(`[STREETS SERVICE] Found ${streets.length} streets for cityId: ${cityId}, query: "${query}"`);
    
    return streets.map(street => ({
      id: street.id,
      name: street.name,
      code: street.code,
      cityId: street.cityId,
      cityName: street.City?.nameHe || street.City?.name || '',
      neighborhoodId: street.neighborhoodId || null,
      neighborhoodName: street.Neighborhood?.name || null,
    }));
  }
  
  /**
   * Get a single street by ID
   */
  async getStreetById(id: string) {
    const street = await prisma.street.findUnique({
      where: { id },
      include: {
        Neighborhood: {
          select: {
            id: true,
            name: true,
          },
        },
        City: {
          select: {
            id: true,
            name: true,
            nameHe: true,
          },
        },
      },
    });
    
    if (!street) {
      throw new NotFoundError('רחוב לא נמצא');
    }
    
    return {
      id: street.id,
      name: street.name,
      code: street.code,
      cityId: street.cityId,
      cityName: street.City.nameHe,
      neighborhoodId: street.neighborhoodId,
      neighborhoodName: street.Neighborhood?.name || null,
    };
  }
  
  /**
   * Get Beit Shemesh city ID (default city)
   */
  async getBeitShemeshCity() {
    // Find all Beit Shemesh cities and get the one with most streets
    const cities = await prisma.city.findMany({
      where: { 
        OR: [
          { name: { contains: 'בית שמש', mode: 'insensitive' } },
          { nameHe: { contains: 'בית שמש', mode: 'insensitive' } },
          { name: { contains: 'Beit Shemesh', mode: 'insensitive' } },
        ]
      },
      include: {
        _count: {
          select: {
            Street: true
          }
        }
      }
    });
    
    if (!cities || cities.length === 0) {
      throw new NotFoundError('עיר בית שמש לא נמצאה במערכת');
    }
    
    // Return the city with the most streets
    const cityWithMostStreets = cities.reduce((prev, current) => 
      (current._count.Street > prev._count.Street) ? current : prev
    );
    
    console.log(`[BEIT SHEMESH] Found ${cities.length} cities, using ${cityWithMostStreets.id} with ${cityWithMostStreets._count.Street} streets`);
    
    return cityWithMostStreets;
  }
}

export const streetsService = new StreetsService();
