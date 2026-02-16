import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';
import { seedStreetsFunction } from './seedStreets';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user (SUPER_ADMIN)
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@meyadleyad.com' },
    update: { role: 'SUPER_ADMIN' }, // Update to SUPER_ADMIN if exists
    create: {
      email: 'admin@meyadleyad.com',
      password: adminPassword,
      name: 'מנהל על',
      role: 'SUPER_ADMIN',
      isVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created admin user');

  // Create cities - only Beit Shemesh for now
  const cities = [
    { name: 'Beit Shemesh', nameHe: 'בית שמש', slug: 'beit-shemesh', latitude: 31.7450, longitude: 34.9896 },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {},
      create: {
        id: city.slug,
        name: city.name,
        nameHe: city.nameHe,
        slug: city.slug,
        latitude: city.latitude,
        longitude: city.longitude,
        updatedAt: new Date(),
      },
    });
  }
  console.log('✅ Created cities');

  // Seed streets for Beit Shemesh
  await seedStreetsFunction();
  console.log('✅ Created streets and neighborhoods');

  // Create categories - 8 main categories
  const apartmentsForSale = await prisma.category.upsert({
    where: { slug: 'apartments-for-sale' },
    update: {},
    create: {
      id: createId(),
      name: 'Apartments for Sale',
      nameHe: 'דירה למכירה',
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
      nameHe: 'דירה להשכרה',
      slug: 'apartments-for-rent',
      description: 'דירות להשכרה חודשית ושנתית',
      icon: '🔑',
      order: 2,
      updatedAt: new Date(),
    },
  });

  const sharedTabu = await prisma.category.upsert({
    where: { slug: 'shared-tabu' },
    update: {},
    create: {
      id: createId(),
      name: 'Shared Tabu',
      nameHe: 'טאבו משותף',
      slug: 'shared-tabu',
      description: 'נכסים בטאבו משותף',
      icon: '📋',
      order: 3,
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
      order: 4,
      updatedAt: new Date(),
    },
  });

  const wantedCommercial = await prisma.category.upsert({
    where: { slug: 'wanted-commercial' },
    update: {},
    create: {
      id: createId(),
      name: 'Wanted Commercial',
      nameHe: 'דרושים - נדל״ן מסחרי',
      slug: 'wanted-commercial',
      description: 'מחפשים נכסים מסחריים',
      icon: '🔍',
      order: 5,
      updatedAt: new Date(),
    },
  });

  const wantedSharedOwnership = await prisma.category.upsert({
    where: { slug: 'wanted-shared-ownership' },
    update: {},
    create: {
      id: createId(),
      name: 'Wanted Shared Ownership',
      nameHe: 'דרושים - טאבו משותף',
      slug: 'wanted-shared-ownership',
      description: 'מחפשים נכסים בטאבו משותף',
      icon: '🔍',
      order: 6,
      updatedAt: new Date(),
    },
  });

  const serviceProviders = await prisma.category.upsert({
    where: { slug: 'service-providers' },
    update: {},
    create: {
      id: createId(),
      name: 'Service Providers',
      nameHe: 'נותני שירות',
      slug: 'service-providers',
      description: 'מתווכים, קבלנים ובעלי מקצוע',
      icon: '🔧',
      order: 7,
      updatedAt: new Date(),
    },
  });

  const housingUnits = await prisma.category.upsert({
    where: { slug: 'housing-units' },
    update: {},
    create: {
      id: createId(),
      name: 'Housing Units',
      nameHe: 'יחידות דיור',
      slug: 'housing-units',
      description: 'יחידות דיור נפרדות להשכרה',
      icon: '🏡',
      order: 8,
      updatedAt: new Date(),
    },
  });

  const projects = await prisma.category.upsert({
    where: { slug: 'projects' },
    update: {},
    create: {
      id: createId(),
      name: 'Projects',
      nameHe: 'פרוייקטים',
      slug: 'projects',
      description: 'פרויקטי בנייה חדשים',
      icon: '🏗️',
      order: 9,
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
      order: 8,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created categories (9 Real Estate Categories)');

  // Add category fields for apartments
  const apartmentCategory = await prisma.category.findUnique({
    where: { slug: 'apartments-for-sale' },
  });

  if (apartmentCategory) {
    const apartmentFields = [
      { name: 'rooms', nameHe: 'מספר חדרים', fieldType: 'number', isRequired: true, order: 1 },
      { name: 'floor', nameHe: 'קומה', fieldType: 'number', isRequired: false, order: 2 },
      { name: 'size', nameHe: 'גודל במ״ר', fieldType: 'number', isRequired: true, order: 3 },
      { name: 'parking', nameHe: 'חניה', fieldType: 'boolean', isRequired: false, order: 4 },
      { name: 'elevator', nameHe: 'מעלית', fieldType: 'boolean', isRequired: false, order: 5 },
      { name: 'balcony', nameHe: 'מרפסת', fieldType: 'boolean', isRequired: false, order: 6 },
    ];

    for (const field of apartmentFields) {
      const existing = await prisma.categoryField.findFirst({
        where: {
          categoryId: apartmentCategory.id,
          name: field.name,
        },
      });
      
      if (!existing) {
        await prisma.categoryField.create({
          data: {
            id: createId(),
            categoryId: apartmentCategory.id,
            name: field.name,
            nameHe: field.nameHe,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            order: field.order,
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  // Add fields for apartments for rent  
  const apartmentsForRentCat = await prisma.category.findUnique({
    where: { slug: 'apartments-for-rent' },
  });

  if (apartmentsForRentCat) {
    const rentFields = [
      { name: 'rooms', nameHe: 'מספר חדרים', fieldType: 'number', isRequired: true, order: 1 },
      { name: 'floor', nameHe: 'קומה', fieldType: 'number', isRequired: false, order: 2 },
      { name: 'size', nameHe: 'גודל במ״ר', fieldType: 'number', isRequired: true, order: 3 },
      { name: 'furnished', nameHe: 'מרוהט', fieldType: 'boolean', isRequired: false, order: 4 },
      { name: 'parking', nameHe: 'חניה', fieldType: 'boolean', isRequired: false, order: 5 },
      { name: 'elevator', nameHe: 'מעלית', fieldType: 'boolean', isRequired: false, order: 6 },
    ];

    for (const field of rentFields) {
      const existing = await prisma.categoryField.findFirst({
        where: { categoryId: apartmentsForRentCat.id, name: field.name },
      });
      if (!existing) {
        await prisma.categoryField.create({
          data: {
            id: createId(),
            categoryId: apartmentsForRentCat.id,
            name: field.name,
            nameHe: field.nameHe,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            order: field.order,
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  console.log('✅ Created category fields');

  // Note: Sample ads removed - only user-created ads will exist
  console.log('✅ No sample ads created - database ready for user content');

  // Create default branding config
  const brandingConfig = await prisma.brandingConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      logoUrl: '',
      position: 'bottom-left',
      opacity: 70,
      sizePct: 18,
    },
  });
  console.log('✅ Created default branding config');

  console.log('✨ Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('Super Admin: admin@meyadleyad.com / admin123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
