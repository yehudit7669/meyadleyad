import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBranding() {
  try {
    const config = await prisma.brandingConfig.findFirst();
    
    if (config) {
      console.log('✅ BrandingConfig exists:');
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log('❌ No BrandingConfig found!');
      console.log('Creating default config...');
      
      const newConfig = await prisma.brandingConfig.create({
        data: {
          logoUrl: null,
          position: 'BOTTOM_LEFT',
          opacity: 70,
          sizePct: 18,
          userId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || '',
        },
      });
      
      console.log('✅ Created default config:', newConfig);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBranding();
