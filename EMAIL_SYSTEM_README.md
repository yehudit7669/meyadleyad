# 📧 מדריך הגדרת מערכת אימות מייל + איפוס סיסמה

## 📋 סקירה כללית

מערכת אימות מייל ואיפוס סיסמה מלאה עם SMTP אמיתי.

### ✨ תכונות שהוספו:

✅ **אימות מייל בהרשמה** - משתמשים חדשים מקבלים מייל אימות  
✅ **איפוס סיסמה** - Flow מלא של "שכחתי סיסמה"  
✅ **SMTP אמיתי** - שליחת מיילים אמיתיים דרך Gmail/SMTP  
✅ **Tokens עם תוקף** - טוקני אימות ואיפוס פוגי תוקף (24h / 1h)  
✅ **Security Best Practices** - אי חשיפת קיום משתמשים, הצפנת סיסמאות  
✅ **UI/UX משופר** - מסכים ברורים עם הודעות הצלחה/שגיאה

---

## 🚀 הוראות הגדרה

### 1️⃣ הגדרת SMTP (Gmail)

#### אפשרות א': Gmail עם App Password (מומלץ)

1. היכנס לחשבון Google שלך
2. עבור ל־ [Google Account Security](https://myaccount.google.com/security)
3. הפעל **2-Step Verification** (אימות דו-שלבי)
4. לאחר הפעלה, עבור ל־ [App Passwords](https://myaccount.google.com/apppasswords)
5. צור סיסמת אפליקציה חדשה:
   - בחר "Mail" כאפליקציה
   - בחר "Other (Custom name)" - הקלד "Meyadleyad"
   - לחץ "Generate"
   - שמור את הסיסמה שנוצרה (16 תווים)

#### אפשרות ב': SMTP אחר

ניתן להשתמש בכל שירות SMTP אחר (Mailgun, SendGrid, Outlook וכו')

---

### 2️⃣ עדכון קובץ `.env` בשרת

ערוך את `server/.env` והוסף:

```env
# SMTP Configuration (חובה!)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password-here
SMTP_FROM=Meyadleyad <no-reply@yourdomain.com>

# URLs (חשוב להתאים לפורטים שלך)
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
CLIENT_URL=http://localhost:5173
```

**⚠️ חשוב:**
- החלף `your-email@gmail.com` במייל האמיתי שלך
- החלף `your-16-char-app-password-here` בסיסמת האפליקציה מ-Gmail
- אל תשתמש בסיסמת ה-Gmail הרגילה שלך!

---

### 3️⃣ עדכון בסיס נתונים

הסכמה עודכנה אוטומטית עם השדות החדשים:

```bash
# הרץ מהתיקיה הראשית
cd server
npx prisma db push
npx prisma generate
```

שדות חדשים שנוספו למודל `User`:
- `isEmailVerified` - האם המייל אומת
- `verificationToken` - טוקן לאימות מייל
- `verificationExpires` - תוקף טוקן האימות
- `resetPasswordToken` - טוקן לאיפוס סיסמה  
- `resetPasswordExpires` - תוקף טוקן האיפוס

---

### 4️⃣ הפעלת המערכת

#### א. הפעל את השרת:

```powershell
cd server
npm run dev
```

בהפעלה תראה הודעה:
```
✅ SMTP connection verified successfully
```

אם רואה שגיאה - בדוק את הגדרות ה-SMTP ב-.env

#### ב. הפעל את הלקוח:

```powershell
cd client
npm run dev
```

---

## 🔄 Flows שהתווספו

### 1. הרשמה עם אימות מייל

**Frontend:**
1. משתמש ממלא טופס הרשמה
2. לאחר הרשמה מוצג מסך הצלחה: "נשלח אליך מייל אימות"

**Backend:**
1. יצירת משתמש חדש עם `isEmailVerified: false`
2. יצירת `verificationToken` אקראי
3. שליחת מייל אימות עם קישור לאימות
4. הקישור תקף ל-24 שעות

**אימות:**
1. משתמש לוחץ על הקישור במייל
2. Frontend מפנה ל-`/verify-email?token=...`
3. Backend בודק תוקף הטוקן ומעדכן `isEmailVerified: true`
4. הודעת הצלחה + הפניה להתחברות

---

### 2. שכחתי סיסמה

**Frontend: `/forgot-password`**
1. משתמש מזין מייל
2. הודעת הצלחה: "אם המייל קיים, נשלח קישור לאיפוס"

**Backend:**
1. בדיקה אם המשתמש קיים (ללא חשיפה)
2. יצירת `resetPasswordToken` אקראי
3. שליחת מייל עם קישור לאיפוס
4. הקישור תקף לשעה אחת

**איפוס סיסמה: `/reset-password?token=...`**
1. משתמש לוחץ על הקישור במייל
2. טופס להזנת סיסמה חדשה
3. Backend בודק תוקף הטוקן ומעדכן הסיסמה
4. הפניה להתחברות

---

## 📁 קבצים שעודכנו/נוספו

### Backend (Server)

**עודכנו:**
- ✅ `server/prisma/schema.prisma` - שדות חדשים למודל User
- ✅ `server/src/config/index.ts` - הגדרות SMTP
- ✅ `server/src/modules/email/email.service.ts` - Nodemailer עם SMTP אמיתי
- ✅ `server/src/modules/auth/auth.service.ts` - Flows של אימות ואיפוס
- ✅ `server/src/modules/auth/auth.controller.ts` - Endpoints (כבר היו)
- ✅ `server/.env.example` - דוגמה להגדרות SMTP

**Endpoints (כבר קיימים):**
- `GET /api/auth/verify-email?token=...` - אימות מייל
- `POST /api/auth/forgot-password` - בקשת איפוס סיסמה
- `POST /api/auth/reset-password` - איפוס סיסמה

---

### Frontend (Client)

**עודכנו:**
- ✅ `client/src/services/api.ts` - עדכון קריאות API
- ✅ `client/src/components/AuthPage.tsx` - הצגת הודעה על שליחת מייל
- ✅ `client/src/pages/VerifyEmail.tsx` - כבר קיים ועובד
- ✅ `client/src/pages/ForgotPassword.tsx` - כבר קיים ועובד
- ✅ `client/src/pages/ResetPassword.tsx` - כבר קיים ועובד

**Routes (כבר קיימים ב-App.tsx):**
- `/verify-email` - אימות מייל
- `/forgot-password` - בקשת איפוס סיסמה
- `/reset-password` - איפוס סיסמה

---

## 🧪 בדיקה ידנית

### ✅ בדיקת הרשמה + אימות מייל:

1. פתח `http://localhost:5173/login`
2. עבור ללשונית "הרשמה"
3. הירשם עם מייל אמיתי שלך
4. אמור לראות הודעה: "נשלח אליך מייל אימות"
5. בדוק את תיבת הדואר (גם ספאם!)
6. לחץ על "אימות כתובת מייל"
7. אמור להיות מופנה ל-`/verify-email?token=...`
8. הודעת הצלחה: "האימייל אומת בהצלחה!"
9. התחבר עם המייל והסיסמה

---

### ✅ בדיקת שכחתי סיסמה:

1. פתח `http://localhost:5173/forgot-password`
2. הזן את המייל שנרשמת איתו
3. הודעה: "שלחנו קישור לאיפוס סיסמה"
4. בדוק את תיבת הדואר
5. לחץ על "איפוס סיסמה"
6. הזן סיסמה חדשה פעמיים
7. לחץ "עדכן סיסמה"
8. התחבר עם הסיסמה החדשה

---

## 🐛 פתרון בעיות נפוצות

### ❌ "SMTP connection failed"

**גורמים אפשריים:**
- סיסמת אפליקציה לא נכונה (ודא שהעתקת את כל 16 התווים)
- 2-Step Verification לא מופעל ב-Gmail
- השתמשת בסיסמת Gmail רגילה במקום App Password
- חומת אש חוסמת port 587

**פתרון:**
1. בדוק שכתובת המייל ב-`SMTP_USER` זהה לזו שיצרת בה App Password
2. בדוק ש-`SMTP_PASS` מכיל את ה-16 תווים המדויקים (ללא רווחים)
3. נסה להפעיל מחדש את השרת

---

### ❌ "EMAIL_SEND_FAILED"

**בדיקות:**
1. רשימת הודעות בקונסול של השרת
2. ודא ש-`SMTP_FROM` מכיל כתובת תקינה
3. נסה לשלוח מייל לכתובת אחרת

---

### ❌ "Invalid or expired verification token"

**גורמים:**
- הטוקן פג תוקף (24 שעות לאימות, שעה לאיפוס)
- השתמשת בקישור ישן
- בסיס הנתונים אופס אחרי יצירת הטוקן

**פתרון:**
- לאימות מייל: נסה להירשם שוב
- לאיפוס סיסמה: חזור ל-"שכחתי סיסמה" ובקש קישור חדש

---

### ❌ המיילים לא מגיעים

**בדיקות:**
1. תיקיית Spam/Junk
2. קונסול השרת - האם יש הודעה "✅ Email sent successfully"?
3. ודא ש-`FRONTEND_URL` ב-.env תואם לפורט של הלקוח (5173)
4. Gmail לפעמים דורש אישור בפעם הראשונה - בדוק מיילים מ-Google

---

## 🔐 אבטחה

### מה כבר מיושם:

✅ **הצפנת סיסמאות** - bcrypt עם 10 rounds  
✅ **Tokens אקראיים** - crypto.randomBytes(32)  
✅ **Expiration** - טוקנים פוגי תוקף  
✅ **אי חשיפת משתמשים** - "אם המייל קיים..."  
✅ **HTTPS Ready** - רק צריך להוסיף certifications בפרודקשן  
✅ **Rate Limiting** - מוגדר ב-config (100 בקשות ל-15 דקות)

### המלצות נוספות לפרודקשן:

🔹 השתמש ב-HTTPS (Let's Encrypt)  
🔹 הגבל מספר ניסיונות איפוס סיסמה לאותו מייל  
🔹 לוג מנסיונות כניסה חשודים  
🔹 שלח התראה למשתמש על שינוי סיסמה  
🔹 הוסף CAPTCHA לטפסים רגישים

---

## 📧 שירותי SMTP אלטרנטיביים

### Gmail (חינמי, 500 מיילים ליום)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

### SendGrid (חינמי, 100 מיילים ליום)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun (חינמי, 5,000 מיילים לחודש הראשון)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

---

## 📝 לסיכום

✨ **המערכת מוכנה לשימוש!**

כל מה שנותר הוא:
1. ✅ להגדיר את ה-SMTP ב-`server/.env`
2. ✅ להפעיל את השרת והלקוח
3. ✅ לבדוק שהמיילים מגיעים

**זכור:** זה SMTP אמיתי - המיילים באמת יישלחו! 📨

---

## 🆘 צריך עזרה?

- בדוק את הקונסול של השרת לשגיאות
- ודא שכל המשתנים ב-`.env` מוגדרים נכון
- קרא את חלק "פתרון בעיות נפוצות" למעלה
- אם עדיין יש בעיה - בדוק את הלוגים המפורטים בקונסול

**בהצלחה! 🚀**
