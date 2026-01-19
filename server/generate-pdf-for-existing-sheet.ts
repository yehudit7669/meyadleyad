/**
 * סקריפט חד-פעמי ליצירת PDF עבור גיליונות קיימים ללא PDF
 */

import prisma from './src/config/database.js';
import { newspaperSheetService } from './src/modules/newspaper-sheets/newspaper-sheet.service.js';

async function generatePdfsForExistingSheets() {
  try {
    // מציאת כל הגיליונות ללא PDF
    const sheets = await prisma.newspaperSheet.findMany({
      where: {
        pdfPath: null
      },
      include: {
        _count: {
          select: {
            listings: true
          }
        },
        category: {
          select: {
            nameHe: true
          }
        },
        city: {
          select: {
            nameHe: true
          }
        }
      }
    });

    console.log(`\n📊 נמצאו ${sheets.length} גיליונות ללא PDF\n`);

    if (sheets.length === 0) {
      console.log('✅ כל הגיליונות כבר יש להם PDF!');
      return;
    }

    for (const sheet of sheets) {
      console.log(`\n📰 מייצר PDF עבור: ${sheet.title}`);
      console.log(`   - מזהה: ${sheet.id}`);
      console.log(`   - מודעות: ${sheet._count.listings}`);
      console.log(`   - קטגוריה: ${sheet.category.nameHe}`);
      console.log(`   - עיר: ${sheet.city.nameHe}`);

      try {
        const result = await newspaperSheetService.generateSheetPDF(
          sheet.id,
          sheet.createdBy
        );

        console.log(`   ✅ PDF נוצר: ${result.pdfPath}`);
        console.log(`   📌 גרסה: ${result.version}`);
      } catch (error: any) {
        console.error(`   ❌ שגיאה: ${error.message}`);
      }
    }

    console.log(`\n✅ סיום! יצירת PDF עבור כל הגיליונות הקיימים.\n`);
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// הרצה
generatePdfsForExistingSheets();
