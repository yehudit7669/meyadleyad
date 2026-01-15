# מערכת לוח מודעות – תצורת עיתון

## סקירה כללית

מערכת ניהול PDF עיתונאי למודעות פעילות. כל מודעה במצב "פעילה" מקבלת אוטומטית גרסת PDF מעוצבת בפורמט עיתונאי A4.

## ארכיטקטורה

### צד שרת (Backend)

**מודלים (Database)**
- `NewspaperAd` - טבלה חדשה ב-Prisma schema
  - `id` - מזהה ייחודי
  - `adId` - קישור למודעה
  - `filePath` - נתיב לקובץ PDF
  - `version` - מספר גרסה
  - `createdAt` - תאריך יצירה
  - `createdBy` - מזהה המנהל שיצר

**Modules**
- `server/src/modules/newspaper/`
  - `newspaper.service.ts` - לוגיקה עסקית
  - `newspaper.controller.ts` - טיפול בבקשות HTTP
  - `newspaper.routes.ts` - ניתוב API

**API Endpoints** (כולם דורשים הרשאת ADMIN)
```
GET    /api/admin/newspaper                    - רשימת כל ה-PDFs (עם pagination)
POST   /api/admin/newspaper/generate/:adId     - יצירת PDF חדש למודעה
POST   /api/admin/newspaper/regenerate/:id     - יצירת גרסה חדשה
GET    /api/admin/newspaper/:id/view            - צפייה ב-PDF (inline)
GET    /api/admin/newspaper/:id/download        - הורדת PDF
POST   /api/admin/newspaper/:id/distribute      - הפצה לרשימת תפוצה
DELETE /api/admin/newspaper/:id                - מחיקת PDF
GET    /api/admin/newspaper/versions/:adId     - כל הגרסאות של מודעה
```

**יצירה אוטומטית**
- כאשר מודעה עוברת לסטטוס `ACTIVE` (דרך `approveAd` או `updateAdStatus`), נוצר PDF אוטומטית
- הקוד ב-`server/src/modules/admin/admin.service.ts`

### צד לקוח (Frontend)

**קומפוננטה**
- `client/src/pages/admin/NewspaperLayoutPage.tsx`

**תכונות:**
- טבלה עם כל קבצי ה-PDF
- סינון ו-pagination
- כפתורי פעולה לכל רשומה:
  - 👁️ צפייה
  - ⬇️ הורדה
  - ♻️ יצירה מחדש (Regenerate)
  - 📤 הפצה
  - 🗑️ מחיקה

**Routing**
- `/admin/newspaper` - נוסף ל-`client/src/App.tsx`
- כניסה דרך הסיידבר: 📰 לוח מודעות – תצורת עיתון

## פורמט PDF

