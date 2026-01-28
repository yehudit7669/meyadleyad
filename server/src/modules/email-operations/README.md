# 📧 Email Operations System - מערכת פעולות דרך דואר אלקטרוני

## תיאור כללי

מערכת מלאה לניהול מודעות דרך דואר אלקטרוני, המאפשרת למשתמשים לבצע את כל הפעולות הבאות ללא כניסה לאתר:

- ✅ **פרסום מודעות** - PUBLISH_AD / PUBLISH_NEW
- ✅ **פרסום דרושים** - WANTED_AD / WANTED_NEW
- ✅ **עדכון מודעות** - UPDATE_AD
- ✅ **הסרת מודעות** - REMOVE_AD / DELETE_AD
- ✅ **ניהול רשימת תפוצה** - הרשמה, ביטול, עדכון העדפות

## ארכיטקטורה

### 🗄️ שכבת מסד נתונים (6 טבלאות)

1. **EmailInboundMessage** - מיילים נכנסים (webhook + IMAP)
2. **EmailRequest** - בקשות שעובדו
3. **PendingIntent** - כוונות ממתינות (למשתמשים לא רשומים)
4. **EmailOperationsMailingList** - רשימת תפוצה
5. **EmailRateLimit** - הגבלות קצב
6. **EmailAuditLog** - לוג ביקורת

### 🔧 שכבת שירותים (6 שירותים)

1. **EmailCommandParser** - פענוח פקודות מנושא + 5 שורות ראשונות
2. **EmailAuthVerifier** - אימות זהות ובעלות
3. **EmailRateLimiter** - הגבלת קצב + cooldown
4. **EmailAuditLogger** - רישום ביקורת כפול
5. **EmailOperationsTemplates** - תבניות מייל בעברית
6. **EmailOperationsOrchestrator** - תזמורת ראשית

### 🎮 שכבת בקרים (2 controllers)

1. **EmailInboundController** - webhook מיילים נכנסים
2. **EmailOperationsFormController** - טפסים + callbacks

## תהליכי עבודה

### 1️⃣ פרסום מודעה מהיר (משתמש רשום)

```
משתמש שולח מייל
 ↓
Subject: "פרסום מודעה: דירה להשכרה בתל אביב"
 ↓
מערכת זיהוי פקודה → PUBLISH_AD
 ↓
אימות זהות (כתובת מייל רשומה)
 ↓
Rate limiting (מכסה יומית)
 ↓
יצירת EmailRequest + EmailInboundMessage
 ↓
שליחת מייל עם קישור לטופס Google Forms
 ↓
משתמש ממלא טופס
 ↓
Webhook מגוגל → POST /email-operations/forms/submit
 ↓
יצירת מודעה במצב PENDING
 ↓
מנהל מאשר → admin.service.ts
 ↓
Email Confirmation: "מודעה מספר 12345 פורסמה בהצלחה"
```

### 2️⃣ פרסום מודעה (משתמש לא רשום)

```
אורח שולח מייל
 ↓
מערכת מזהה: לא רשום
 ↓
יצירת PendingIntent (commandType + rawData)
 ↓
שליחת מייל: "נא להירשם תחילה"
 ↓
משתמש נרשם באתר
 ↓
POST /email-operations/registration-completed
 ↓
עיבוד כל PendingIntent של המשתמש
 ↓
שליחת מיילים עם קישורי טפסים
```

### 3️⃣ עדכון/הסרת מודעה

```
משתמש: "עדכון מודעה 12345"
 ↓
אימות בעלות על המודעה
 ↓
Rate limiting
 ↓
שליחת טופס עדכון (Google Forms)
 ↓
Webhook → עדכון מודעה
 ↓
מייל אישור
```

### 4️⃣ ניהול רשימת תפוצה

```
"הרשמה לרשימת תפוצה בתל אביב"
 ↓
יצירת EmailOperationsMailingList
 ↓
status: SUBSCRIBED
 ↓
שליחת מייל אישור + קישור לביטול
```

## הגדרות סביבה

### `.env` הוספות נדרשות

