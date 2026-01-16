import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategories() {
  console.log('🔍 בדיקת קטגוריות במערכת...\n');
  
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      nameHe: true,
      slug: true,
      isActive: true,
      _count: {
        select: {
          Ad: true,
        },
      },
    },
  });

  console.log(`📊 סה"כ קטגוריות: ${categories.length}\n`);

  if (categories.length === 0) {
    console.log('❌ אין קטגוריות במערכת!');
    console.log('💡 צריך להריץ seed או ליצור קטגוריות ידנית');
  } else {
    console.log('📋 קטגוריות קיימות:\n');
    categories.forEach((cat) => {
      console.log(`  - ${cat.nameHe} (${cat.name})`);
      console.log(`    Slug: ${cat.slug}`);
      console.log(`    Active: ${cat.isActive}`);
      console.log(`    Ads: ${cat._count.Ad}`);
      console.log('');
    });
  }

  // Check specifically for apartments-for-sale
  const apartmentsSale = await prisma.category.findUnique({
    where: { slug: 'apartments-for-sale' },
  });

  if (apartmentsSale) {
    console.log('✅ קטגוריה "דירות למכירה" נמצאה');
  } else {
    console.log('❌ קטגוריה "דירות למכירה" לא נמצאה!');
  }
}

checkCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
