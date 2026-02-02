import prisma from './src/config/database';

async function debugNotifications() {
  console.log('\n=== Debugging Notifications ===\n');

  // Get latest ad
  const latestAd = await prisma.ad.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: {
      Category: true,
      City: true,
      User: true,
    },
  });

  if (!latestAd) {
    console.log('No active ads found');
    return;
  }

  console.log('📌 Latest Active Ad:');
  console.log('  ID:', latestAd.id);
  console.log('  Title:', latestAd.title);
  console.log('  Category:', latestAd.Category.nameHe);
  console.log('  City:', latestAd.City?.nameHe);
  console.log('  Price:', latestAd.price);
  console.log('  AdType:', latestAd.adType);
  console.log('  PropertyType:', latestAd.customFields?.propertyType);
  console.log('  Created:', latestAd.createdAt);

  // Get global settings
  const globalSettings = await prisma.notificationSettings.findFirst();
  console.log('\n🌍 Global Settings:');
  console.log('  Enabled:', globalSettings?.enabled);

  // Get all users with notification preferences
  const usersWithPrefs = await prisma.userPreference.findMany({
    where: {
      notifyNewMatches: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  console.log('\n👥 Users with Notification Preferences:', usersWithPrefs.length);

  for (const pref of usersWithPrefs) {
    console.log('\n---');
    console.log('User:', pref.user.email);
    console.log('Notify:', pref.notifyNewMatches);
    console.log('Filters:', JSON.stringify(pref.filters, null, 2));
    
    // Get user override
    const override = await prisma.userNotificationOverride.findUnique({
      where: { userId: pref.userId },
    });
    
    if (override) {
      console.log('Override:', override.mode, 
                  'expires:', override.expiresAt);
      if (override.expiresAt < new Date()) {
        console.log('  ⚠️ Override EXPIRED');
      }
    } else {
      console.log('Override: None');
    }

    // Check if filters match
    const filters = pref.filters as any;
    let matches = true;
    const reasons = [];

    if (filters?.categoryIds?.length > 0) {
      if (!filters.categoryIds.includes(latestAd.categoryId)) {
        matches = false;
        reasons.push(`Category mismatch: ${latestAd.categoryId} not in ${filters.categoryIds}`);
      }
    }

    if (filters?.cityIds?.length > 0) {
      if (!latestAd.cityId || !filters.cityIds.includes(latestAd.cityId)) {
        matches = false;
        reasons.push(`City mismatch: ${latestAd.cityId} not in ${filters.cityIds}`);
      }
    }

    if (latestAd.price) {
      if (filters?.minPrice && latestAd.price < filters.minPrice) {
        matches = false;
        reasons.push(`Price too low: ${latestAd.price} < ${filters.minPrice}`);
      }
      if (filters?.maxPrice && latestAd.price > filters.maxPrice) {
        matches = false;
        reasons.push(`Price too high: ${latestAd.price} > ${filters.maxPrice}`);
      }
    }

    if (filters?.propertyTypes?.length > 0) {
      const propertyType = latestAd.customFields?.propertyType;
      if (!propertyType || !filters.propertyTypes.includes(propertyType)) {
        matches = false;
        reasons.push(`PropertyType mismatch: ${propertyType} not in ${filters.propertyTypes}`);
      }
    }

    console.log('Matches Filters:', matches ? '✅ YES' : '❌ NO');
    if (!matches) {
      reasons.forEach(r => console.log('  -', r));
    }
  }

  // Check notification queue
  const queued = await prisma.notificationQueue.findMany({
    where: { adId: latestAd.id },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  console.log('\n📧 Notification Queue for this ad:', queued.length);
  queued.forEach(q => {
    console.log(`  - ${q.user.email}: ${q.status}`);
  });

  await prisma.$disconnect();
}

debugNotifications().catch(console.error);
