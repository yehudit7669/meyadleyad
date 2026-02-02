import prisma from './src/config/database';

async function checkFilters() {
  const pref = await prisma.userPreference.findFirst({
    where: { userId: '0c544d93-b521-4f57-96d5-18147359e4ac' }
  });
  
  const user = await prisma.user.findUnique({
    where: { id: '0c544d93-b521-4f57-96d5-18147359e4ac' },
    select: { email: true, name: true }
  });
  
  console.log('\n=== User Preference ===');
  console.log('User:', user?.email);
  console.log('Notify New Matches:', pref?.notifyNewMatches);
  console.log('Filters:', JSON.stringify(pref?.filters, null, 2));
  
  const ad = await prisma.ad.findFirst({
    where: { id: 'f810ddfd-2fcf-4bb6-8353-1cc87d997fb2' },
    include: { Category: true, City: true }
  });
  
  console.log('\n=== Ad Details ===');
  console.log('Title:', ad?.title);
  console.log('Category ID:', ad?.categoryId);
  console.log('Category Name:', ad?.Category.nameHe);
  console.log('City ID:', ad?.cityId);
  console.log('City Name:', ad?.City?.nameHe);
  console.log('Price:', ad?.price);
  console.log('Custom Fields:', JSON.stringify(ad?.customFields, null, 2));
  
  await prisma.$disconnect();
}

checkFilters().catch(console.error);
