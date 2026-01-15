import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';
import { seedStreetsFunction } from './seedStreets';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@meyadleyad.com' },
    update: {},
    create: {
      email: 'admin@meyadleyad.com',
      password: adminPassword,
      name: 'מנהל המערכת',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Created admin user');

  // Create sample broker
  const brokerPassword = await bcrypt.hash('broker123456', 10);
  const broker = await prisma.user.upsert({
    where: { email: 'broker@example.com' },
    update: {},
    create: {
      email: 'broker@example.com',
      password: brokerPassword,
      name: 'יוסי כהן',
      phone: '050-1234567',
      role: 'BROKER',
      isVerified: true,
      companyName: 'כהן נדל״ן',
      licenseNumber: '12345',
      description: 'משרד תיווך מוביל עם ניסיון של 20 שנה בשוק הנדל״ן',
      website: 'https://cohen-realestate.example.com',
    },
  });
  console.log('✅ Created broker user');

  // Create sample regular user
  const userPassword = await bcrypt.hash('user123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'דני לוי',
      phone: '052-9876543',
      role: 'USER',
      isVerified: true,
    },
  });
  console.log('✅ Created regular user');

  // Create sample service provider
  const spPassword = await bcrypt.hash('sp123456', 10);
  const serviceProvider = await prisma.user.upsert({
    where: { email: 'lawyer@example.com' },
    update: {},
    create: {
      email: 'lawyer@example.com',
      password: spPassword,
      name: 'עו"ד משה ישראלי',
      role: 'SERVICE_PROVIDER',
      userType: 'SERVICE_PROVIDER',
      serviceProviderType: 'LAWYER',
      isVerified: true,
      phonePersonal: '050-1112222',
      phoneBusinessOffice: '03-5556666',
      businessName: 'משרד עורכי דין ישראלי ושות\'',
      officeAddress: 'רחוב הרצל 10, בית שמש',
      aboutBusiness: 'משרד עורכי דין מוביל המתמחה בתחום הנדל"ן, עסקאות קרקע ועסקאות מקרקעין. ניסיון של מעל 15 שנה בייצוג לקוחות בעסקאות מורכבות.',
      publishOfficeAddress: true,
      businessHours: {
        sun: [{ from: '09:00', to: '17:00' }],
        mon: [{ from: '09:00', to: '17:00' }],
        tue: [{ from: '09:00', to: '17:00' }],
        wed: [{ from: '09:00', to: '17:00' }],
        thu: [{ from: '09:00', to: '17:00' }],
      },
      weeklyDigestSubscribed: true,
    },
  });
  console.log('✅ Created service provider user');

  // Create cities
  const cities = [
    { name: 'Beit Shemesh', nameHe: 'בית שמש', slug: 'beit-shemesh', latitude: 31.7450, longitude: 34.9896 },
    { name: 'Tel Aviv', nameHe: 'תל אביב', slug: 'tel-aviv', latitude: 32.0853, longitude: 34.7818 },
    { name: 'Jerusalem', nameHe: 'ירושלים', slug: 'jerusalem', latitude: 31.7683, longitude: 35.2137 },
    { name: 'Haifa', nameHe: 'חיפה', slug: 'haifa', latitude: 32.7940, longitude: 34.9896 },
    { name: 'Rishon LeZion', nameHe: 'rishon לציון', slug: 'rishon-lezion', latitude: 31.9730, longitude: 34.7925 },
    { name: 'Petah Tikva', nameHe: 'פתח תקווה', slug: 'petah-tikva', latitude: 32.0878, longitude: 34.8878 },
    { name: 'Ashdod', nameHe: 'אשדוד', slug: 'ashdod', latitude: 31.8044, longitude: 34.6553 },
    { name: 'Netanya', nameHe: 'נתניה', slug: 'netanya', latitude: 32.3215, longitude: 34.8532 },
    { name: 'Beersheba', nameHe: 'באר שבע', slug: 'beersheba', latitude: 31.2518, longitude: 34.7913 },
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

  // Create categories - Real Estate Focused Platform (4 Categories)
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

  const secondHandBoard = await prisma.category.upsert({
    where: { slug: 'second-hand-board' },
    update: {},
    create: {
      id: createId(),
      name: 'Second Hand Board',
      nameHe: 'לוח יד שניה',
      slug: 'second-hand-board',
      description: 'מוצרים ושירותים יד שניה',
      icon: '🛍️',
      order: 4,
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
      order: 5,
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
      icon: '🏘️',
      order: 6,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created categories (6 Real Estate Categories)');

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
  console.log('Admin: admin@meyadleyad.com / admin123456');
  console.log('Broker: broker@example.com / broker123456');
  console.log('User: user@example.com / user123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
