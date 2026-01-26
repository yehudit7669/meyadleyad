import prisma from '../../config/database';
import { AdStatus } from '@prisma/client';

export class ImportHistoryService {
  /**
   * Get import history with pagination
   */
  async getImportHistory(params: {
    page?: number;
    limit?: number;
    importType?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.importType) {
      where.importType = params.importType;
    }

    const [imports, total] = await Promise.all([
      prisma.importLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.importLog.count({ where }),
    ]);

    return {
      imports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single import details
   */
  async getImportDetails(importId: string) {
    const importLog = await prisma.importLog.findUnique({
      where: { id: importId },
    });

    if (!importLog) {
      throw new Error('Import not found');
    }

    return importLog;
  }

  /**
   * Check if imported properties have approved ads
   */
  async checkApprovedPropertiesInImport(importId: string) {
    const importLog = await prisma.importLog.findUnique({
      where: { id: importId },
    });

    if (!importLog || !importLog.importedItemIds) {
      return { hasApproved: false, approvedCount: 0, pendingCount: 0 };
    }

    const itemIds = importLog.importedItemIds as string[];
    
    const [approvedCount, pendingCount] = await Promise.all([
      prisma.ad.count({
        where: {
          id: { in: itemIds },
          status: { in: [AdStatus.APPROVED, AdStatus.ACTIVE] },
        },
      }),
      prisma.ad.count({
        where: {
          id: { in: itemIds },
          status: { notIn: [AdStatus.APPROVED, AdStatus.ACTIVE] },
        },
      }),
    ]);

    return {
      hasApproved: approvedCount > 0,
      approvedCount,
      pendingCount,
      totalCount: itemIds.length,
    };
  }

  /**
   * Check if cities/streets from import have approved ads
   */
  async checkApprovedAdsUsingCitiesStreets(importId: string) {
    const importLog = await prisma.importLog.findUnique({
      where: { id: importId },
    });

    if (!importLog || !importLog.metadata) {
      return { hasApproved: false, approvedCount: 0, cityIds: [], streetIds: [] };
    }

    const metadata = importLog.metadata as any;
    const cityIds = metadata.cityIds || [];
    const streetIds = metadata.streetIds || [];

    if (cityIds.length === 0 && streetIds.length === 0) {
      return { hasApproved: false, approvedCount: 0, cityIds: [], streetIds: [] };
    }

    const where: any = {
      status: { in: [AdStatus.APPROVED, AdStatus.ACTIVE] },
      OR: [],
    };

    if (cityIds.length > 0) {
      where.OR.push({ cityId: { in: cityIds } });
    }

    if (streetIds.length > 0) {
      where.OR.push({ streetId: { in: streetIds } });
    }

    const approvedCount = await prisma.ad.count({ where });

    return {
      hasApproved: approvedCount > 0,
      approvedCount,
      cityIds,
      streetIds,
    };
  }

  /**
   * Delete imported properties
   */
  async deleteImportedProperties(
    importId: string,
    options: {
      includeApproved: boolean;
    }
  ) {
    const importLog = await prisma.importLog.findUnique({
      where: { id: importId },
    });

    if (!importLog || !importLog.importedItemIds) {
      throw new Error('Import not found or has no imported items');
    }

    const itemIds = importLog.importedItemIds as string[];

    console.log('🗑️ Delete Import Properties:', {
      importId,
      includeApproved: options.includeApproved,
      totalItemIds: itemIds.length,
      itemIds: itemIds.slice(0, 5) + '...',
    });

    const whereClause: any = {
      id: { in: itemIds },
    };

    // If not including approved, only delete pending/rejected ads
    if (!options.includeApproved) {
      whereClause.status = {
        notIn: [AdStatus.APPROVED, AdStatus.ACTIVE],
      };
      console.log('⚠️ NOT deleting approved ads - adding status filter');
    } else {
      console.log('✅ Deleting ALL ads including approved');
    }

    console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2));

    // Delete ads (cascade will handle images)
    const deletedAds = await prisma.ad.deleteMany({
      where: whereClause,
    });

    console.log(`✅ Deleted ${deletedAds.count} ads`);

    // Delete the import log
    await prisma.importLog.delete({
      where: { id: importId },
    });

    return {
      deletedCount: deletedAds.count,
      importDeleted: true,
    };
  }

  /**
   * Delete imported cities and streets
   */
  async deleteImportedCitiesStreets(
    importId: string,
    options: {
      deleteWithApprovedAds: boolean;
    }
  ) {
    const importLog = await prisma.importLog.findUnique({
      where: { id: importId },
    });

    if (!importLog || !importLog.metadata) {
      throw new Error('Import not found or has no metadata');
    }

    const metadata = importLog.metadata as any;
    const cityIds = metadata.createdCityIds || metadata.cityIds || [];
    const streetIds = metadata.createdStreetIds || metadata.streetIds || [];

    console.log('🗑️ Delete Cities/Streets:', {
      importId,
      deleteWithApprovedAds: options.deleteWithApprovedAds,
      cityIds: cityIds.length,
      streetIds: streetIds.length,
    });

    let deletedCities = 0;
    let deletedStreets = 0;

    if (!options.deleteWithApprovedAds) {
      // Check each city/street if it has approved ads before deleting
      for (const cityId of cityIds) {
        try {
          const approvedAdsCount = await prisma.ad.count({
            where: {
              cityId,
              status: { in: [AdStatus.APPROVED, AdStatus.ACTIVE] },
            },
          });

          if (approvedAdsCount === 0) {
            // Use deleteMany to avoid errors if city doesn't exist
            const result = await prisma.city.deleteMany({ 
              where: { id: cityId } 
            });
            deletedCities += result.count;
            console.log(`✅ Deleted city ${cityId}`);
          } else {
            console.log(`⚠️ Skipped city ${cityId} - has ${approvedAdsCount} approved ads`);
          }
        } catch (error: any) {
          console.error(`❌ Error deleting city ${cityId}:`, error.message);
        }
      }

      for (const streetId of streetIds) {
        try {
          const approvedAdsCount = await prisma.ad.count({
            where: {
              streetId,
              status: { in: [AdStatus.APPROVED, AdStatus.ACTIVE] },
            },
          });

          if (approvedAdsCount === 0) {
            // Use deleteMany to avoid errors if street doesn't exist
            const result = await prisma.street.deleteMany({ 
              where: { id: streetId } 
            });
            deletedStreets += result.count;
            console.log(`✅ Deleted street ${streetId}`);
          } else {
            console.log(`⚠️ Skipped street ${streetId} - has ${approvedAdsCount} approved ads`);
          }
        } catch (error: any) {
          console.error(`❌ Error deleting street ${streetId}:`, error.message);
        }
      }
    } else {
      // Delete all cities/streets and their associated ads
      // First delete ads using these cities/streets
      await prisma.ad.deleteMany({
        where: {
          OR: [
            { cityId: { in: cityIds } },
            { streetId: { in: streetIds } },
          ],
        },
      });

      // Then delete streets
      if (streetIds.length > 0) {
        const result = await prisma.street.deleteMany({
          where: { id: { in: streetIds } },
        });
        deletedStreets = result.count;
      }

      // Then delete cities
      if (cityIds.length > 0) {
        const result = await prisma.city.deleteMany({
          where: { id: { in: cityIds } },
        });
        deletedCities = result.count;
      }
    }

    // Delete the import log
    await prisma.importLog.delete({
      where: { id: importId },
    });

    return {
      deletedCities,
      deletedStreets,
      importDeleted: true,
    };
  }
}

export const importHistoryService = new ImportHistoryService();
