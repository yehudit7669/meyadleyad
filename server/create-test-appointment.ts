import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestAppointment() {
  console.log('🌱 Creating test appointment...');

  // Get admin user
  const admin = await prisma.user.findFirst({ 
    where: { email: 'admin@meyadleyad.com' } 
  });

  if (!admin) {
    console.log('❌ Admin not found. Run seed first.');
    return;
  }

  // Create a test ad first
  const category = await prisma.category.findFirst();
  if (!category) {
    console.log('❌ No category found.');
    return;
  }

  const city = await prisma.city.findFirst({ where: { name: 'Beit Shemesh' } });
  if (!city) {
    console.log('❌ No city found.');
    return;
  }

  // Create ad
  const ad = await prisma.ad.upsert({
    where: { id: 'test-ad-for-appointments' },
    update: {},
    create: {
      id: 'test-ad-for-appointments',
      userId: admin.id,
      categoryId: category.id,
      cityId: city.id,
      title: 'דירה לבדיקת פגישות',
      description: 'דירה זו נוצרה לבדיקת מערכת הפגישות',
      updatedAt: new Date(),
      status: 'APPROVED',
    },
  });

  console.log('✅ Created test ad');

  // Create appointment
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const appointment = await prisma.appointment.create({
    data: {
      adId: ad.id,
      requesterId: admin.id,
      ownerId: admin.id,
      date: tomorrow,
      status: 'PENDING',
      note: 'פגישת דוגמה לבדיקת המערכת',
    },
  });

  console.log('✅ Created test appointment:', appointment.id);

  // Create another one with APPROVED status
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const appointment2 = await prisma.appointment.create({
    data: {
      adId: ad.id,
      requesterId: admin.id,
      ownerId: admin.id,
      date: nextWeek,
      status: 'APPROVED',
      note: 'פגישה מאושרת',
    },
  });

  // Add history to the approved one
  await prisma.appointmentHistory.create({
    data: {
      appointmentId: appointment2.id,
      fromStatus: 'PENDING',
      toStatus: 'APPROVED',
      changedById: admin.id,
    },
  });

  console.log('✅ Created approved appointment:', appointment2.id);
  console.log('\n📋 Test appointments ready!');
  console.log('Navigate to /admin/appointments to see them.');
}

createTestAppointment()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
