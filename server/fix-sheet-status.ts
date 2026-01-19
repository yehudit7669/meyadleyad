/**
 * עדכון כל הגיליונות הקיימים ל-ACTIVE
 */

import prisma from './src/config/database.js';

async function fixSheetStatus() {
  try {
    console.log('\n📋 מחפש גיליונות עם סטטוס DRAFT...\n');

    // מציאת כל הגיליונות DRAFT
    const draftSheets = await prisma.newspaperSheet.findMany({
      where: {
        status: 'DRAFT'
      },
      include: {
        category: {
          select: {
            nameHe: true
          }
        },
        city: {
          select: {
            nameHe: true
          }
        },
        _count: {
          select: {
            listings: true
          }
        }
      }
    });

    console.log(`נמצאו ${draftSheets.length} גיליונות DRAFT:\n`);

    for (const sheet of draftSheets) {
      console.log(`- ${sheet.title} (${sheet._count.listings} מודעות)`);
    }

    if (draftSheets.length === 0) {
      console.log('\n✅ אין גיליונות DRAFT - הכל תקין!\n');
      return;
    }

    // עדכון לכולם ל-ACTIVE
    const result = await prisma.newspaperSheet.updateMany({
      where: {
        status: 'DRAFT'
      },
      data: {
        status: 'ACTIVE'
      }
    });

    console.log(`\n✅ עודכנו ${result.count} גיליונות ל-ACTIVE\n`);
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSheetStatus();