```env
# Email Operations
EMAIL_OPERATIONS_ENABLED=true

# Google Forms URLs
GOOGLE_FORM_PUBLISH_AD=https://docs.google.com/forms/d/e/.../viewform?entry.123456={email}&entry.789012={requestId}
GOOGLE_FORM_WANTED_AD=https://docs.google.com/forms/d/e/.../viewform?entry.123456={email}&entry.789012={requestId}
GOOGLE_FORM_UPDATE_AD=https://docs.google.com/forms/d/e/.../viewform?entry.123456={email}&entry.789012={requestId}

# Email Provider Webhook (SendGrid/Mailgun)
EMAIL_WEBHOOK_SECRET=your-webhook-secret-here

# Rate Limits
EMAIL_RATE_LIMIT_HOURLY=10
EMAIL_RATE_LIMIT_DAILY=50
EMAIL_COOLDOWN_HOURS=24
```

## Webhook Configuration

### SendGrid Setup

1. Settings → Inbound Parse → Add Host & URL
2. MX Record: `mx.yourdomain.com` → `mx.sendgrid.net`
3. Destination URL: `https://yourdomain.com/api/email-operations/inbound/webhook`
4. POST Raw: Enabled

### Mailgun Setup

1. Receiving → Routes → Create Route
2. Expression: `match_recipient(".*@email.yourdomain.com")`
3. Actions: `forward("https://yourdomain.com/api/email-operations/inbound/webhook")`
4. Priority: 0

### Google Forms Apps Script

**Form → Extensions → Apps Script**

```javascript
function onFormSubmit(e) {
  const formResponse = e.response;
  const itemResponses = formResponse.getItemResponses();
  
  const payload = {
    formId: formResponse.getId(),
    timestamp: new Date().toISOString(),
    responses: {}
  };
  
  for (var i = 0; i < itemResponses.length; i++) {
    var item = itemResponses[i];
    payload.responses[item.getItem().getTitle()] = item.getResponse();
  }
  
  // שליחה לשרת
  var url = 'https://yourdomain.com/api/email-operations/forms/submit';
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'headers': {
      'X-Form-Token': 'your-secret-token'
    }
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    Logger.log('Error: ' + error);
  }
}

// Triggers → Add Trigger → onFormSubmit → From form → On form submit
```

## API Endpoints

### Public Endpoints

```bash
# Webhook מיילים נכנסים
POST /api/email-operations/inbound/webhook
Content-Type: application/json
Body: { from: "user@email.com", subject: "...", text: "...", html: "..." }

# Webhook טפסים
POST /api/email-operations/forms/submit
Content-Type: application/json
Headers: X-Form-Token: secret
Body: { formId, timestamp, responses: {...} }

# הרשמה הושלמה
POST /api/email-operations/registration-completed
Content-Type: application/json
Body: { email: "user@email.com" }
```

### Admin Endpoints (require auth)

```bash
# סטטיסטיקות
GET /api/email-operations/inbound/stats

# לוג ביקורת
GET /api/email-operations/audit?userId=123&commandType=PUBLISH_AD

# רשימת תפוצה
GET /api/email-operations/mailing-list
POST /api/email-operations/mailing-list
DELETE /api/email-operations/mailing-list/:id

# בדיקת rate limit
POST /api/email-operations/check-rate-limit
Body: { email: "user@email.com" }

# טסט מייל (SUPER_ADMIN only)
POST /api/email-operations/inbound/test
Body: { from: "test@email.com", subject: "פרסום מודעה" }
```

## הרצת המערכת

### 1. הרצת Migration

```powershell
cd server
npx prisma migrate dev --name email_operations_system
npx prisma generate
```

### 2. הפעלת שרת

```powershell
npm run dev
```

### 3. בדיקה ידנית

```powershell
# טסט פרסום מודעה
curl -X POST http://localhost:5000/api/email-operations/inbound/test `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -d '{\"from\":\"user@email.com\",\"subject\":\"פרסום מודעה חדשה\"}'

# בדיקת סטטיסטיקות
curl http://localhost:5000/api/email-operations/inbound/stats `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## דוגמאות שימוש

### דוגמה 1: פרסום מודעה

