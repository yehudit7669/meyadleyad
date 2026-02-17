/**
 * 🧪 SendGrid Email Test
 * 
 * סקריפט לבדיקת שליחת מייל דרך SendGrid
 * וידוא שהמעבר מ-SMTP ל-SendGrid הצליח
 */

import { EmailService } from './src/modules/email/email.service';
import { config } from './src/config';
import dotenv from 'dotenv';

dotenv.config();

async function testSendGridEmail() {
  console.log('\n🔍 בדיקת מערכת SendGrid Email\n');
  console.log('='.repeat(60));

  // 1. בדיקת הגדרות SendGrid
  console.log('\n1️⃣  הגדרות SendGrid:');
  console.log('   Enabled:', config.sendgrid.enabled ? '✅ YES' : '❌ NO');
  console.log('   API Key:', config.sendgrid.apiKey ? '✅ Configured' : '❌ Not configured');
  console.log('   From Email:', config.sendgrid.fromEmail || '❌ Not set');
  console.log('   From Name:', config.sendgrid.fromName || 'Meyadleyad');

  if (!config.sendgrid.enabled) {
    console.log('\n❌ SendGrid is disabled!');
    console.log('\n📝 To enable SendGrid:');
    console.log('   1. Edit server/.env file');
    console.log('   2. Set SENDGRID_ENABLED=true');
    console.log('   3. Set SENDGRID_API_KEY=your-api-key');
    console.log('   4. Set SENDGRID_FROM_EMAIL=your-verified-email');
    console.log('   5. Run this script again');
    console.log('\n' + '='.repeat(60));
    return;
  }

  if (!config.sendgrid.apiKey) {
    console.log('\n❌ SendGrid API Key is not configured!');
    console.log('\n📝 Add to .env: SENDGRID_API_KEY=your-api-key');
    console.log('\n' + '='.repeat(60));
    return;
  }

  // 2. יצירת EmailService
  console.log('\n2️⃣  Initializing EmailService...');
  try {
    const emailService = new EmailService();
    console.log('   ✅ EmailService created successfully');
  } catch (error) {
    console.error('   ❌ Error creating EmailService:', error);
    return;
  }

  // 3. שליחת מייל בדיקה
  console.log('\n3️⃣  Sending test email...');
  
  const testEmail = config.sendgrid.fromEmail; // שולח לעצמו
  const subject = '🧪 SendGrid Test Email - meyadleyad';
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #1F3F3A;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #E6D3A3;
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
    }
    .success-box {
      background-color: #d4edda;
      border: 2px solid #28a745;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .success-box h2 {
      color: #155724;
      margin: 0 0 10px 0;
    }
    .info-list {
      background-color: #f9f9f9;
      border-right: 4px solid #C9A24D;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #f4f4f4;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>המקום - meyadleyad</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <h2>✅ SendGrid מותקן ופועל!</h2>
        <p>מערכת המיילים עברה בהצלחה מ-SMTP ל-SendGrid</p>
      </div>
      
      <h2 style="color: #1F3F3A;">פרטי הבדיקה:</h2>
      
      <div class="info-list">
        <p><strong>🚀 שירות:</strong> SendGrid API (@sendgrid/mail)</p>
        <p><strong>📧 שולח מ:</strong> ${config.sendgrid.fromEmail}</p>
        <p><strong>👤 שם השולח:</strong> ${config.sendgrid.fromName}</p>
        <p><strong>📅 תאריך:</strong> ${new Date().toLocaleString('he-IL')}</p>
      </div>

      <h3 style="color: #1F3F3A;">✅ מה בדקנו:</h3>
      <ul>
        <li>הגדרות SendGrid תקינות</li>
        <li>API Key מוגדר</li>
        <li>EmailService מאותחל</li>
        <li>שליחת מייל HTML עם RTL</li>
        <li>תמיכה בעברית ואמוג'י 🏠🌊✨</li>
      </ul>

      <h3 style="color: #1F3F3A;">🎯 נקודות שליחת מיילים במערכת:</h3>
      <ul>
        <li>רישום משתמש → אימות מייל</li>
        <li>איפוס סיסמה → מייל איפוס</li>
        <li>יצירת מודעה → אישור קבלה</li>
        <li>אישור מודעה → מייל אישור</li>
        <li>דחיית מודעה → מייל דחייה</li>
        <li>פרסום מודעה → PDF למשתמש</li>
        <li>תמיכה → מיילים אוטומטיים</li>
      </ul>
      
      <p style="margin-top: 30px; padding: 15px; background-color: #e7f3ff; border-radius: 4px; border-right: 4px solid #0066cc;">
        <strong>✨ הערה:</strong> כל המיילים במערכת משתמשים כעת ב-SendGrid בלבד.
        SMTP ו-Nodemailer הוסרו לחלוטין.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} המקום - amakom. כל הזכויות שמורות.</p>
      <p>Email powered by SendGrid 🚀</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const emailService = new EmailService();
    await emailService.sendEmail(testEmail, subject, html);
    
    console.log('   ✅ Email sent successfully!');
    console.log(`   📧 Sent to: ${testEmail}`);
    console.log('\n4️⃣  Next steps:');
    console.log('   1. Check your inbox at:', testEmail);
    console.log('   2. Verify the email looks good (RTL, Hebrew, styling)');
    console.log('   3. Check SendGrid dashboard for delivery stats');
    console.log('   4. Test other email flows (registration, password reset)');
  } catch (error) {
    console.error('   ❌ Error sending email:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed\n');
}

// הפעלת הבדיקה
testSendGridEmail().catch(console.error);
