import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteNonBeitShemeshAds() {
  try {
    console.log('🔍 מחפש את העיר בית שמש...');
    
    // Find Beit Shemesh city
    const beitShemesh = await prisma.city.findFirst({
      where: {
        OR: [
          { nameHe: { contains: 'בית שמש' } },
          { name: { contains: 'Beit Shemesh', mode: 'insensitive' } },
        ],
      },
    });

    if (!beitShemesh) {
      console.log('❌ לא נמצאה העיר בית שמש במערכת');
      return;
    }

    console.log(`✅ נמצאה העיר בית שמש: ${beitShemesh.nameHe} (${beitShemesh.id})`);

    // Count ads not from Beit Shemesh
    const adsToDelete = await prisma.ad.findMany({
      where: {
        AND: [
          { cityId: { not: null } },
          { cityId: { not: beitShemesh.id } },
        ],
      },
      include: {
        City: true,
        Category: true,
      },
    });

    console.log(`\n📊 נמצאו ${adsToDelete.length} מודעות שלא מבית שמש:\n`);

    if (adsToDelete.length === 0) {
      console.log('✅ אין מודעות למחיקה');
      return;
    }

    // Show ads that will be deleted
    adsToDelete.forEach((ad, index) => {
      console.log(`${index + 1}. מודעה #${ad.adNumber} - ${ad.title}`);
      console.log(`   עיר: ${ad.City?.nameHe || 'לא ידוע'}`);
      console.log(`   קטגוריה: ${ad.Category?.nameHe}`);
      console.log(`   סטטוס: ${ad.status}`);
      console.log('');
    });

    console.log(`\n🗑️  מוחק ${adsToDelete.length} מודעות...\n`);

    // Delete ads (this will also delete related images and favorites due to cascade)
    const deleteResult = await prisma.ad.deleteMany({
      where: {
        AND: [
          { cityId: { not: null } },
          { cityId: { not: beitShemesh.id } },
        ],
      },
    });

    console.log(`✅ נמחקו ${deleteResult.count} מודעות בהצלחה!`);
    console.log('\n📝 סיכום:');
    console.log(`   - מודעות שנמחקו: ${deleteResult.count}`);
    console.log(`   - מודעות שנשארו: מודעות מבית שמש בלבד`);

  } catch (error) {
    console.error('❌ שגיאה במחיקת מודעות:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteNonBeitShemeshAds()
  .then(() => {
    console.log('\n✅ הסקריפט הושלם בהצלחה!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ הסקריפט נכשל:', error);
    process.exit(1);
  });
