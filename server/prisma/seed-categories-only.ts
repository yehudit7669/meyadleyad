/**
 * SEED לפרודקשן - קטגוריות בלבד
 * 
 * קובץ זה מיועד להרצה בפרודקשן על מנת לעדכן את הקטגוריות
 * ללא לגעת בנתונים אחרים (ערים, רחובות, משתמשים וכו')
 * 
 * הרצה:
 * npx tsx prisma/seed-categories-only.ts
 */

import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function seedCategories() {
  console.log('🌱 Starting categories seed for production...');

  // Create categories - 9 Real Estate Categories (EXACT COPY FROM seed.ts)
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
}

// הרצת ה-seed
seedCategories()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✨ Categories seed completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - 9 categories created/updated');
    console.log('   - Order numbers: 1-9');
    console.log('');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error seeding categories:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
