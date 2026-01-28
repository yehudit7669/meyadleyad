# 📧 Unified Email System - מערכת מיילים מרוכזת

## ✅ מה בוצע

### 1️⃣ מקור מרכזי לכל סוגי המיילים

**קובץ:** `server/src/modules/email/email-types.enum.ts`

כולל enum `EmailType` עם 30+ סוגי מיילים:
- ✅ Authentication (רישום, איפוס סיסמה)
- ✅ Email Operations (משתמשים לא רשומים, פרסום, עדכון, הסרה)
- ✅ Ad Lifecycle (מודעות - ממתין, אושר, נדחה)
- ✅ Appointments (פגישות - בקשה, אישור, דחייה)
- ✅ Mailing List (רשימות תפוצה)
- ✅ Content Distribution (תפוצת תוכן)
- ✅ Errors (שגיאות מערכת)
- ✅ Admin (התראות מנהל)

### 2️⃣ שירות מרכזי לכל שליחות מיילים

**קובץ:** `server/src/modules/email/unified-email-template.service.ts`

**UnifiedEmailTemplateService** - שירות יחיד שמנהל את כל שליחות המיילים:
- כל סוג מייל עם template מוגדר
- תמיכה ב-attachments (PDF, ICS)
- נושא מייל אוטומטי מ-metadata
- תבניות HTML מסודרות

**דוגמת שימוש:**
```typescript
import { unifiedEmailService } from './unified-email-template.service';
import { EmailType } from './email-types.enum';

await unifiedEmailService.sendEmail({
  to: 'user@email.com',
  type: EmailType.AD_APPROVED,
  adTitle: 'דירה להשכרה',
  adId: '123',
  adNumber: '12345',
});
```

### 3️⃣ עדכון EmailService הקיים

**קובץ:** `server/src/modules/email/email.service.ts`

כל המתודות הקיימות עודכנו להשתמש ב-`UnifiedEmailTemplateService`:
- ✅ `sendVerificationEmail()` → `EmailType.USER_REGISTER_CONFIRMATION`
- ✅ `sendPasswordResetEmail()` → `EmailType.PASSWORD_RESET`
- ✅ `sendAdApprovedEmail()` → `EmailType.AD_APPROVED`
- ✅ `sendAdRejectedEmail()` → `EmailType.AD_REJECTED`
- ✅ `sendAdCreatedEmail()` → `EmailType.AD_CREATED_PENDING_APPROVAL`
- ✅ `sendAdCopyEmail()` → `EmailType.AD_COPY_WITH_PDF`
- ✅ `sendAppointmentRequestEmail()` → `EmailType.APPOINTMENT_REQUEST_SENT`
- ✅ `sendAppointmentApprovedEmail()` → `EmailType.APPOINTMENT_APPROVED`
- ✅ `sendAppointmentRejectedEmail()` → `EmailType.APPOINTMENT_REJECTED`
- ✅ `sendAppointmentRescheduleEmail()` → `EmailType.APPOINTMENT_RESCHEDULE`

**לא נשבר קוד קיים** - ה-API נשאר זהה, רק הפנימיות שונתה.

### 4️⃣ מערכת בדיקות מלאה (DEV ONLY)

**קבצים:**
- `server/src/modules/email/email-testing.controller.ts`
- `server/src/modules/email/email-testing.routes.ts`

**Endpoints:**

```bash
# קבלת רשימת כל סוגי המיילים
GET /api/email-testing/types

# שליחת מייל בדיקה ספציפי (Admin)
POST /api/email-testing/send/:emailType
Headers: Authorization: Bearer <admin_token>
Body: { "customEmail": "test@mailtrap.io" }

# שליחת כל סוגי המיילים (Super Admin only)
POST /api/email-testing/send-all
Headers: Authorization: Bearer <super_admin_token>
Body: { "customEmail": "test@mailtrap.io" }
```

### 5️⃣ אינטגרציה עם Mailtrap

במצב development (`.env`):
```env
NODE_ENV=development
SMTP_ENABLED=true
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_password
```

כל המיילים יישלחו ל-Mailtrap ותוכלי לראות:
- ✅ נושא המייל
- ✅ תוכן מלא (HTML)
- ✅ למי נשלח
- ✅ Attachments (אם יש)
- ✅ מטאדטה

---

## 🧪 איך לבדוק את המערכת

### שלב 1: התחברות כמנהל

```powershell
# התחברות
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"your_password"}'

$token = $login.access_token
```

### שלב 2: קבלת רשימת סוגי המיילים

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/email-testing/types"
```

**תקבלי:**
```json
{
  "success": true,
  "totalTypes": 30,
  "allTypes": [
    "USER_REGISTER_CONFIRMATION",
    "PASSWORD_RESET",
    "AD_APPROVED",
    ...
  ],
  "categorized": {
    "auth": [...],
    "ads": [...],
    "appointments": [...],
    ...
  }
}
```

### שלב 3: שליחת מייל בדיקה ספציפי

```powershell
# דוגמה: מייל אישור מודעה
Invoke-RestMethod `
  -Uri "http://localhost:5000/api/email-testing/send/AD_APPROVED" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Body '{"customEmail":"test@mailtrap.io"}'
```

