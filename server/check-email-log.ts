import prisma from './src/config/database';

async function checkEmailLog() {
  try {
    // Get the most recent ad
    const recentAd = await prisma.ad.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        User: true,
        Category: true,
      },
    });

    if (!recentAd) {
      console.log('No ads found');
      return;
    }

    console.log('\n🔍 Most Recent Ad:');
    console.log('ID:', recentAd.id);
    console.log('Title:', recentAd.title);
    console.log('Status:', recentAd.status);
    console.log('User Email:', recentAd.User.email);
    console.log('Email Verified:', recentAd.User.isEmailVerified);
    console.log('Created:', recentAd.createdAt);

    // Check email logs for this ad
    const emailLogs = await prisma.emailLog.findMany({
      where: { adId: recentAd.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n📧 Email Logs:');
    if (emailLogs.length === 0) {
      console.log('No email logs found for this ad');
    } else {
      emailLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Email:` );
        console.log('   Type:', log.type);
        console.log('   Status:', log.status);
        console.log('   To:', log.recipientEmail);
        console.log('   Sent:', log.createdAt);
        if (log.errorMessage) {
          console.log('   Error:', log.errorMessage);
        }
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailLog();