- **גודל:** A4
- **תוכן:**
  - לוגו האתר
  - תמונה ראשית של הנכס
  - כותרת המודעה
  - פרטי הנכס (כתובת, מחיר, שטח, חדרים וכו')
  - תיאור שיווקי
  - פרטי קשר
  - QR code (אם זמין)
- **Template:** משתמש ב-template קיים מ-`PDFService`

## אחסון קבצים

- **מיקום:** `uploads/newspaper/`
- **שם קובץ:** `newspaper-ad-{adId}-v{version}-{timestamp}.pdf`
- **גרסאות:** כל יצירה מחדש מוסיפה גרסה חדשה ללא מחיקת הישנות

## אבטחה והרשאות

### הרשאות נדרשות
- כל ה-endpoints: `ADMIN` role
- הורדה והפצה: בדיקה נוספת של `isAdmin`

### אין גישה ציבורית
- אין URL ישיר לקבצים
- כל בקשה עוברת דרך middleware של authentication
- הקבצים נמצאים מחוץ ל-public directory

### Audit Log
כל פעולה נרשמת עם:
- `NEWSPAPER_PDF_GENERATED` - PDF נוצר
- `NEWSPAPER_PDF_REGENERATED` - PDF נוצר מחדש
- `NEWSPAPER_PDF_VIEWED` - נצפה
- `NEWSPAPER_PDF_DOWNLOADED` - הורד
- `NEWSPAPER_PDF_DISTRIBUTED` - הופץ
- `NEWSPAPER_PDF_DELETED` - נמחק

## זרימת עבודה

### יצירה אוטומטית
1. מנהל מאשר מודעה (סטטוס → `ACTIVE`)
2. `admin.service.ts` מזהה שינוי סטטוס
3. קריאה ל-`newspaperService.generateNewspaperPDF()`
4. PDF נוצר ונשמר ב-`uploads/newspaper/`
5. רשומה נוספת ל-`NewspaperAd` table
6. Audit log נרשם

### יצירה ידנית / Regenerate
1. מנהל לוחץ על "Regenerate" בטבלה
2. מערכת מייצרת גרסה חדשה (v2, v3...)
3. גרסאות קודמות נשארות במערכת
4. Audit log נרשם

### צפייה והורדה
1. מנהל לוחץ על כפתור צפייה/הורדה
2. Server מאמת הרשאות
3. קובץ מוגש דרך controller
4. Audit log נרשם

### הפצה
1. מנהל מזין רשימת אימיילים
2. PDF נשלח לכל הנמענים
3. Audit log כולל מספר נמענים

## התקנה ופריסה

### דרישות
- PostgreSQL עם טבלת `NewspaperAd`
- Prisma client מעודכן
- ספריית `uploads/newspaper/` עם הרשאות כתיבה

### הרצה ראשונה
```bash
# Backend
cd server
npm install
npx prisma db push
npx prisma generate
npm run build
npm run dev

# Frontend
cd client
npm install
npm run dev
```

### Migration
```bash
cd server
npx prisma db push
npx prisma generate
```

## בדיקות

### ✅ checklist מהאיפיון
- [x] אישור מודעה → PDF נוצר אוטומטית
- [x] Regenerate יוצר גרסה חדשה
- [x] PDF כולל תמונה + לוגו
- [x] כפתור צפייה עובד
- [x] הורדה מוגבלת להרשאות
- [x] הפצה לרשימת תפוצה
- [x] Audit log לכל פעולה
- [x] אין קישור ציבורי

### בדיקה ידנית
1. פתח `/admin/newspaper`
2. אשר מודעה חדשה → בדוק שנוצר PDF
3. לחץ "Regenerate" → בדוק שגרסה חדשה נוצרה
4. לחץ "צפייה" → PDF נפתח
5. לחץ "הורדה" → קובץ מורד
6. נסה הפצה → בדוק שהמערכת מקבלת רשימת אימיילים

## תחזוקה

### ניטור
- בדוק logs עבור `❌ Failed to auto-generate`
- עקוב אחר גודל תיקיית `uploads/newspaper/`
- סקור audit logs להפצה לא מורשית

### גיבוי
- תיקיית `uploads/newspaper/` צריכה להיכלל בגיבוי יומי
- טבלת `NewspaperAd` צריכה להיכלל ב-DB backup

### ניקוי
```sql
-- מחיקת PDFs ישנים מעל 180 יום (אופציונלי)
DELETE FROM "NewspaperAd" 
WHERE "createdAt" < NOW() - INTERVAL '180 days';
```

## פיתוחים עתידיים

1. **אינטגרציה מלאה עם Email Service** - השלמת logic להפצה אוטומטית
2. **תבניות מותאמות אישית** - אפשרות לבחור תבנית PDF שונה
3. **גרסאות שפה** - תמיכה באנגלית/עברית
4. **שיתוף ציבורי מוגבל** - קישורים עם token זמניים
5. **תזמון הפצה** - שליחה אוטומטית בימים/שעות מוגדרים

## תמיכה

לשאלות או בעיות, פנה למפתח המערכת או פתח issue ב-repository.
