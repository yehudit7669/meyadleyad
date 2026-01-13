import prisma from './src/config/database';

async function checkAdImages() {
  console.log('🔍 Checking Ad Images URLs...\n');

  const ad = await prisma.ad.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      AdImage: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!ad) {
    console.log('❌ No ads found');
    return;
  }

  console.log(`📋 Ad ID: ${ad.id}`);
  console.log(`📋 Ad Title: ${ad.title}\n`);

  console.log(`Images (${ad.AdImage.length}):`);
  ad.AdImage.forEach((img, index) => {
    console.log(`\n  Image ${index + 1}:`);
    console.log(`    Order: ${img.order}`);
    console.log(`    URL: ${img.url}`);
    console.log(`    Original URL: ${img.originalUrl}`);
    console.log(`    Branded URL: ${img.brandedUrl}`);
  });

  await prisma.$disconnect();
}

checkAdImages();
