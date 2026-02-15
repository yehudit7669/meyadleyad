/**
 * Seed script for WhatsApp Groups
 * הרצה: npx ts-node prisma/seed-whatsapp-groups.ts
 */

import { PrismaClient, WhatsAppGroupStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWhatsAppGroups() {
  console.log('🌱 Starting WhatsApp Groups seed...');

  // Get some cities
  const cities = await prisma.city.findMany({
    take: 10,
  });

  const categories = await prisma.category.findMany({
    where: {
      parentId: null, // Only top-level categories
    },
    take: 5,
  });

  if (cities.length === 0 || categories.length === 0) {
    console.log('⚠️ No cities or categories found. Run seed.ts first.');
    return;
  }

  // Sample groups
  const groups = [
    {
      name: 'נכסים למכירה - תל אביב',
      internalCode: 'tlv-sale',
      status: WhatsAppGroupStatus.ACTIVE,
      cityScopes: [cities[0].id], // Tel Aviv
      categoryScopes: [categories[0].id], // Sale category
      dailyQuota: 10,
      allowDigest: true,
      inviteLink: null,
    },
    {
      name: 'השכרה - רמת גן',
      internalCode: 'rg-rent',
      status: WhatsAppGroupStatus.ACTIVE,
      cityScopes: cities.slice(1, 3).map(c => c.id), // Multiple cities
      categoryScopes: [categories[1]?.id].filter(Boolean),
      dailyQuota: 15,
      allowDigest: true,
    },
    {
      name: 'נכסים מסחריים - כללי',
      internalCode: 'commercial-all',
      status: WhatsAppGroupStatus.ACTIVE,
      cityScopes: [], // All cities
      categoryScopes: [categories[2]?.id].filter(Boolean),
      dailyQuota: 5,
      allowDigest: false,
    },
    {
      name: 'שכונת יד אליהו - כל סוגי הנכסים',
      internalCode: 'yad-eliyahu',
      status: WhatsAppGroupStatus.ACTIVE,
      cityScopes: [cities[0].id],
      regionScopes: ['מזרח'],
      categoryScopes: [], // All categories
      dailyQuota: 8,
      allowDigest: true,
    },
  ];

  for (const group of groups) {
    try {
      const created = await prisma.whatsAppGroup.create({
        data: group as any,
      });
      console.log(`✅ Created group: ${created.name} (${created.internalCode})`);
    } catch (error) {
      if ((error as any).code === 'P2002') {
        console.log(`⏭️ Group ${group.internalCode} already exists, skipping...`);
      } else {
        console.error(`❌ Error creating group ${group.internalCode}:`, error);
      }
    }
  }

  console.log('✅ WhatsApp Groups seed completed!');
}

seedWhatsAppGroups()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
