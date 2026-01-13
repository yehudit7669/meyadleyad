import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function showCities() {
  const cities = await prisma.city.findMany({ take: 5 });
  console.log('Cities:', cities);
  await prisma.$disconnect();
}

showCities();
