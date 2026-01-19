/**
 * מיזוג גיליונות כפולים - העברת מודעות לגיליון הראשי ומחיקת כפולים
 */

import prisma from './src/config/database.js';

async function mergeDuplicateSheets() {
  try {
    console.log('\n📋 מחפש גיליונות כפולים...\n');

    // מציאת כל הגיליונות
    const allSheets = await prisma.newspaperSheet.findMany({
      include: {
        category: { select: { nameHe: true } },
        city: { select: { nameHe: true } },
        listings: {
          include: {
            listing: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // קיבוץ לפי קטגוריה+עיר
    const groups = new Map<string, typeof allSheets>();
    
    for (const sheet of allSheets) {
      const key = `${sheet.categoryId}-${sheet.cityId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(sheet);
    }

    console.log(`נמצאו ${groups.size} קבוצות קטגוריה+עיר\n`);

    for (const [key, sheets] of groups) {
      if (sheets.length > 1) {
        console.log(`⚠️  כפילות: ${sheets[0].category.nameHe} - ${sheets[0].city.nameHe}`);
        console.log(`   ${sheets.length} גיליונות:`);
        
        // הגיליון הראשי (הראשון שנוצר)
        const mainSheet = sheets[0];
        console.log(`   📌 ראשי: ${mainSheet.id} (${mainSheet.listings.length} מודעות, ${mainSheet.status})`);
        
        // גיליונות כפולים
        const duplicates = sheets.slice(1);
        
        for (const duplicate of duplicates) {
          console.log(`   📄 כפול: ${duplicate.id} (${duplicate.listings.length} מודעות, ${duplicate.status})`);
          
          // העברת כל המודעות לגיליון הראשי
          for (const listing of duplicate.listings) {
            console.log(`      ↳ מעביר: ${listing.listing.title}`);
            
            // בדיקה שהמודעה לא כבר קיימת בגיליון הראשי
            const exists = await prisma.newspaperSheetListing.findFirst({
              where: {
                sheetId: mainSheet.id,
                listingId: listing.listingId
              }
            });
            
            if (!exists) {
              // עדכון ה-sheetId של המודעה לגיליון הראשי
              await prisma.newspaperSheetListing.update({
                where: { id: listing.id },
                data: { sheetId: mainSheet.id }
              });
              console.log(`         ✓ הועבר לגיליון הראשי`);
            } else {
              console.log(`         ⊗ כבר קיים בגיליון הראשי - מוחק כפילות`);
              await prisma.newspaperSheetListing.delete({
                where: { id: listing.id }
              });
            }
          }
          
          // מחיקת הגיליון הכפול
          await prisma.newspaperSheet.delete({
            where: { id: duplicate.id }
          });
          console.log(`      ✓ גיליון כפול נמחק`);
        }
        
        // עדכון הגיליון הראשי ל-ACTIVE
        await prisma.newspaperSheet.update({
          where: { id: mainSheet.id },
          data: { status: 'ACTIVE' }
        });
        console.log(`   ✅ גיליון ראשי עודכן ל-ACTIVE\n`);
      }
    }

    console.log('✅ סיום! כל הכפילויות טופלו.\n');
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mergeDuplicateSheets();
