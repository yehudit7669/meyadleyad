import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdStatus() {
  const statuses = await prisma.ad.groupBy({
    by: ['status'],
    _count: true
  });
  
  console.log('Ad Status Count:');
  console.log(JSON.stringify(statuses, null, 2));
  
  const allAds = await prisma.ad.findMany({
    select: {
      id: true,
      title: true,
      status: true
    },
    take: 10
  });
  
  console.log('\nSample Ads:');
  console.log(JSON.stringify(allAds, null, 2));
  
  await prisma.$disconnect();
}

checkAdStatus();