**תקבלי:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "emailType": "AD_APPROVED",
  "sentTo": "test@mailtrap.io",
  "mockData": {
    "to": "test@mailtrap.io",
    "type": "AD_APPROVED",
    "adTitle": "דירה 3 חדרים להשכרה בתל אביב",
    "adId": "mock_ad_123",
    "adNumber": "12345"
  }
}
```

### שלב 4: בדיקה ב-Mailtrap

1. היכנסי ל-Mailtrap Inbox
2. תראי מייל חדש:
   - **Subject:** "המודעה שלך אושרה ופורסמה בהצלחה - מיעדליעד"
   - **From:** "Meyadleyad <noreply@meyadleyad.com>"
   - **To:** test@mailtrap.io
   - **תוכן:** HTML מלא עם פרטי המודעה

### שלב 5: בדיקת כל סוגי המיילים (Super Admin)

```powershell
# שליחת כל המיילים ברצף (30+ מיילים)
Invoke-RestMethod `
  -Uri "http://localhost:5000/api/email-testing/send-all" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Body '{"customEmail":"test@mailtrap.io"}'
```

**תקבלי:**
```json
{
  "success": true,
  "message": "Sent 30/30 test emails",
  "results": [
    { "type": "USER_REGISTER_CONFIRMATION", "status": "success" },
    { "type": "AD_APPROVED", "status": "success" },
    ...
  ],
  "sentTo": "test@mailtrap.io"
}
```

---

## 🎯 בדיקת Flows מלאים

### Flow 1: משתמש חדש נרשם

**1. נרשם משתמש חדש:**
```powershell
POST /api/auth/register
Body: { "email": "newuser@email.com", "password": "..." }
```

**2. בדוק ב-Mailtrap:**
- ✅ מייל אימות (`USER_REGISTER_CONFIRMATION`)
- ✅ קישור לאימות כתובת

### Flow 2: פרסום מודעה

**1. משתמש יוצר מודעה:**
```powershell
POST /api/ads
Body: { "title": "דירה להשכרה", ... }
```

**2. בדוק ב-Mailtrap:**
- ✅ מייל "המודעה נקלטה" (`AD_CREATED_PENDING_APPROVAL`)

**3. מנהל מאשר:**
```powershell
POST /api/admin/ads/:id/approve
```

**4. בדוק ב-Mailtrap:**
- ✅ מייל "המודעה אושרה" (`AD_APPROVED`)
- ✅ מספר מודעה + קישור

### Flow 3: Email Operations - משתמש לא רשום

**1. משתמש לא רשום שולח מייל:**
```powershell
POST /api/email-operations/inbound/test
Body: { "from": "guest@email.com", "subject": "פרסום מודעה" }
```

**2. בדוק ב-Mailtrap:**
- ✅ מייל "נדרשת הרשמה" (`USER_NOT_REGISTERED_REDIRECT_TO_SIGNUP`)
- ✅ קישור להרשמה

**3. משתמש נרשם:**
```powershell
POST /api/email-operations/registration-completed
Body: { "email": "guest@email.com" }
```

**4. בדוק ב-Mailtrap:**
- ✅ מייל "בקשתך התקבלה" (`AD_PUBLISH_REQUEST_RECEIVED`)
- ✅ קישור לטופס Google Forms

### Flow 4: פגישה

**1. בקשת פגישה:**
```powershell
POST /api/appointments
Body: { "adId": "123", "date": "...", "note": "..." }
```

**2. בדוק ב-Mailtrap (למפרסם):**
- ✅ מייל "בקשה חדשה להצגת נכס" (`APPOINTMENT_REQUEST_SENT`)

**3. מפרסם מאשר:**
```powershell
POST /api/appointments/:id/approve
```

**4. בדוק ב-Mailtrap (למבקש):**
- ✅ מייל "הפגישה אושרה" (`APPOINTMENT_APPROVED`)
- ✅ קובץ ICS מצורף

---

## 📊 סטטיסטיקות ובדיקות

### בדיקת כל סוגי המיילים

