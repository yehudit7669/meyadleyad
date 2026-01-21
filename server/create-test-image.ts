import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function createTestImage() {
  try {
    // יצירת תמונת SVG פשוטה לבדיקה
    const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#4299e1"/>
  <text x="100" y="100" font-size="30" text-anchor="middle" fill="white">תמונת בדיקה</text>
  <text x="100" y="130" font-size="16" text-anchor="middle" fill="white">Test Image</text>
</svg>`;

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const fileName = `test-image-${Date.now()}.svg`;
    const filePath = path.join(uploadsDir, fileName);
    
    // יצירת קובץ
    fs.writeFileSync(filePath, svgContent);
    
    console.log(`✅ תמונת בדיקה נוצרה: ${fileName}`);
    console.log(`   נתיב מלא: ${filePath}`);
    console.log(`   גודל: ${fs.statSync(filePath).size} bytes`);
    
    // עכשיו תבדוק אם הקובץ נגיש דרך השרת
    console.log(`\n📡 לאחר הפעלת השרת, התמונה תהיה זמינה ב:`);
    console.log(`   ${config.appUrl}/uploads/${fileName}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ שגיאה:', error);
    await prisma.$disconnect();
  }
}

createTestImage();
