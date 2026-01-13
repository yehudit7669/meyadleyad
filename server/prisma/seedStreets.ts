import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

interface StreetData {
  streetName: string;
  streetCode: string;
  neighborhoodName: string | null;
}

function parseCSV(csvPath: string): StreetData[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  
  const streets: StreetData[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(',');
    if (parts.length < 3) continue;
    
    const streetName = parts[0].trim();
    const streetCode = parts[1].trim();
    let neighborhoodName: string | null = parts[2].trim();
    
    // Skip empty street names or codes
    if (!streetName || !streetCode) continue;
    
    // Handle -- as null
    if (neighborhoodName === '--' || !neighborhoodName) {
      neighborhoodName = null;
    }
    
    streets.push({
      streetName,
      streetCode,
      neighborhoodName,
    });
  }
  
  return streets;
}

async function seedStreets() {
  console.log('🌱 Starting streets seed for Beit Shemesh...');
  
  try {
    // 1. Create or get Beit Shemesh city
    const city = await prisma.city.upsert({
      where: { slug: 'beit-shemesh' },
      update: {},
      create: {
        id: 'beit-shemesh',
        name: 'Beit Shemesh',
        nameHe: 'בית שמש',
        slug: 'beit-shemesh',
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ City created/found: ${city.name}`);
    
    // 2. Parse CSV file
    const csvPath = path.join(__dirname, '..', 'רחובות בית שמש.csv');
    const streetsData = parseCSV(csvPath);
    console.log(`📄 Parsed ${streetsData.length} streets from CSV`);
    
    // 3. Extract unique neighborhoods
    const uniqueNeighborhoods = new Set<string>();
    streetsData.forEach(street => {
      if (street.neighborhoodName) {
        uniqueNeighborhoods.add(street.neighborhoodName);
      }
    });
    
    console.log(`🏘️ Found ${uniqueNeighborhoods.size} unique neighborhoods`);
    
    // 4. Create neighborhoods
    const neighborhoodMap = new Map<string, string>(); // name -> id
    
    for (const neighborhoodName of uniqueNeighborhoods) {
      const neighborhood = await prisma.neighborhood.upsert({
        where: {
          cityId_name: {
            cityId: city.id,
            name: neighborhoodName,
          },
        },
        update: {},
        create: {
          id: createId(),
          name: neighborhoodName,
          cityId: city.id,
          updatedAt: new Date(),
        },
      });
      neighborhoodMap.set(neighborhoodName, neighborhood.id);
      console.log(`  ✓ Neighborhood: ${neighborhoodName}`);
    }
    
    // 5. Create streets
    let createdCount = 0;
    let skippedCount = 0;
    
    // Remove duplicates based on street name and code
    const uniqueStreets = new Map<string, StreetData>();
    
    for (const street of streetsData) {
      const key = `${street.streetName}-${street.streetCode}`;
      if (!uniqueStreets.has(key)) {
        uniqueStreets.set(key, street);
      }
    }
    
    console.log(`🔄 Processing ${uniqueStreets.size} unique streets...`);
    
    for (const street of uniqueStreets.values()) {
      try {
        const neighborhoodId = street.neighborhoodName
          ? neighborhoodMap.get(street.neighborhoodName)
          : null;
        
        await prisma.street.upsert({
          where: {
            cityId_name: {
              cityId: city.id,
              name: street.streetName,
            },
          },
          update: {
            code: street.streetCode,
            neighborhoodId: neighborhoodId || null,
            updatedAt: new Date(),
          },
          create: {
            id: createId(),
            name: street.streetName,
            code: street.streetCode,
            cityId: city.id,
            neighborhoodId: neighborhoodId || null,
            updatedAt: new Date(),
          },
        });
        
        createdCount++;
        
        if (createdCount % 50 === 0) {
          console.log(`  ⏳ Processed ${createdCount}/${uniqueStreets.size} streets...`);
        }
      } catch (error: any) {
        console.error(`  ❌ Error creating street ${street.streetName}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log(`\n✅ Streets seed completed!`);
    console.log(`   - Created/Updated: ${createdCount} streets`);
    console.log(`   - Skipped: ${skippedCount} streets`);
    console.log(`   - Neighborhoods: ${uniqueNeighborhoods.size}`);
    
  } catch (error) {
    console.error('❌ Error seeding streets:', error);
    throw error;
  }
}

// Export the function for use in main seed
export async function seedStreetsFunction() {
  await seedStreets();
}

async function main() {
  await seedStreets();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
