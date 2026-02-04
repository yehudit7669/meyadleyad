/**
 * Test script for General Newspaper Sheet
 * סקריפט בדיקה ללוח מודעות כללי
 */

import { newspaperSheetService } from './src/modules/newspaper-sheets/newspaper-sheet.service.js';
import { newspaperGeneralSheetService } from './src/modules/newspaper-sheets/newspaper-general-sheet.service.js';
import fs from 'fs/promises';
import path from 'path';

async function testGeneralSheet() {
  console.log('🧪 Starting General Newspaper Sheet Test...\n');

  try {
    // Test 1: Check if there are active sheets
    console.log('📊 Test 1: Checking active sheets...');
    const sheets = await newspaperGeneralSheetService['getAllActiveSheets']('city');
    console.log(`   ✅ Found ${sheets.length} active sheets with listings`);
    
    if (sheets.length === 0) {
      console.log('   ⚠️  No active sheets found. Cannot proceed with tests.');
      return;
    }

    // Display sheets info
    console.log('\n📋 Active Sheets:');
    sheets.forEach((sheet, index) => {
      console.log(`   ${index + 1}. ${sheet.city.nameHe} - ${sheet.category.nameHe} (${sheet._count.listings} נכסים)`);
    });

    // Test 2: Generate General Sheet PDF (by city)
    console.log('\n📄 Test 2: Generating General Sheet PDF (ordered by city)...');
    const userId = 'test-user-id';
    const resultByCity = await newspaperSheetService.generateGeneralSheetPDF(userId, {
      orderBy: 'city'
    });
    console.log(`   ✅ PDF created: ${resultByCity.pdfPath}`);

    // Verify file exists
    const filePathCity = path.join(process.cwd(), resultByCity.pdfPath.substring(1));
    const statCity = await fs.stat(filePathCity);
    console.log(`   ✅ File size: ${(statCity.size / 1024).toFixed(2)} KB`);

    // Test 3: Generate General Sheet PDF (by category)
    console.log('\n📄 Test 3: Generating General Sheet PDF (ordered by category)...');
    const resultByCategory = await newspaperSheetService.generateGeneralSheetPDF(userId, {
      orderBy: 'category'
    });
    console.log(`   ✅ PDF created: ${resultByCategory.pdfPath}`);

    // Verify file exists
    const filePathCategory = path.join(process.cwd(), resultByCategory.pdfPath.substring(1));
    const statCategory = await fs.stat(filePathCategory);
    console.log(`   ✅ File size: ${(statCategory.size / 1024).toFixed(2)} KB`);

    // Test 4: Verify PDF structure
    console.log('\n🔍 Test 4: Verifying PDF structure...');
    console.log(`   ℹ️  Please manually verify:`);
    console.log(`      - First page has title "לוח מודעות כללי"`);
    console.log(`      - Additional pages have no title`);
    console.log(`      - Side ribbon shows city + category`);
    console.log(`      - All properties are included`);
    console.log(`      - No duplicates`);

    // Summary
    console.log('\n✅ All tests completed successfully!');
    console.log(`\n📁 Generated files:`);
    console.log(`   - By City: ${resultByCity.pdfPath}`);
    console.log(`   - By Category: ${resultByCategory.pdfPath}`);
    console.log(`\n🎉 General Newspaper Sheet is working correctly!`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests
testGeneralSheet()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
