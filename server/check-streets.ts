import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStreets() {
  try {
    const streetCount = await prisma.street.count();
    console.log(`סה"כ רחובות ב-DB: ${streetCount}`);
    
    if (streetCount > 0) {
      const sampleStreets = await prisma.street.findMany({
        take: 5,
        include: {
          City: true,
        },
      });
      
      console.log('\nדוגמאות רחובות:');
      sampleStreets.forEach(street => {
        console.log(`  - ${street.name} (עיר: ${street.City?.nameHe || 'לא מוגדר'})`);
      });
    } else {
      console.log('⚠️ אין רחובות ב-DB!');
    }
  } catch (error) {
    console.error('שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStreets();
