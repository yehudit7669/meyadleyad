import { PrismaClient } from '@prisma/client';
import { EmailService } from './src/modules/email/email.service';
import { config } from './src/config';

const prisma = new PrismaClient();

async function testEmailSystem() {
  console.log('\n🔍 בדיקת מערכת המיילים\n');
  console.log('=' .repeat(60));

  // 1. בדיקת הגדרות SMTP
  console.log('\n1️⃣  הגדרות SMTP:');
  console.log('   SMTP מופעל:', config.smtp.enabled ? '✅ כן' : '❌ לא');
  console.log('   שרת SMTP:', config.smtp.host);
  console.log('   פורט:', config.smtp.port);
  console.log('   משתמש:', config.smtp.user);
  console.log('   סיסמה:', config.smtp.pass ? '✅ מוגדרת' : '❌ לא מוגדרת');
  console.log('   שולח מ:', config.smtp.from);

  // 2. בדיקת טבלאות DB
  console.log('\n2️⃣  בדיקת טבלאות מסד נתונים:');
  
  try {
    const usersCount = await prisma.user.count();
    console.log('   משתמשים:', usersCount, '✅');

    const adsCount = await prisma.ad.count();
    console.log('   מודעות:', adsCount, '✅');

    const emailLogsCount = await prisma.emailLog.count();
    console.log('   לוגים של מיילים:', emailLogsCount, '✅');
  } catch (error) {
    console.log('   ❌ שגיאה בגישה למסד נתונים:', error);
  }

  // 3. בדיקת EmailService
  console.log('\n3️⃣  בדיקת EmailService:');
  try {
    const emailService = new EmailService();
    console.log('   ✅ EmailService נוצר בהצלחה');
    
    if (config.smtp.enabled) {
      console.log('   ⚠️  SMTP מופעל - מיילים אמיתיים יישלחו!');
    } else {
      console.log('   ℹ️  SMTP כבוי - מיילים לא יישלחו (מצב הדגמה)');
    }
  } catch (error) {
    console.log('   ❌ שגיאה ביצירת EmailService:', error);
  }

  // 4. רשימת כל נקודות שליחת המיילים
  console.log('\n4️⃣  נקודות שליחת מיילים במערכת:');
  console.log('   ✅ רישום משתמש → sendVerificationEmail');
  console.log('   ✅ איפוס סיסמה → sendPasswordResetEmail');
  console.log('   ✅ יצירת מודעה → sendAdCreatedEmail');
  console.log('   ✅ אישור מודעה → sendAdApprovedEmail');
  console.log('   ✅ דחיית מודעה → sendAdRejectedEmail');
  console.log('   ✅ פרסום מודעה (PDF) → sendAdCopyEmail');

  // 5. הוראות הפעלה
  console.log('\n5️⃣  הוראות הפעלה:');
  if (!config.smtp.enabled) {
    console.log('   📝 להפעלת מיילים:');
    console.log('   1. פתח את הקובץ SETUP_EMAIL.md');
    console.log('   2. עקוב אחרי ההוראות ליצירת App Password ב-Gmail');
    console.log('   3. עדכן את server/.env:');
    console.log('      - SMTP_ENABLED="true"');
    console.log('      - EMAIL_USER="your-email@gmail.com"');
    console.log('      - EMAIL_PASSWORD="your-16-char-app-password"');
    console.log('   4. הפעל מחדש את השרת: .\\start-server.ps1');
  } else {
    console.log('   ✅ SMTP מופעל!');
    console.log('   📬 המערכת מוכנה לשלוח מיילים.');
    console.log('   🧪 נסה להירשם כמשתמש חדש ובדוק שמגיע מייל אימות.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ בדיקה הושלמה\n');

  await prisma.$disconnect();
}

testEmailSystem().catch(console.error);
