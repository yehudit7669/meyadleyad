import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdWithRealImage() {
  try {
    // מצא את המודעה האחרונה שיצרנו
    const ad = await prisma.ad.findFirst({
      where: { title: 'דירה לבדיקה עם תמונות' },
      orderBy: { createdAt: 'desc' }
    });

    if (!ad) {
      console.log('❌ לא נמצאה מודעה');
      return;
    }

    console.log(`✅ מצאתי מודעה: ${ad.title} (${ad.id})`);

    // מחק את התמונה הישנה
    await prisma.adImage.deleteMany({
      where: { adId: ad.id }
    });

    // הוסף את התמונה האמיתית
    const realImage = await prisma.adImage.create({
      data: {
        id: require('uuid').v4(),
        adId: ad.id,
        url: '/uploads/test-image-1767874269815.svg',
        order: 0,
      }
    });

    console.log(`✅ תמונה עודכנה: ${realImage.url}`);

    // בדיקה סופית
    const adWithImage = await prisma.ad.findUnique({
      where: { id: ad.id },
      include: {
        AdImage: true,
        Category: true,
        City: true,
        User: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log('\n📊 תוצאה סופית:');
    console.log(`   כותרת: ${adWithImage?.title}`);
    console.log(`   סטטוס: ${adWithImage?.status}`);
    console.log(`   קטגוריה: ${adWithImage?.Category?.nameHe}`);
    console.log(`   עיר: ${adWithImage?.City?.nameHe}`);
    console.log(`   מפרסם: ${adWithImage?.User?.name} (${adWithImage?.User?.email})`);
    console.log(`   תמונות: ${adWithImage?.AdImage.length}`);
    
    if (adWithImage?.AdImage && adWithImage.AdImage.length > 0) {
      console.log('\n   🖼️ תמונות:');
      adWithImage.AdImage.forEach((img: any) => {
        console.log(`      - ${img.url}`);
      });
    }

    console.log('\n✅ המודעה מוכנה!');
    console.log('   התמונה תהיה זמינה ב: http://localhost:5000' + realImage.url);
    console.log('\n🎯 עכשיו אפשר לבדוק במסך המנהל ב: http://localhost:3000/admin/pending');

  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdWithRealImage();
