import { PDFService } from './src/modules/pdf/pdf.service';
import fs from 'fs';
import path from 'path';
import prisma from './src/config/database';

async function testPDFGeneration() {
  try {
    console.log('🔍 Testing PDF Generation...\n');

    // Get the most recent ad
    const recentAd = await prisma.ad.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        User: true,
        Category: true,
        City: true,
        Street: true,
        AdImage: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!recentAd) {
      console.log('❌ No ads found');
      return;
    }

    console.log('📋 Ad Details:');
    console.log('   ID:', recentAd.id);
    console.log('   Title:', recentAd.title);
    console.log('   Category:', recentAd.Category.nameHe);
    console.log('   City:', recentAd.City?.nameHe || 'N/A');
    console.log('   Status:', recentAd.status);
    console.log('   Images:', recentAd.AdImage.length);
    console.log('   Custom Fields:', JSON.stringify(recentAd.customFields, null, 2));
    console.log('');

    const pdfService = new PDFService();
    
    console.log('📄 Generating PDF...');
    const pdfBuffer = await pdfService.generateAdPDFById(recentAd.id);
    
    const outputPath = path.join(__dirname, 'test-output', `ad-${recentAd.id}.pdf`);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ PDF generated successfully!');
    console.log('📁 Saved to:', outputPath);
    console.log('📊 Size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPDFGeneration();
