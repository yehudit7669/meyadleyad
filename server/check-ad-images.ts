import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImages() {
  try {
    const latestAd = await prisma.ad.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        AdImage: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!latestAd) {
      console.log('No ads found');
      return;
    }

    console.log('Latest Ad:', latestAd.title);
    console.log('Created:', latestAd.createdAt);
    console.log('\nImages:');
    latestAd.AdImage.forEach((img, idx) => {
      console.log(`\nImage ${idx + 1}:`);
      console.log('  url:', img.url);
      console.log('  originalUrl:', img.originalUrl);
      console.log('  brandedUrl:', img.brandedUrl);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();
