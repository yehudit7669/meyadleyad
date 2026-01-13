import { PDFService } from './src/modules/pdf/pdf.service';
import fs from 'fs/promises';
import path from 'path';

async function testEmailPDFGeneration() {
  console.log('🔍 Testing PDF Generation (Email Flow Simulation)...\n');

  try {
    // Use the EXACT same method that email uses
    const pdfService = new PDFService();
    
    // Get latest ad ID
    const adId = '085b10a5-65d2-4df1-ba2a-c078b01ea5dc'; // From previous check
    
    console.log(`📄 Generating PDF via generateAdPDFById (email flow)...`);
    console.log(`   Ad ID: ${adId}\n`);
    
    const pdfBuffer = await pdfService.generateAdPDFById(adId);

    // Save the PDF
    const outputDir = path.join(process.cwd(), 'test-output');
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `email-flow-test-${adId}.pdf`;
    const filepath = path.join(outputDir, filename);

    await fs.writeFile(filepath, pdfBuffer);

    console.log('✅ PDF generated successfully (email flow)!');
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`📊 Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log('\n🔍 Now check this PDF - it should be EXACTLY like what gets sent via email');
  } catch (error) {
    console.error('❌ Error occurred:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

testEmailPDFGeneration();
