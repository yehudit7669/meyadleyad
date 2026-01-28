# 🚀 Email Operations - מדריך הפעלה מהיר

## סקירה כללית

מערכת זו מאפשרת למשתמשים לבצע כל פעולה דרך דואר אלקטרוני:
- פרסום מודעות חדשות
- עדכון מודעות קיימות
- הסרת מודעות
- הרשמה/ביטול רשימת תפוצה

## 📋 שלבי הפעלה

### שלב 1: הרצת Migration

```powershell
cd server
npx prisma migrate dev --name email_operations_system
npx prisma generate
```

**תוצאה צפויה:**
```
✔ Generated Prisma Client
✔ Database migration complete
```

### שלב 2: הגדרת משתני סביבה

**קובץ:** `server/.env`

```env
# Email Operations - הוסף לקובץ הקיים
EMAIL_OPERATIONS_ENABLED=true

# Google Forms (תוכל להגדיר מאוחר יותר)
GOOGLE_FORM_PUBLISH_AD=https://forms.google.com/your-form-id
GOOGLE_FORM_WANTED_AD=https://forms.google.com/your-form-id
GOOGLE_FORM_UPDATE_AD=https://forms.google.com/your-form-id

# Rate Limits
EMAIL_RATE_LIMIT_HOURLY=10
EMAIL_RATE_LIMIT_DAILY=50
EMAIL_COOLDOWN_HOURS=24

# Webhook Secret (לאבטחה)
EMAIL_WEBHOOK_SECRET=your-random-secret-key-123456
```

### שלב 3: הפעלת השרת

```powershell
npm run dev
```

**אמת שהשרת רץ:**
```
Server running on port 5000
✓ Prisma connected
✓ Email Operations routes loaded
```

## 🧪 בדיקות ראשוניות

### בדיקה 1: Test Email (משתמש Admin)

קבל תחילה Admin token:

```powershell
# התחבר כמנהל
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"your-password"}'

$token = $loginResponse.access_token
```

שלח מייל טסט:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/email-operations/inbound/test" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Body '{
    "from": "testuser@email.com",
    "subject": "פרסום מודעה: דירה להשכרה",
    "text": "אני רוצה לפרסם מודעה",
    "html": "<p>אני רוצה לפרסם מודעה</p>"
  }'
```

**תוצאה צפויה:**
```json
{
  "success": true,
  "message": "Email processed successfully",
  "commandType": "PUBLISH_AD",
  "requestId": "req_abc123"
}
```

### בדיקה 2: סטטיסטיקות

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/email-operations/inbound/stats" `
  -Headers @{ "Authorization" = "Bearer $token" }
```

**תוצאה צפויה:**
```json
{
  "total": 1,
  "processed": 1,
  "pending": 0,
  "failed": 0,
  "last24Hours": 1
}
```

### בדיקה 3: Audit Log

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/email-operations/audit" `
  -Headers @{ "Authorization" = "Bearer $token" }
```

## 🌐 הגדרת Email Provider (Production)

### אופציה 1: SendGrid (מומלץ)

**1. יצירת Inbound Parse:**

```
SendGrid → Settings → Inbound Parse → Add Host & URL
```

**2. הגדרות:**
- Hostname: `email.yourdomain.com`
- URL: `https://yourdomain.com/api/email-operations/inbound/webhook`
- POST the raw, full MIME message: ✅ Checked

**3. MX Record (בספק הדומיין):**
```
Type: MX
Host: email.yourdomain.com
Value: mx.sendgrid.net
Priority: 10
TTL: 3600
```

**4. בדיקת תקינות:**

שלח מייל ל: `anything@email.yourdomain.com`

```
To: test@email.yourdomain.com
Subject: פרסום מודעה
Body: בדיקה
```

בדוק logs:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/email-operations/inbound/stats" `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### אופציה 2: Mailgun

**1. יצירת Route:**

```
Mailgun → Receiving → Routes → Create Route
```

**2. הגדרות:**
```
Expression Type: Match Recipient
Recipient: .*@email.yourdomain.com
Actions: Forward to URL
URL: https://yourdomain.com/api/email-operations/inbound/webhook
Priority: 0
```

