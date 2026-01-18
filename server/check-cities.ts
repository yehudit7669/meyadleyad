import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCities() {
  try {
    const cities = await prisma.city.findMany({
      take: 20,
      select: {
        id: true,
        name: true,
        nameHe: true
      }
    });

    console.log('\n📍 ערים במערכת:\n');
    cities.forEach(city => {
      console.log(`ID: ${city.id}`);
      console.log(`Name: ${city.name}`);
      console.log(`NameHe: ${city.nameHe}`);
      console.log('---');
    });

    const beitShemesh = cities.find(c => 
      c.name?.includes('שמש') || 
      c.nameHe?.includes('שמש') ||
      c.name?.toLowerCase().includes('beit')
    );

    if (beitShemesh) {
      console.log('\n✅ בית שמש נמצאה:');
      console.log(`ID: ${beitShemesh.id}`);
      console.log(`Name: ${beitShemesh.name}`);
      console.log(`NameHe: ${beitShemesh.nameHe}`);
    }

  } catch (error: any) {
    console.error('❌ שגיאה:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCities();
