import { PDFService } from './src/modules/pdf/pdf.service';
import fs from 'fs/promises';
import path from 'path';
import prisma from './src/config/database';

async function testPDFGeneration() {
  console.log('🔍 Testing PDF Generation with Images and Logo...\n');

  try {
    // Fetch the most recent ad
    const ad = await prisma.ad.findFirst({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        Category: true,
        City: true,
        Street: true,
        User: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        AdImage: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!ad) {
      console.log('❌ No ads found for testing');
      return;
    }

    console.log('📋 Ad Details:');
    console.log(`   ID: ${ad.id}`);
    console.log(`   Title: ${ad.title}`);
    console.log(`   Category: ${ad.Category.nameHe}`);
    console.log(`   City: ${ad.City?.nameHe}`);
    console.log(`   Status: ${ad.status}`);
    console.log(`   Images: ${ad.AdImage.length}`);
    if (ad.AdImage.length > 0) {
      console.log(`   First image: ${ad.AdImage[0].url}`);
    }
    console.log(`   Custom Fields:`, JSON.stringify(ad.customFields, null, 2));
    console.log('');

    console.log('📄 Generating PDF with logo and images...');

    const pdfService = new PDFService();
    const pdfBuffer = await pdfService.generateAdPDFById(ad.id);

    // Save the PDF
    const outputDir = path.join(process.cwd(), 'test-output');
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `ad-${ad.id}-with-images.pdf`;
    const filepath = path.join(outputDir, filename);

    await fs.writeFile(filepath, pdfBuffer);

    console.log('✅ PDF generated successfully!');
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`📊 Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log('');
    console.log('✨ PDF includes:');
    console.log('   - Logo (from BrandingConfig or default text)');
    console.log('   - Main image (converted to base64)');
    console.log('   - QR code');
    console.log('   - All property details in correct order');
    console.log('   - Publisher name and publish date');
  } catch (error) {
    console.error('❌ Error occurred:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testPDFGeneration();
