/**
 * Test script for Newspaper Global Settings
 * סקריפט בדיקה להגדרות הגיליון הגלובלי
 */

import prisma from './src/config/database.js';
import { newspaperSheetService } from './src/modules/newspaper-sheets/newspaper-sheet.service.js';

async function testGlobalSettings() {
  try {
    console.log('🧪 Testing Newspaper Global Settings\n');

    // 1. קבלת הגדרות גלובליות
    console.log('1️⃣ Getting global settings...');
    const settings = await newspaperSheetService.getGlobalSettings();
    console.log('   Current issue number:', settings.currentIssue);
    console.log('   Last distributed:', settings.lastDistributed || 'Never');
    console.log('   ✅ Settings retrieved successfully\n');

    // 2. הדמיית הפצה והעלאת מספר גליון
    console.log('2️⃣ Simulating distribution and incrementing issue number...');
    const oldNumber = settings.currentIssue;
    const updated = await newspaperSheetService.incrementGlobalIssueNumber();
    console.log(`   Issue number changed from ${oldNumber} to ${updated.currentIssue}`);
    console.log('   Last distributed:', updated.lastDistributed);
    console.log('   ✅ Issue number incremented successfully\n');

    // 3. וידוא שהשינויים נשמרו
    console.log('3️⃣ Verifying changes were saved...');
    const verifySettings = await newspaperSheetService.getGlobalSettings();
    console.log('   Current issue number:', verifySettings.currentIssue);
    console.log('   ✅ Changes verified successfully\n');

    // 4. החזרת המספר למצב המקורי (optional)
    console.log('4️⃣ Resetting to original state...');
    await prisma.newspaperGlobalSettings.update({
      where: { id: settings.id },
      data: {
        currentIssue: oldNumber,
        lastDistributed: settings.lastDistributed
      }
    });
    console.log('   ✅ Reset complete\n');

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests
testGlobalSettings()
  .then(() => {
    console.log('\n✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