**מייל מהמשתמש:**
```
To: ads@yourdomain.com
Subject: פרסום מודעה: דירה להשכרה בתל אביב
Body: אני רוצה לפרסם מודעה על דירה להשכרה
```

**תגובת המערכת:**
```
שלום,

קיבלנו את בקשתך לפרסום מודעה.

נא למלא את הטופס הבא: [קישור לטופס]

בברכה,
צוות מקומי
```

### דוגמה 2: עדכון מודעה

**מייל מהמשתמש:**
```
Subject: עדכון מודעה 12345
```

**תגובת המערכת:**
```
נא למלא את טופס העדכון: [קישור]
```

### דוגמה 3: הרשמה לרשימת תפוצה

**מייל מהמשתמש:**
```
Subject: הרשמה לרשימת תפוצה בירושלים
```

**תגובת המערכת:**
```
נרשמת בהצלחה לרשימת התפוצה!

קטגוריות: נדל"ן, רכב
ערים: ירושלים

לביטול: [קישור]
```

## אבטחה

### Rate Limiting

- **מכסה שעתית**: 10 מיילים
- **מכסה יומית**: 50 מיילים
- **Cooldown**: 24 שעות לאחר 5 שגיאות רצופות

### אימות

- זיהוי משתמש לפי כתובת מייל רשומה
- בדיקת בעלות על מודעות
- Message-ID ייחודי למניעת replay attacks

### ביקורת

- כל פעולה נרשמת ב-EmailAuditLog
- סנכרון עם AuditLog הכללי
- שמירת raw email למשך 30 יום

## ניטור ובדיקות

### מטריקות

```sql
-- סה"כ מיילים עובדו היום
SELECT COUNT(*) FROM "EmailInboundMessage" 
WHERE "processedAt" > NOW() - INTERVAL '24 hours';

-- הצלחות vs כישלונות
SELECT status, COUNT(*) 
FROM "EmailRequest" 
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY status;

-- פקודות פופולריות
SELECT "commandType", COUNT(*) 
FROM "EmailRequest" 
GROUP BY "commandType" 
ORDER BY COUNT(*) DESC;
```

### בדיקות תקינות

```bash
# בדיקת webhook חי
curl -X POST https://yourdomain.com/api/email-operations/inbound/webhook \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","subject":"פרסום מודעה","text":"test"}'

# Expected: 200 OK
```

## טיפול בבעיות (Troubleshooting)

### בעיה: מיילים לא מגיעים

1. בדוק MX records: `nslookup -type=mx yourdomain.com`
2. בדוק webhook logs ב-SendGrid/Mailgun
3. בדוק firewall rules
4. נסה manual test: `POST /inbound/test`

### בעיה: Rate limit חוסם משתמשים

```sql
-- איפוס rate limit למשתמש מסוים
DELETE FROM "EmailRateLimit" WHERE email = 'user@email.com';
```

### בעיה: טפסים לא עובדים

1. בדוק Apps Script triggers
2. בדוק URL ב-`.env`
3. בדוק logs: `GET /audit?commandType=FORM_SUBMITTED`

## תחזוקה

### ניקוי אוטומטי (Cron)

```sql
-- מחק מיילים ישנים (30+ ימים)
DELETE FROM "EmailInboundMessage" 
WHERE "receivedAt" < NOW() - INTERVAL '30 days';

-- מחק pending intents ישנים (90+ ימים)
DELETE FROM "PendingIntent" 
WHERE status = 'EXPIRED' 
AND "createdAt" < NOW() - INTERVAL '90 days';

-- נקה rate limits ישנים
DELETE FROM "EmailRateLimit" 
WHERE "updatedAt" < NOW() - INTERVAL '7 days';
```

## שדרוגים עתידיים

- [ ] תמיכה ב-IMAP polling (כרגע רק webhooks)
- [ ] עדכון מודעות ישירות מגוף המייל (לא רק טפסים)
- [ ] תבניות מייל מותאמות אישית
- [ ] Multi-language support
- [ ] Scheduled emails (תזמון מיילים)
- [ ] AI parsing של גוף המייל

---

**Created:** 2026-01-28  
**Version:** 1.0.0  
**Maintainer:** Development Team
