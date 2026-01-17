import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAppointments() {
  console.log('🌱 Starting appointments seed...');

  // Get users
  const admin = await prisma.user.findFirst({ where: { email: 'admin@meyadleyad.com' } });
  const broker = await prisma.user.findFirst({ where: { email: 'broker@example.com' } });
  const user = await prisma.user.findFirst({ where: { email: 'user@example.com' } });

  if (!admin || !broker || !user) {
    console.log('❌ Required users not found. Run main seed first.');
    return;
  }

  // Try to get existing ads first
  let ads = await prisma.ad.findMany({ 
    where: { status: 'APPROVED' },
    take: 3 
  });
  
  if (ads.length < 3) {
    console.log('⚠️ Not enough approved ads found. Need at least 3 ads.');
    console.log('   Please create some ads first or approve existing ones.');
    return;
  }

  // Create appointments
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const appointments = [
    {
      adId: ads[0].id,
      requesterId: user.id,
      ownerId: ads[0].userId,
      date: tomorrow,
      status: 'PENDING' as const,
      note: 'אשמח לראות את הנכס מחר בבוקר',
    },
    {
      adId: ads[1].id,
      requesterId: user.id,
      ownerId: ads[1].userId,
      date: nextWeek,
      status: 'APPROVED' as const,
      note: 'מעוניין מאוד',
    },
    {
      adId: ads[2].id,
      requesterId: user.id,
      ownerId: ads[2].userId,
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'COMPLETED' as const,
      note: 'ביקור שהושלם',
    },
    {
      adId: ads[0].id,
      requesterId: user.id,
      ownerId: ads[0].userId,
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'REJECTED' as const,
      statusReason: 'המועד לא מתאים',
      note: 'בקשה נוספת',
    },
    {
      adId: ads[1].id,
      requesterId: user.id,
      ownerId: ads[1].userId,
      date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'CANCELED' as const,
      statusReason: 'הלקוח ביטל',
      note: 'פגישה מבוטלת',
    },
  ];

  for (const apt of appointments) {
    const created = await prisma.appointment.create({
      data: apt,
    });

    // Create history for non-pending appointments
    if (apt.status !== 'PENDING') {
      await prisma.appointmentHistory.create({
        data: {
          appointmentId: created.id,
          fromStatus: 'PENDING',
          toStatus: apt.status,
          reason: apt.statusReason,
          changedById: admin.id,
        },
      });
    }

    console.log(`  ✓ Created appointment: ${apt.status}`);
  }

  console.log('✅ Appointments seed completed!');
  console.log(`   - Created: ${appointments.length} appointments`);
}

seedAppointments()
  .catch((e) => {
    console.error('❌ Error seeding appointments:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
