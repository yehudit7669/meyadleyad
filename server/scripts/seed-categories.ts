import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedCategories() {
  console.log('🌱 יצירת קטגוריות בסיסיות...\n');

  const now = new Date();
  const categories = [
    {
      id: uuidv4(),
      name: 'Real Estate',
      nameHe: 'נדל"ן',
      slug: 'real-estate',
      description: 'Real estate listings',
      isActive: true,
      order: 1,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Apartments for Sale',
      nameHe: 'דירות למכירה',
      slug: 'apartments-for-sale',
      description: 'Apartments for sale',
      isActive: true,
      order: 1,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Apartments for Rent',
      nameHe: 'דירות להשכרה',
      slug: 'apartments-for-rent',
      description: 'Apartments for rent',
      isActive: true,
      order: 2,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Houses for Sale',
      nameHe: 'בתים למכירה',
      slug: 'houses-for-sale',
      description: 'Houses for sale',
      isActive: true,
      order: 3,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Commercial',
      nameHe: 'נכסים מסחריים',
      slug: 'commercial',
      description: 'Commercial properties',
      isActive: true,
      order: 4,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Parking',
      nameHe: 'חניות',
      slug: 'parking',
      description: 'Parking spaces',
      isActive: true,
      order: 5,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Land',
      nameHe: 'קרקעות',
      slug: 'land',
      description: 'Land plots',
      isActive: true,
      order: 6,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Roommates',
      nameHe: 'שותפים לדירה',
      slug: 'roommates',
      description: 'Roommate wanted',
      isActive: true,
      order: 7,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Vacation Rentals',
      nameHe: 'נופש',
      slug: 'vacation-rentals',
      description: 'Vacation properties',
      isActive: true,
      order: 8,
      updatedAt: now,
    },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    if (existing) {
      console.log(`⏭️  ${category.nameHe} כבר קיים`);
    } else {
      await prisma.category.create({
        data: category,
      });
      console.log(`✅ ${category.nameHe} (${category.slug}) נוצר`);
    }
  }

  console.log('\n📊 סיכום:');
  const total = await prisma.category.count();
  console.log(`סה"כ קטגוריות במערכת: ${total}`);
}

seedCategories()
  .then(() => {
    console.log('\n✅ הושלם!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ שגיאה:', error);
    process.exit(1);
  });
