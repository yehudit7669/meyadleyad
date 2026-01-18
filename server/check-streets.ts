import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStreets() {
  try {
    console.log('\n בודק רחובות במערכת...\n');

    const cities = await prisma.city.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            Street: true
          }
        }
      }
    });

    console.log(' ערים ומספר רחובות:');
    for (const city of cities) {
      console.log(   :  רחובות);
    }

    const sampleStreets = await prisma.street.findMany({
      take: 5,
      include: {
        City: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('\n דוגמאות רחובות:');
    for (const street of sampleStreets) {
      console.log(    - );
    }

  } catch (error) {
    console.error(' שגיאה:', error.message);
  } finally {
    await prisma.();
  }
}

checkStreets();