**3. MX Record:**
```
Type: MX
Host: email.yourdomain.com
Value: mxa.mailgun.org
Priority: 10
```

## 📝 הגדרת Google Forms

### יצירת טופס פרסום מודעה

**1. צור טופס חדש:**
```
Google Forms → Blank Form
```

**2. הוסף שדות:**

| שדה | סוג | חובה |
|-----|------|------|
| Email | Short answer | ✅ |
| Request ID | Short answer | ✅ (hidden) |
| כותרת המודעה | Short answer | ✅ |
| תיאור | Paragraph | ✅ |
| קטגוריה | Dropdown | ✅ |
| עיר | Dropdown | ✅ |
| מחיר | Short answer | ❌ |
| טלפון | Short answer | ❌ |
| תמונות (URLs) | Paragraph | ❌ |

**3. Pre-fill URL:**

```
Settings → Get pre-filled link
- Email: test@example.com
- Request ID: req_123

Copy link → עדכן ב-.env:
GOOGLE_FORM_PUBLISH_AD=https://docs.google.com/forms/d/e/1FAIpQL.../viewform?entry.123456={email}&entry.789012={requestId}
```

**4. Apps Script Webhook:**

```
Extensions → Apps Script
```

**קוד:**
```javascript
function onFormSubmit(e) {
  const responses = e.response.getItemResponses();
  const payload = {
    formId: 'publish_ad',
    timestamp: new Date().toISOString(),
    responses: {}
  };
  
  responses.forEach(item => {
    payload.responses[item.getItem().getTitle()] = item.getResponse();
  });
  
  const url = 'https://yourdomain.com/api/email-operations/forms/submit';
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      'X-Form-Token': 'YOUR_SECRET_TOKEN'
    }
  };
  
  try {
    UrlFetchApp.fetch(url, options);
    Logger.log('✅ Webhook sent successfully');
  } catch (error) {
    Logger.log('❌ Error: ' + error);
  }
}
```

**5. הגדרת Trigger:**
```
Triggers → Add Trigger
- Choose function: onFormSubmit
- Event source: From form
- Event type: On form submit
Save
```

## ✅ בדיקת Flow מלא

### תרחיש: משתמש רשום מפרסם מודעה

**שלב 1: שליחת מייל**
```
To: ads@email.yourdomain.com
Subject: פרסום מודעה: דירה להשכרה בתל אביב
From: user@registered-email.com
```

**שלב 2: קבלת מייל תגובה**
```
From: no-reply@yourdomain.com
Subject: בקשתך לפרסום מודעה התקבלה

שלום,

קיבלנו את בקשתך לפרסום מודעה.
נא למלא את הטופס הבא: [קישור לטופס]

מספר בקשה: req_abc123
```

**שלב 3: מילוי טופס**
- המשתמש לוחץ על הקישור
- ממלא פרטי מודעה
- שולח טופס

**שלב 4: יצירת מודעה**
```sql
-- מודעה נוצרת במצב PENDING
SELECT * FROM "Ad" WHERE status = 'PENDING';
```

**שלב 5: אישור מנהל**
```
Admin Panel → Pending Ads → Approve
```

**שלב 6: מייל אישור אוטומטי**
```
From: no-reply@yourdomain.com
Subject: מודעתך מספר 12345 פורסמה בהצלחה

שלום,

מודעתך "דירה להשכרה בתל אביב" פורסמה בהצלחה!

מספר מודעה: 12345
צפייה: https://yourdomain.com/ads/12345

לעדכון: שלח מייל עם נושא "עדכון מודעה 12345"
להסרה: שלח מייל עם נושא "הסרת מודעה 12345"
```

## 🔍 ניטור ובדיקת תקינות

### בדיקה יומית

```powershell
# Script לבדיקת תקינות
$token = "YOUR_ADMIN_TOKEN"

# 1. בדיקת סטטיסטיקות
$stats = Invoke-RestMethod -Uri "http://localhost:5000/api/email-operations/inbound/stats" `
  -Headers @{ "Authorization" = "Bearer $token" }

Write-Host "📊 Stats: $($stats.total) emails processed, $($stats.failed) failed"

