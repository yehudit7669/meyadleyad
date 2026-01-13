import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkImages() {
  try {
    // ספירת כל התמונות
    const totalImages = await prisma.adImage.count();
    console.log(`\n📊 סה"כ תמונות ב-DB: ${totalImages}`);

    // מציאת מודעות עם תמונות
    const adsWithImages = await prisma.ad.findMany({
      where: {
        AdImage: {
          some: {}
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: { AdImage: true }
        }
      },
      take: 10
    });

    console.log(`\n📸 מודעות עם תמונות (${adsWithImages.length}):`);
    adsWithImages.forEach(ad => {
      console.log(`  - ${ad.title} (${ad.status}): ${ad._count.AdImage} תמונות`);
    });

    // דוגמה לתמונות
    const sampleImages = await prisma.adImage.findMany({
      take: 5,
      include: {
        Ad: {
          select: {
            title: true,
            status: true
          }
        }
      }
    });

    console.log(`\n🖼️ דוגמאות תמונות:`);
    sampleImages.forEach(img => {
      console.log(`  - URL: ${img.url}`);
      console.log(`    מודעה: ${img.Ad.title} (${img.Ad.status})`);
      console.log(`    Order: ${img.order}\n`);
    });

    // מודעות PENDING עם תמונות
    const pendingWithImages = await prisma.ad.findMany({
      where: {
        status: 'PENDING',
        AdImage: {
          some: {}
        }
      },
      select: {
        id: true,
        title: true,
        AdImage: {
          select: {
            url: true,
            order: true
          }
        }
      }
    });

    console.log(`\n⏳ מודעות PENDING עם תמונות: ${pendingWithImages.length}`);
    pendingWithImages.forEach(ad => {
      console.log(`  - ${ad.title}: ${ad.AdImage.length} תמונות`);
    });

  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();
