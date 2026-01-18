import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCitiesAndStreets() {
  try {
    console.log('\n⚠️  אזהרה: פעולה זו תמחק את כל הערים, השכונות והרחובות!\n');
    
    // Count before deletion
    const streetsCount = await prisma.street.count();
    const neighborhoodsCount = await prisma.neighborhood.count();
    const citiesCount = await prisma.city.count();

    console.log('📊 נתונים קיימים:');
    console.log(`   🛣️  רחובות: ${streetsCount}`);
    console.log(`   🏘️  שכונות: ${neighborhoodsCount}`);
    console.log(`   🏙️  ערים: ${citiesCount}`);
    console.log('');

    if (streetsCount === 0 && neighborhoodsCount === 0 && citiesCount === 0) {
      console.log('✅ אין נתונים למחיקה');
      return;
    }

    console.log('🗑️  מוחק נתונים...\n');

    // Delete in correct order (respecting foreign keys)
    await prisma.$transaction(async (tx) => {
      // 1. Delete streets first (depends on cities and neighborhoods)
      if (streetsCount > 0) {
        await tx.street.deleteMany();
        console.log(`   ✓ נמחקו ${streetsCount} רחובות`);
      }

      // 2. Delete neighborhoods (depends on cities)
      if (neighborhoodsCount > 0) {
        await tx.neighborhood.deleteMany();
        console.log(`   ✓ נמחקו ${neighborhoodsCount} שכונות`);
      }

      // 3. Delete cities last
      if (citiesCount > 0) {
        await tx.city.deleteMany();
        console.log(`   ✓ נמחקו ${citiesCount} ערים`);
      }
    });

    console.log('\n✅ כל הנתונים נמחקו בהצלחה!');
    console.log('📌 עכשיו אפשר לייבא קובץ חדש עם ערים, שכונות ורחובות\n');

  } catch (error: any) {
    console.error('\n❌ שגיאה במחיקת נתונים:', error.message);
    console.error('הפעולה בוטלה והנתונים לא נמחקו\n');
  } finally {
    await prisma.$disconnect();
  }
}

clearCitiesAndStreets();