# 2. בדיקת rate limits
$rateLimitCheck = Invoke-RestMethod `
  -Uri "http://localhost:5000/api/email-operations/check-rate-limit" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Body '{"email":"test@email.com"}'

if ($rateLimitCheck.allowed) {
  Write-Host "✅ Rate limiting working"
} else {
  Write-Host "⚠️ Rate limit reached"
}

# 3. בדיקת audit log
$audit = Invoke-RestMethod -Uri "http://localhost:5000/api/email-operations/audit?limit=10" `
  -Headers @{ "Authorization" = "Bearer $token" }

Write-Host "📝 Last audit: $($audit.data[0].commandType) at $($audit.data[0].timestamp)"
```

### Query שימושיות

```sql
-- סה"כ מיילים היום
SELECT COUNT(*) FROM "EmailInboundMessage" 
WHERE "receivedAt" > NOW() - INTERVAL '24 hours';

-- פקודות פופולריות
SELECT "commandType", COUNT(*) as count
FROM "EmailRequest"
GROUP BY "commandType"
ORDER BY count DESC;

-- שיעור הצלחה
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM "EmailRequest"
GROUP BY status;

-- משתמשים פעילים
SELECT u.email, COUNT(er.id) as email_requests
FROM "User" u
JOIN "EmailRequest" er ON u.id = er."userId"
WHERE er."createdAt" > NOW() - INTERVAL '7 days'
GROUP BY u.email
ORDER BY email_requests DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### בעיה: מיילים לא מגיעים

**בדיקות:**
```powershell
# 1. בדוק MX record
nslookup -type=mx email.yourdomain.com

# 2. בדוק webhook בספק
# SendGrid: Settings → Inbound Parse → View webhook logs
# Mailgun: Logs → Search for forwarded emails

# 3. בדוק שהשרת מאזין
netstat -an | findstr :5000
```

**פתרון:**
- וודא MX record מוגדר נכון (יכול לקחת עד 48 שעות)
- בדוק firewall rules
- נסה manual webhook test

### בעיה: Rate limit חוסם משתמשים לגיטימיים

```sql
-- בדיקה
SELECT * FROM "EmailRateLimit" 
WHERE email = 'user@email.com';

-- איפוס
DELETE FROM "EmailRateLimit" 
WHERE email = 'user@email.com';
```

### בעיה: Google Forms לא שולח webhook

**בדיקות:**
1. Apps Script → Executions → בדוק שגיאות
2. בדוק שה-trigger מוגדר נכון
3. בדוק שה-URL נכון ב-`UrlFetchApp.fetch()`

**פתרון:**
```javascript
// הוסף logging מפורט
function onFormSubmit(e) {
  Logger.log('🔍 Starting webhook...');
  Logger.log('Responses: ' + JSON.stringify(e.response));
  
  // ... rest of code
  
  Logger.log('✅ Webhook completed');
}
```

## 📊 Dashboard (אופציונלי)

### מסך ניהול Email Operations

יצירת component חדש: `src/components/admin/EmailOperationsDashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import api from '../../api/apiClient';

export default function EmailOperationsDashboard() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    api.get('/email-operations/inbound/stats')
      .then(res => setStats(res.data));
  }, []);
  
  return (
    <div className="email-ops-dashboard">
      <h2>Email Operations Statistics</h2>
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Emails</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Processed</h3>
            <p>{stats.processed}</p>
          </div>
          <div className="stat-card">
            <h3>Failed</h3>
            <p>{stats.failed}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 🎉 סיום

המערכת כעת מוכנה לשימוש!

**בדיקת תקינות סופית:**
1. ✅ Migration רץ
2. ✅ משתני סביבה מוגדרים
3. ✅ Test email עובד
4. ✅ Webhook מוגדר (production)
5. ✅ Google Forms מחובר
6. ✅ Flow מלא עובד

**צעדים הבאים:**
- שלח מייל אמיתי לבדיקה
- הוסף טפסים נוספים (wanted, update)
- הגדר ניטור אוטומטי
- צור dashboard למנהלים

---

**תמיכה:** אם יש בעיה, בדוק קודם את ה-audit log ואת ה-stats endpoint!
