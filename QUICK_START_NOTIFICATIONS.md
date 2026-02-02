# מדריך הפעלה מהיר - מערכת התראות על נכסים חדשים

## ✅ המערכת מוכנה!

כל הקוד מוכן ועובד. עכשיו צריך רק לבדוק שהכל עובד נכון.

---

## 🚀 הרצה ראשונית

### 1. שרת
```bash
cd server
npm install
npx prisma generate
npm run dev
```

### 2. קליינט
```bash
cd client
npm install
npm run dev
```

---

## 📋 Checklist בדיקות

### בדיקה 1: הגדרות משתמש
1. ✅ התחבר למערכת
2. ✅ עבור לפרופיל → **העדפות תקשורת**
3. ✅ סמן "קבלת התראות על נכסים חדשים"
4. ✅ לחץ "הגדר מסננים"
5. ✅ בחר:
   - קטגוריה (לדוגמה: "דירות למכירה")
   - עיר (לדוגמה: "בית שמש")
   - טווח מחירים (לדוגמה: 500,000 - 1,000,000)
   - סוג נכס (לדוגמה: "דירה")
   - סוג מפרסם: "בעלים בלבד" או "מתווכים"
6. ✅ שמור
7. ✅ וודא שרואה סיכום "המסננים הנוכחיים שלך"

### בדיקה 2: קבלת התראה
1. ✅ פרסם מודעה חדשה או אשר מודעה קיימת שמתאימה לפילטרים
2. ✅ בדוק את המייל - אמור להגיע מייל עם:
   - כותרת הנכס
   - תמונה (אם יש)
   - פרטי הנכס (קטגוריה, עיר, מחיר, סוג)
   - קישור לנכס
3. ✅ פרסם מודעה שלא מתאימה לפילטרים
4. ✅ וודא שלא הגיע מייל

### בדיקה 3: מניעת כפילויות
1. ✅ פרסם מודעה
2. ✅ וודא שהגיע מייל
3. ✅ הפעל שוב את אותה המודעה (אם אפשר)
4. ✅ וודא שלא הגיע מייל שני (idempotency עובד!)

### בדיקה 4: Admin - הגדרות גלובליות
1. ✅ התחבר כ-Admin
2. ✅ עבור ל-**Admin → ניהול התראות** (`/admin/notifications`)
3. ✅ רואה toggle "התראות מופעלות/מושבתות לכל המשתמשים"
4. ✅ כבה את ההתראות הגלובליות
5. ✅ פרסם מודעה → לא אמור להגיע מייל למשתמשים רגילים

### בדיקה 5: Admin - חריגות למשתמש
1. ✅ בעוד ההגדרות הגלובליות **כבויות**:
   - הזן User ID של משתמש
   - בחר "ALLOW"
   - בחר תאריך תפוגה (לדוגמה: עוד שבוע)
   - הזן סיבה: "בדיקה"
   - שמור
2. ✅ פרסם מודעה → המשתמש הזה אמור לקבל מייל למרות שהגלובלי כבוי
3. ✅ הפעל את ההגדרות הגלובליות
4. ✅ בחר "BLOCK" למשתמש אחר + תאריך תפוגה
5. ✅ פרסם מודעה → המשתמש החסום לא יקבל מייל

### בדיקה 6: תפוגת חריגה
1. ✅ הגדר חריגה עם תאריך תפוגה עבר (או קרוב מאוד)
2. ✅ המתן שהזמן יעבור
3. ✅ פרסם מודעה
4. ✅ וודא שהמשתמש חוזר להתנהגות הגלובלית

### בדיקה 7: Retry Failed
1. ✅ ב-Admin → ניהול התראות
2. ✅ לחץ "נסה שוב לשלוח התראות שנכשלו"
3. ✅ וודא שרואה הודעה עם מספר ההתראות שנשלחו מחדש

---

## 🔍 איך לוודא שזה עובד?

### לוגים בשרת
כשמודעה מפורסמת, תראה בקונסול:
```
✅ Starting notification process for ad: <adId>
✅ Found X active subscriptions
✅ Notification sent successfully to user@example.com for ad <adId>
```

### במסד נתונים
```sql
-- בדיקת התראות שנשלחו
SELECT * FROM "NotificationQueue" WHERE status = 'SENT';

-- בדיקת התראות שנכשלו
SELECT * FROM "NotificationQueue" WHERE status = 'FAILED';

-- בדיקת הגדרות גלובליות
SELECT * FROM "NotificationSettings";

-- בדיקת חריגות
SELECT * FROM "UserNotificationOverride";
```

---

## ⚙️ API Endpoints

### משתמש
- `GET /api/profile/preferences` - קבלת העדפות
- `PATCH /api/profile/preferences` - עדכון העדפות (כולל filters)
- `GET /api/notifications/my-override` - בדיקה אם יש לי חריגה

### Admin
- `GET /api/notifications/admin/settings` - קבלת הגדרות גלובליות
- `PUT /api/notifications/admin/settings` - עדכון הגדרות גלובליות
- `POST /api/notifications/admin/override/:userId` - הגדרת חריגה
- `DELETE /api/notifications/admin/override/:userId` - מחיקת חריגה
- `GET /api/notifications/admin/override/:userId` - קבלת חריגה
- `POST /api/notifications/admin/retry-failed` - retry התראות שנכשלו

---

## 🐛 Troubleshooting

### לא מגיע מייל
1. בדוק שה-SMTP מוגדר נכון ב-`.env`
2. בדוק לוגים בשרת
3. בדוק שההתראות מופעלות גלובלית
4. בדוק שאין חריגת BLOCK למשתמש
5. בדוק שהפילטרים תואמים את המודעה

### מייל מגיע כפול
- לא אמור לקרות! יש unique constraint
- בדוק ב-DB שאין duplicates:
```sql
SELECT "userId", "adId", COUNT(*) 
FROM "NotificationQueue" 
GROUP BY "userId", "adId" 
HAVING COUNT(*) > 1;
```

### שגיאת build
```bash
cd server
npm run build

cd ../client
npm run build
```

---

## ✨ סיום

**המערכת מוכנה לשימוש!** 🎉

אם יש בעיה - בדוק את הלוגים ואת מסד הנתונים.