```powershell
# קבלת רשימה מקובצת
$types = Invoke-RestMethod -Uri "http://localhost:5000/api/email-testing/types"
$types.categorized

# בדיקת כל קטגוריה
foreach ($emailType in $types.categorized.ads) {
  Write-Host "Testing $emailType..."
  Invoke-RestMethod `
    -Uri "http://localhost:5000/api/email-testing/send/$emailType" `
    -Method POST `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -Body '{}' -ContentType "application/json"
  Start-Sleep -Seconds 1
}
```

### כל סוגי המיילים לפי קטגוריה

**Authentication (3):**
- `USER_REGISTER_CONFIRMATION` - אימות רישום
- `PASSWORD_RESET` - איפוס סיסמה
- `ACCOUNT_DELETION_CONFIRMATION` - אישור מחיקה

**Email Operations - Not Registered (1):**
- `USER_NOT_REGISTERED_REDIRECT_TO_SIGNUP` - הפניה להרשמה

**Email Operations - Requests (4):**
- `AD_PUBLISH_REQUEST_RECEIVED` - פרסום מודעה
- `AD_WANTED_REQUEST_RECEIVED` - פרסום דרושים
- `AD_UPDATE_REQUEST_RECEIVED` - עדכון מודעה
- `AD_REMOVE_REQUEST_RECEIVED` - הסרת מודעה

**Ad Lifecycle (6):**
- `AD_CREATED_PENDING_APPROVAL` - ממתין לאישור
- `AD_APPROVED` - מודעה אושרה
- `AD_REJECTED` - מודעה נדחתה
- `AD_COPY_WITH_PDF` - עותק PDF
- `AD_UPDATED_CONFIRMATION` - עדכון בוצע
- `AD_REMOVED_CONFIRMATION` - הסרה בוצעה

**Appointments (4):**
- `APPOINTMENT_REQUEST_SENT` - בקשת פגישה
- `APPOINTMENT_APPROVED` - פגישה אושרה
- `APPOINTMENT_REJECTED` - פגישה נדחתה
- `APPOINTMENT_RESCHEDULE` - הצעה למועד חלופי

**Mailing List (3):**
- `MAILING_LIST_SUBSCRIBED` - הרשמה
- `MAILING_LIST_UNSUBSCRIBED` - ביטול
- `MAILING_LIST_PREFERENCES_UPDATED` - עדכון

**Content Distribution (2):**
- `WEEKLY_CONTENT_DISTRIBUTION` - תפוצה שבועית
- `MANUAL_CONTENT_DISTRIBUTION` - תפוצה ידנית

**Errors (4):**
- `AD_NOT_FOUND` - מודעה לא נמצאה
- `UNAUTHORIZED_ACTION` - לא מורשה
- `RATE_LIMIT_EXCEEDED` - חריגה ממכסה
- `EMAIL_OPERATION_ERROR` - שגיאה כללית

**Admin (2):**
- `ADMIN_NOTIFICATION` - התראת מנהל
- `NEWSPAPER_SHEET_READY` - גיליון מוכן

---

## ✅ Validation Checklist

### בדיקה שהכל עובד:

- [ ] כל המיילים נשלחים ל-Mailtrap
- [ ] נושא המייל תואם ל-`EmailType`
- [ ] תוכן המייל בעברית ועם עיצוב נכון
- [ ] Attachments מצורפים (PDF, ICS)
- [ ] אין שליחות מיילים "נסתרות" (כל המיילים דרך המערכת המרוכזת)
- [ ] Flows מלאים עובדים (רישום → פרסום → אישור → מייל)
- [ ] בדיקות dev working (endpoint /email-testing)
- [ ] Metadata נכונה (`requiresAuth`, `category`, `description`)

---

## 🔒 Security Notes

- **Email Testing Endpoints:** עובדים רק ב-`NODE_ENV=development`
- **Admin Only:** דרוש token של ADMIN או SUPER_ADMIN
- **Production:** בproduction, endpoints אלה יחזירו 403

---

## 🚀 Production Deployment

לפני production:

1. ✅ העבר SMTP ל-provider אמיתי (SendGrid, AWS SES, etc.)
2. ✅ החלף `EMAIL_HOST` ב-.env
3. ✅ ודא ש-`NODE_ENV=production`
4. ✅ Email testing endpoints יהיו disabled אוטומטית
5. ✅ Mailtrap → Production SMTP

---

## 📝 שינויים שבוצעו בקבצים

### קבצים חדשים:
- ✅ `email-types.enum.ts` - Enum מרכזי
- ✅ `unified-email-template.service.ts` - שירות מרכזי
- ✅ `email-testing.controller.ts` - Controller לבדיקות
- ✅ `email-testing.routes.ts` - Routes לבדיקות

### קבצים ששונו:
- ✅ `email.service.ts` - עודכן להשתמש במערכת מרכזית
- ✅ `routes/index.ts` - נוסף email-testing routes

### אינטגרציה קיימת:
- ✅ כל הקוד הישן ממשיך לעבוד
- ✅ לא נשבר שום API קיים
- ✅ רק הפנימיות שונתה

---

**תאריך יצירה:** 28 ינואר 2026  
**גרסה:** 1.0.0  
**נוצר עבור:** בדיקות Mailtrap ומערכת מיילים אחידה
