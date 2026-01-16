import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌆 Starting cities and streets seeding...\n');

  // Create Beit Shemesh city
  const beitShemesh = await prisma.city.upsert({
    where: { id: 'beit-shemesh' },
    update: {},
    create: {
      id: 'beit-shemesh',
      name: 'בית שמש',
      nameHe: 'בית שמש',
      slug: 'beit-shemesh',
      updatedAt: new Date(),
    },
  });

  console.log(`✅ City created: ${beitShemesh.name}`);

  // Beit Shemesh streets
  const streets = [
    'אברהם',
    'אהרון',
    'איינשטיין',
    'אלמוג',
    'אמציה',
    'אנילביץ',
    'אפק',
    'ארז',
    'בגין',
    'בן גוריון',
    'בן יהודה',
    'ברנר',
    'גולומב',
    'דגניה',
    'הבנים',
    'הגפן',
    'הזית',
    'החרוב',
    'הירדן',
    'המעפיל',
    'הנחל',
    'הנשיא',
    'הראשונים',
    'הרצל',
    'התאנה',
    'התמר',
    'זבוטינסקי',
    'חזון איש',
    'טרומפלדור',
    'יהודה הלוי',
    'כצנלסון',
    'לוי אשכול',
    'מודיעין',
    'מיכה',
    'משה',
    'נהר הירדן',
    'נחל דולב',
    'נחל חילזון',
    'נחל קדרון',
    'עמק זבולון',
    'עמק יזרעאל',
    'עמק חפר',
    'פינסקר',
    'צה"ל',
    'קדושי השואה',
    'רבין',
    'רמב"ם',
    'רש"י',
    'שד\' אגוז',
    'שד\' אריה',
    'שד\' הנשיא',
    'שד\' נהר הירדן',
    'שמואל הנביא',
    'שפירא',
  ];

  console.log(`\n📍 Creating ${streets.length} streets for ${beitShemesh.name}...\n`);

  let createdCount = 0;
  let existingCount = 0;

  for (const streetName of streets) {
    const streetId = `${beitShemesh.id}-${streetName.replace(/[^\w\u0590-\u05FF]+/g, '-').toLowerCase()}`;
    
    const existing = await prisma.street.findFirst({
      where: {
        cityId: beitShemesh.id,
        name: streetName,
      },
    });

    if (existing) {
      existingCount++;
      continue;
    }

    await prisma.street.create({
      data: {
        id: streetId,
        name: streetName,
        code: streetId,
        cityId: beitShemesh.id,
        updatedAt: new Date(),
      },
    });

    createdCount++;
  }

  console.log(`✅ Created ${createdCount} new streets`);
  console.log(`ℹ️  Skipped ${existingCount} existing streets`);

  // Show current count
  const totalStreets = await prisma.street.count({
    where: { cityId: beitShemesh.id },
  });

  console.log(`\n📊 Final count: ${totalStreets} streets in ${beitShemesh.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
