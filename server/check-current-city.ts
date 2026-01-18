import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 בודק ערים קיימות:\n');
  
  const cities = await prisma.city.findMany({
    select: {
      id: true,
      name: true,
      nameHe: true,
      _count: {
        select: {
          Street: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
  
  console.log(`מצאתי ${cities.length} ערים:\n`);
  cities.forEach(city => {
    console.log(`   🏙️  ${city.nameHe || city.name}`);
    console.log(`      ID: ${city.id}`);
    console.log(`      רחובות: ${city._count.Street}`);
    console.log('');
  });
  
  // Check specific IDs
  console.log('\n🔍 בודק IDs ספציפיים:\n');
  
  const oldCityId = 'city-1768702014346-1hk22nh4b';
  const oldCity = await prisma.city.findUnique({
    where: { id: oldCityId },
    select: {
      id: true,
      name: true,
      _count: {
        select: { Street: true }
      }
    }
  });
  
  console.log(`ID ישן (${oldCityId}):`);
  console.log(oldCity ? `   קיים! (${oldCity._count.Street} רחובות)` : '   ❌ לא קיים');
  
  const newCityId = 'city-1768748341265-vae9revc4';
  const newCity = await prisma.city.findUnique({
    where: { id: newCityId },
    select: {
      id: true,
      name: true,
      _count: {
        select: { Street: true }
      }
    }
  });
  
  console.log(`\nID חדש (${newCityId}):`);
  console.log(newCity ? `   ✓ קיים! (${newCity._count.Street} רחובות)` : '   לא קיים');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
