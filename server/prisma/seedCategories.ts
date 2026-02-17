import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding categories...');

  // Create categories - Real Estate Focused Platform (5 Categories)
  const apartmentsForSale = await prisma.category.upsert({
    where: { slug: 'apartments-for-sale' },
    update: {},
    create: {
      id: createId(),
      name: 'Apartments for Sale',
      nameHe: 'דירות למכירה',
      slug: 'apartments-for-sale',
      description: 'דירות למכירה בכל רחבי הארץ',
      icon: '🏠',
      order: 1,
      updatedAt: new Date(),
    },
  });

  const apartmentsForRent = await prisma.category.upsert({
    where: { slug: 'apartments-for-rent' },
    update: {},
    create: {
      id: createId(),
      name: 'Apartments for Rent',
      nameHe: 'דירות להשכרה',
      slug: 'apartments-for-rent',
      description: 'דירות להשכרה חודשית ושנתית',
      icon: '🔑',
      order: 2,
      updatedAt: new Date(),
    },
  });

  const commercialRealEstate = await prisma.category.upsert({
    where: { slug: 'commercial-real-estate' },
    update: {},
    create: {
      id: createId(),
      name: 'Commercial Real Estate',
      nameHe: 'נדל״ן מסחרי',
      slug: 'commercial-real-estate',
      description: 'משרדים, חנויות ונכסים מסחריים',
      icon: '🏢',
      order: 3,
      updatedAt: new Date(),
    },
  });

  const shabbatApartments = await prisma.category.upsert({
    where: { slug: 'shabbat-apartments' },
    update: {},
    create: {
      id: createId(),
      name: 'Shabbat Apartments',
      nameHe: 'דירות לשבת',
      slug: 'shabbat-apartments',
      description: 'דירות לאירוח לשבת וחגים',
      icon: '🕯️',
      order: 4,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created categories (4 Real Estate Categories)');
  console.log('   - apartments-for-sale');
  console.log('   - apartments-for-rent');
  console.log('   - commercial-real-estate');
  console.log('   - shabbat-apartments');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
