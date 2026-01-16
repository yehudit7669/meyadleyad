import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

function mapRoleToDisplay(role: UserRole): string {
  switch (role) {
    case UserRole.USER:
      return 'משתמש פרטי';
    case UserRole.BROKER:
      return 'מתווך';
    case UserRole.SERVICE_PROVIDER:
      return 'נותן שירות';
    case UserRole.ADMIN:
      return 'מנהל';
    case UserRole.SUPER_ADMIN:
      return 'מנהל על';
    case UserRole.MODERATOR:
      return 'מנהל צופה';
    default:
      return 'לא ידוע';
  }
}

async function main() {
  console.log('🔍 Testing users API response format...\n');

  const users = await prisma.user.findMany({
    take: 3,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      meetingsBlocked: true,
      weeklyDigestOptIn: true,
      _count: {
        select: {
          Ad: true,
        },
      },
    },
  });

  console.log('📊 Raw users from DB:');
  console.log(JSON.stringify(users, null, 2));

  console.log('\n📦 Formatted response (as API returns):');
  const formatted = users.map(user => ({
    id: user.id,
    name: user.name || 'משתמש ללא שם',
    email: user.email,
    role: user.role,
    roleType: mapRoleToDisplay(user.role),
    status: user.status,
    createdAt: user.createdAt,
    adsCount: user._count.Ad,
    meetingsBlocked: user.meetingsBlocked,
    emailDigestStatus: user.weeklyDigestOptIn,
  }));

  console.log(JSON.stringify(formatted, null, 2));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
