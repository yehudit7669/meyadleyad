import { PrismaClient } from '@prisma/client';
import { EmailService } from './src/modules/email/email.service';
import { config } from './src/config';

const prisma = new PrismaClient();

async function testEmailSystem() {
  console.log('\n🔍 בדיקת מערכת המיילים\n');
  console.log('=' .repeat(60));

  // 1. בדיקת הגדרות SendGrid
  console.log('\n1️⃣  הגדרות SendGrid:');
  console.log('   SendGrid מופעל:', config.sendgrid.enabled ? '✅ כן' : '❌ לא');
  console.log('   API Key:', config.sendgrid.apiKey ? '✅ מוגדר' : '❌ לא מוגדר');
  console.log('   שולח מ:', config.sendgrid.fromEmail);
  console.log('   שם השולח:', config.sendgrid.fromName);

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
    
    if (config.sendgrid.enabled) {
      console.log('   ✅ SendGrid מופעל - מיילים אמיתיים יישלחו!');
    } else {
      console.log('   ℹ️  SendGrid כבוי - מיילים לא יישלחו (מצב הדגמה)');
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
  if (!config.sendgrid.enabled) {
    console.log('   📝 להפעלת מיילים:');
    console.log('   1. הירשם ל-SendGrid בכתובת https://sendgrid.com');
    console.log('   2. אמת את כתובת המייל שממנה תרצה לשלוח');
    console.log('   3. צור API Key עם הרשאות Mail Send');
    console.log('   4. עדכן את server/.env:');
    console.log('      - SENDGRID_ENABLED="true"');
    console.log('      - SENDGRID_API_KEY="your-api-key"');
    console.log('      - SENDGRID_FROM_EMAIL="your-verified-email@domain.com"');
    console.log('      - SENDGRID_FROM_NAME="meyadleyad"');
    console.log('   5. הפעל מחדש את השרת: npm run dev');
  } else {
    console.log('   ✅ SendGrid מופעל!');
    console.log('   📬 המערכת מוכנה לשלוח מיילים.');
    console.log('   🧪 נסה להירשם כמשתמש חדש ובדוק שמגיע מייל אימות.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ בדיקה הושלמה\n');

  await prisma.$disconnect();
}

testEmailSystem().catch(console.error);
