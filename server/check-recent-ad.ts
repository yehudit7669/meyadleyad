import prisma from './src/config/database';

async function checkRecentAd() {
  try {
    const ads = await prisma.ad.findMany({
      where: {
        title: {
          contains: 'חדרים באביי'
        }
      },
      include: {
        User: {
          select: {
            email: true,
            isEmailVerified: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });

    console.log('Recent ad:', JSON.stringify(ads, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentAd();
