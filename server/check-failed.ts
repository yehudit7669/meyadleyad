import prisma from './src/config/database';

async function checkFailedNotification() {
  const failed = await prisma.notificationQueue.findFirst({
    where: {
      adId: '6c49fabf-4250-4d30-9e8f-b5e21297b7b4',
      status: 'FAILED',
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });

  if (failed) {
    console.log('\n❌ Failed Notification:');
    console.log('User:', failed.user.email);
    console.log('Status:', failed.status);
    console.log('Retry Count:', failed.retryCount);
    console.log('Error Message:', failed.errorMessage);
    console.log('Sent At:', failed.sentAt);
    console.log('Created At:', failed.createdAt);
  } else {
    console.log('No failed notifications found');
  }

  await prisma.$disconnect();
}

checkFailedNotification().catch(console.error);
