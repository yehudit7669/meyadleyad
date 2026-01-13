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

  console.log('✅ Created categories (5 Real Estate Categories)');

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

  // Create sample ads
  const telAviv = await prisma.city.findUnique({ where: { slug: 'tel-aviv' } });
  const apartmentsForSaleCat = await prisma.category.findUnique({ where: { slug: 'apartments-for-sale' } });

  if (telAviv && apartmentsForSaleCat) {
    await prisma.ad.create({
      data: {
        id: createId(),
        title: 'דירת 4 חדרים מרווחת בתל אביב',
        description: 'דירה מדהימה בלב תל אביב, משופצת לחלוטין, עם נוף פתוח ומרפסת שמש.\nהדירה כוללת 4 חדרים, 2 חדרי רחצה, מטבח מודרני וחניה.\nקרוב לתחבורה ציבורית, בתי ספר וקניונים.',
        price: 2500000,
        userId: broker.id,
        categoryId: apartmentsForSaleCat.id,
        cityId: telAviv.id,
        address: 'רחוב הרצל 123',
        latitude: 32.0853,
        longitude: 34.7818,
        customFields: {
          rooms: 4,
          floor: 3,
          size: 110,
          parking: true,
          elevator: true,
          balcony: true,
        },
        status: 'APPROVED',
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.ad.create({
      data: {
        id: createId(),
        title: 'דירת 3 חדרים להשקעה',
        description: 'דירה נהדרת להשקעה או למגורים, ממוקמת באזור מבוקש.\nמשופצת חלקית, פוטנציאל רב.',
        price: 1800000,
        userId: user.id,
        categoryId: apartmentsForSaleCat.id,
        cityId: telAviv.id,
        address: 'שדרות רוטשילד 45',
        customFields: {
          rooms: 3,
          floor: 2,
          size: 85,
          parking: false,
          elevator: false,
          balcony: true,
        },
        status: 'PENDING',
        updatedAt: new Date(),
      },
    });
  }

  // Create additional real estate sample ads
  const jerusalemCity = await prisma.city.findUnique({ where: { slug: 'jerusalem' } });
  const rentCategory = await prisma.category.findUnique({ where: { slug: 'apartments-for-rent' } });
  const commercialCategory = await prisma.category.findUnique({ where: { slug: 'commercial-real-estate' } });
  const saleCategory = await prisma.category.findUnique({ where: { slug: 'apartments-for-sale' } });

  // Create luxury apartment for sale with images
  if (telAviv && saleCategory) {
    const luxuryAd = await prisma.ad.create({
      data: {
        id: createId(),
        title: 'דירת פנטהאוז יוקרתית 5 חדרים בצפון תל אביב',
        description: 'דירת יוקרה ייחודית בקומה 12 עם נוף פנורמי לים.\n\nהדירה כוללת:\n• 5 חדרים מרווחים + יחידת הורים מפוארת\n• 2 מרפסות שמש גדולות\n• מטבח מעוצב עם מוצרי חשמל יוקרתיים\n• 3 חדרי אמבטיה מעוצבים\n• ממ״ד מרווח\n• מחסן צמוד\n• 2 חניות מקורות\n\nהבניין:\n• בניין בוטיק יוקרתי\n• 2 מעליות שבת\n• חדר כושר מאובזר\n• לובי מפואר\n• אבטחה 24/7\n\nמיקום מעולה:\n• 5 דקות הליכה מהים\n• קרוב לפארק הירקון\n• סמוך לבתי ספר ומעונות\n• תחבורה ציבורית בסמוך',
        price: 4800000,
        userId: broker.id,
        categoryId: saleCategory.id,
        cityId: telAviv.id,
        address: 'רחוב ז\'בוטינסקי 150',
        latitude: 32.0853,
        longitude: 34.7818,
        customFields: {
          rooms: 5,
          floor: 12,
          size: 140,
          parking: true,
          elevator: true,
          balcony: true,
          furnished: false,
        },
        status: 'APPROVED',
        publishedAt: new Date(),
        updatedAt: new Date(),
        AdImage: {
          create: [
            {
              id: createId(),
              url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
              order: 0,
            },
            {
              id: createId(),
              url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
              order: 1,
            },
            {
              id: createId(),
              url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
              order: 2,
            },
            {
              id: createId(),
              url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
              order: 3,
            },
            {
              id: createId(),
              url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
              order: 4,
            },
          ],
        },
      },
    });
    console.log('✅ Created luxury penthouse ad with images (ID: ' + luxuryAd.id + ')');
  }

  if (jerusalemCity && rentCategory) {
    await prisma.ad.create({
      data: {
        id: createId(),
        title: 'דירת 3 חדרים להשכרה בירושלים',
        description: 'דירה מרוהטת במלואה, זמינה לכניסה מיידית.\nכוללת: מזגנים, מטבח מאובזר, מכונת כביסה.\nבניין עם מעלית, קרוב לתחבורה ציבורית.',
        price: 5500,
        userId: broker.id,
        categoryId: rentCategory.id,
        cityId: jerusalemCity.id,
        address: 'רחוב יפו 78',
        latitude: 31.7683,
        longitude: 35.2137,
        customFields: {
          rooms: 3,
          floor: 4,
          size: 75,
          furnished: true,
          parking: true,
          elevator: true,
        },
        status: 'APPROVED',
        publishedAt: new Date(),
        updatedAt: new Date(),
        AdImage: {
          create: [
            {
              id: createId(),
              url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
              order: 0,
            },
            {
              id: createId(),
              url: 'https://images.unsplash.com/photo-1502672260066-6bc35f0ea4a0?w=800',
              order: 1,
            },
          ],
        },
      },
    });
  }

  if (telAviv && commercialCategory) {
    await prisma.ad.create({
      data: {
        id: createId(),
        title: 'משרד להשכרה במרכז תל אביב',
        description: 'משרד יוקרתי במיקום מרכזי, 80 מ״ר, מתאים לסטארט-אפ או משרד עורכי דין.\nכולל: חניה, מעלית, מזגן, אינטרנט.',
        price: 12000,
        userId: broker.id,
        categoryId: commercialCategory.id,
        cityId: telAviv.id,
        address: 'רחוב רוטשילד 25',
        customFields: {
          size: 80,
          parking: true,
          elevator: true,
        },
        status: 'APPROVED',
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log('✅ Created sample real estate ads');

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
