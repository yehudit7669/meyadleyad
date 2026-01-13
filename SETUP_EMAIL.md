# הגדרת מערכת המיילים - Gmail SMTP

## שלב 1: יצירת App Password ב-Gmail

1. **היכנס לחשבון Google שלך**: https://myaccount.google.com/
2. **עבור ל-Security**: https://myaccount.google.com/security
3. **הפעל 2-Step Verification** (אם עדיין לא מופעל):
   - לחץ על "2-Step Verification"
   - עקוב אחרי ההוראות להפעלה
4. **צור App Password**:
   - חזור ל-Security
   - לחץ על "App passwords" (תופיע רק אחרי הפעלת 2-Step Verification)
   - בחר "Mail" ו-"Windows Computer" (או Other)
   - תן לו שם: "Meyadleyad Server"
   - לחץ "Generate"
   - **העתק את הסיסמה בת 16 התווים** (תוצג ללא רווחים)

## שלב 2: עדכון קובץ .env

פתח את הקובץ `.env` בתיקיית `server` ועדכן את השורות הבאות:

```env
# Email (Nodemailer)
SMTP_ENABLED="true"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"           # <-- שנה לכתובת Gmail שלך
EMAIL_PASSWORD="abcd efgh ijkl mnop"        # <-- הדבק את ה-App Password (16 תווים)
EMAIL_FROM="Meyadleyad <your-email@gmail.com>"  # <-- שנה לכתובת Gmail שלך
```

## שלב 3: הפעל מחדש את השרת

לאחר עדכון ה-.env:

```powershell
cd c:\Users\User\Desktop\meyadleyad
.\start-server.ps1
```

## שלב 4: בדיקה

אחרי הפעלת השרת, תוכל לבדוק שהמיילים עובדים:

1. **הירשם כמשתמש חדש** - אמור להגיע מייל אימות
2. **צור מודעה חדשה** - אמור להגיע מייל "המודעה נקלטה"
3. **אשר מודעה במנהל** - המשתמש יקבל מייל "המודעה אושרה"
4. **דחה מודעה במנהל** - המשתמש יקבל מייל "המודעה נדחתה"
5. **בקש איפוס סיסמה** - אמור להגיע מייל עם קישור

## מקומות שבהם נשלחים מיילים:

✅ **רישום משתמש חדש** - `sendVerificationEmail`
✅ **איפוס סיסמה** - `sendPasswordResetEmail`
✅ **יצירת מודעה** - `sendAdCreatedEmail`
✅ **אישור מודעה** - `sendAdApprovedEmail`
✅ **דחיית מודעה** - `sendAdRejectedEmail`
✅ **פרסום מודעה (עם PDF)** - `sendAdCopyEmail`

## בעיות נפוצות:

### שגיאה: "Invalid login"
- וודא שהפעלת 2-Step Verification
- וודא שיצרת App Password ולא משתמש בסיסמה רגילה
- העתק את ה-App Password ללא רווחים

### שגיאה: "Connection timeout"
- בדוק שה-PORT הוא 587 (לא 465 או 25)
- בדוק חיבור לאינטרנט
- בדוק firewall/antivirus

### מיילים לא מגיעים
- בדוק בתיקיית Spam
- בדוק שה-EMAIL_FROM מכיל כתובת חוקית
- הפעל `SMTP_ENABLED="true"`
