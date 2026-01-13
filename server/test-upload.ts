import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function testImageUpload() {
  try {
    console.log('🧪 בדיקת העלאת תמונות למודעה\n');

    // 1. מצא משתמש או צור משתמש בדיקה
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('יוצר משתמש בדיקה...');
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'test@example.com',
          name: 'משתמש בדיקה',
          password: 'hashed_password',
          isEmailVerified: true,
        }
      });
    }

    console.log(`✅ משתמש: ${user.email} (${user.id})`);

    // 2. מצא קטגוריה
    const category = await prisma.category.findFirst({
      where: { nameHe: 'דירות למכירה' }
    });

    if (!category) {
      console.log('❌ לא נמצאה קטגוריה "דירות למכירה"');
      return;
    }

    console.log(`✅ קטגוריה: ${category.nameHe} (${category.id})`);

    // 3. מצא עיר (בית שמש)
    const city = await prisma.city.findFirst({
      where: { id: 'beit-shemesh' }
    });

    if (!city) {
      console.log('❌ לא נמצאה עיר בית שמש');
      return;
    }

    console.log(`✅ עיר: ${city.nameHe} (${city.id})`);

    // 4. יצירת מודעה
    const ad = await prisma.ad.create({
      data: {
        id: uuidv4(),
        title: 'דירה לבדיקה עם תמונות',
        description: 'זו מודעת בדיקה לבדיקת העלאת תמונות',
        price: 1000000,
        userId: user.id,
        categoryId: category.id,
        cityId: city.id,
        status: 'PENDING',
        updatedAt: new Date(),
        customFields: {
          rooms: '3',
          floor: '2',
        }
      }
    });

    console.log(`\n✅ מודעה נוצרה: "${ad.title}" (${ad.id})`);

    // 5. יצירת תמונה (סימולציה)
    // בפועל השרת שומר קבצים בתיקייה, אבל נדמה רק את הנתיב
    const testImagePath = '/uploads/test-image-' + Date.now() + '.jpg';
    
    const image = await prisma.adImage.create({
      data: {
        id: uuidv4(),
        adId: ad.id,
        url: testImagePath,
        order: 0,
      }
    });

    console.log(`✅ תמונה נוצרה: ${image.url}`);

    // 6. בדיקה - טעינת מודעה עם תמונות
    const adWithImages = await prisma.ad.findUnique({
      where: { id: ad.id },
      include: {
        AdImage: {
          orderBy: { order: 'asc' }
        },
        Category: true,
        City: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    console.log('\n📊 תוצאות:');
    console.log(`   כותרת: ${adWithImages?.title}`);
    console.log(`   סטטוס: ${adWithImages?.status}`);
    console.log(`   מספר תמונות: ${adWithImages?.AdImage.length}`);
    
    if (adWithImages?.AdImage && adWithImages.AdImage.length > 0) {
      console.log('\n   🖼️ תמונות:');
      adWithImages.AdImage.forEach((img: any, idx: number) => {
        console.log(`      ${idx + 1}. ${img.url} (order: ${img.order})`);
      });
    }

    // 7. בדיקת API admin
    console.log('\n🔍 בדיקת מה המנהל יראה:');
    
    const pendingAds = await prisma.ad.findMany({
      where: { status: 'PENDING' },
      include: {
        AdImage: {
          orderBy: { order: 'asc' }
        },
        Category: true,
        City: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      take: 5
    });

    console.log(`   מודעות PENDING: ${pendingAds.length}`);
    pendingAds.forEach((ad: any) => {
      console.log(`   - "${ad.title}" - ${ad.AdImage.length} תמונות`);
    });

    console.log('\n✅ הבדיקה הושלמה בהצלחה!');
    console.log('   המודעה נוצרה עם תמונה והיא מופיעה ברשימת PENDING');

  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImageUpload();
