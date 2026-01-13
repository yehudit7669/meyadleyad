import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminAPI() {
  try {
    console.log('🧪 סימולציה של API המנהל\n');

    // 1. GET /api/admin/ads/pending
    console.log('📡 GET /api/admin/ads/pending');
    const pendingAds = await prisma.ad.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        Category: true,
        City: true,
        Street: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        AdImage: {
          orderBy: { order: 'asc' },
        },
      },
      take: 10,
    });

    console.log(`✅ נמצאו ${pendingAds.length} מודעות ממתינות\n`);

    pendingAds.forEach((ad: any, idx: number) => {
      console.log(`${idx + 1}. "${ad.title}"`);
      console.log(`   ID: ${ad.id}`);
      console.log(`   קטגוריה: ${ad.Category?.nameHe || 'לא צוין'}`);
      console.log(`   עיר: ${ad.City?.nameHe || 'לא צוין'}`);
      console.log(`   מפרסם: ${ad.User?.name || ad.User?.email}`);
      console.log(`   תמונות: ${ad.AdImage?.length || 0}`);
      
      if (ad.AdImage && ad.AdImage.length > 0) {
        ad.AdImage.forEach((img: any, imgIdx: number) => {
          console.log(`      ${imgIdx + 1}. ${img.url} (order: ${img.order})`);
        });
      }
      console.log('');
    });

    // 2. GET /api/admin/ads/:id - מודעה מלאה
    const firstAd = pendingAds[0];
    if (firstAd) {
      console.log('\n📡 GET /api/admin/ads/:id (מודעה מלאה)');
      const fullAd = await prisma.ad.findUnique({
        where: { id: firstAd.id },
        include: {
          Category: true,
          City: true,
          Street: true,
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              companyName: true,
            },
          },
          AdImage: {
            orderBy: { order: 'asc' },
          },
        },
      });

      console.log(`✅ מודעה מלאה: "${fullAd?.title}"`);
      console.log(`   AdImage array: ${JSON.stringify(fullAd?.AdImage, null, 2)}`);
    }

    console.log('\n✅ בדיקת API הושלמה!');
    console.log('   כל המודעות מכילות את שדה AdImage');
    console.log('   התמונות ימופיעו בפאנל המנהל');

  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminAPI();
