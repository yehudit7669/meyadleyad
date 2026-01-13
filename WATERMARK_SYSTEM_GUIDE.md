# מערכת Watermarking - מדריך מלא

## סקירה כללית

מערכת Watermarking מאפשרת למנהלי המערכת להוסיף לוגו ממותג אוטומטית לכל תמונה ו-PDF שמועלים למערכת. המערכת מספקת ממשק אדמין מלא לניהול הלוגו, מיקומו, שקיפותו וגודלו.

## תכונות עיקריות

### ✅ Backend

1. **מודל נתונים** (`BrandingConfig`)
   - `logoUrl` - נתיב ללוגו (PNG שקוף)
   - `position` - מיקום (top-left, top-right, bottom-left, bottom-right)
   - `opacity` - שקיפות (0-100%)
   - `sizePct` - גודל יחסי (5-30% מרוחב התמונה)

2. **שירותים**
   - `BrandingService` - ניהול קונפיגורציה
   - `WatermarkService` - צריבת watermark לתמונות ו-PDF

3. **API Endpoints** (Admin בלבד)
   - `GET /api/admin/branding` - קבלת הגדרות נוכחיות
   - `POST /api/admin/branding/logo` - העלאת לוגו חדש (PNG, עד 1MB)
   - `PATCH /api/admin/branding` - עדכון הגדרות (position, opacity, sizePct)
   - `POST /api/admin/branding/preview` - תצוגה מקדימה חיה
   - `POST /api/admin/branding/reset` - איפוס לברירת מחדל

4. **אינטגרציה בזרימת Upload**
   - צריבה אוטומטית בעת העלאת תמונות ל-ads
   - תמיכה ב-JPG, PNG, PDF
   - שמירת גרסה ממותגת + גרסה מקורית
   - שדות חדשים ב-AdImage: `originalUrl`, `brandedUrl`

### ✅ Frontend

1. **מסך ניהול** (`/admin/branding`)
   - הצגת לוגו נוכחי
   - העלאת לוגו חדש (PNG, עד 1MB)
   - בחירת מיקום (4 אפשרויות)
   - slider לשקיפות (0-100)
   - slider לגודל יחסי (5-30%)
   - תצוגה מקדימה עם תמונת דוגמה
   - שמירה ואיפוס

2. **אינטגרציה ב-AdminDashboard**
   - כרטיס חדש: "לוגו למיתוג"
   - route ב-App.tsx

## מבנה קבצים

### Backend
```
server/src/modules/branding/
├── branding.service.ts      # ניהול קונפיגורציה
├── watermark.service.ts     # צריבת watermark
├── branding.controller.ts   # Controllers
└── branding.routes.ts       # Routes

server/prisma/
├── schema.prisma            # מודל BrandingConfig + עדכון AdImage
└── migrations/              # migration חדש
```

### Frontend
```
client/src/pages/admin/
└── BrandingLogoSettings.tsx  # מסך ניהול מלא

client/src/
└── App.tsx                   # routing חדש
```

## התקנה והרצה

### 1. התקנת חבילות

```bash
cd server
npm install sharp pdf-lib
```

**שים לב**: אם יש שגיאת ENOSPC (אין מקום בדיסק), נקה מקום ונסה שוב.

### 2. Migration

```bash
npx prisma migrate dev --name add_branding_config
npx prisma generate
```

### 3. Seed

```bash
npx prisma db seed
```

זה יוצר BrandingConfig עם ערכי ברירת מחדל:
- position: `bottom-left`
- opacity: `70`
- sizePct: `18`
- logoUrl: `` (ריק)

### 4. הרצת השרת

```bash
npm run dev
```

## שימוש

### כמנהל מערכת

1. היכנס לאזור האדמין
2. לחץ על "לוגו למיתוג"
3. העלה לוגו PNG שקוף (עד 1MB)
4. בחר מיקום, שקיפות וגודל
5. העלה תמונת דוגמה ולחץ "הצג תצוגה מקדימה"
6. לחץ "שמור והחל"

### כמשתמש (מפרסם מודעה)

- אין שינוי! המשתמש מעלה תמונות כרגיל
- המערכת מוסיפה את הלוגו אוטומטית ברקע
- התמונה המוצגת היא הגרסה הממותגת
- התמונה המקורית נשמרת גם כן (ב-DB)

## זרימת נתונים

### העלאת תמונה

```
1. משתמש מעלה תמונה → POST /api/ads/:id/images
   ↓
2. ads.controller.uploadImages קולט את הקבצים
   ↓
3. עבור כל קובץ:
   - קריאה ל-watermarkService.applyWatermark()
   - יצירת קובץ ממותג ב-/uploads/branded/
   - שמירת originalUrl + brandedUrl ב-DB
   ↓
4. החזרת brandedUrl ל-frontend
   ↓
5. התמונה המוצגת למשתמשים היא הממותגת
```

### צריבת Watermark (Sharp)

```
1. טעינת תמונה מקורית
2. טעינת לוגו
3. חישוב גודל לוגו (sizePct% מרוחב התמונה, לא פחות מ-64px)
4. שינוי גודל לוגו והוספת שקיפות (opacity)
5. חישוב מיקום לפי position (margin 16px)
6. הדבקת הלוגו על התמונה
7. שמירה ל-/uploads/branded/{filename}
```

### צריבת Watermark (PDF)

```
1. טעינת PDF
2. טעינת לוגו (embedPng)
3. עבור כל עמוד:
   - חישוב גודל לוגו (sizePct% מרוחב העמוד)
   - חישוב מיקום לפי position
   - ציור הלוגו עם opacity
4. שמירת PDF חדש ל-/uploads/branded/{filename}
```

## API Documentation

### GET /api/admin/branding

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "default",
    "logoUrl": "/uploads/logo-123456.png",
    "position": "bottom-left",
    "opacity": 70,
    "sizePct": 18,
    "updatedAt": "2026-01-08T12:00:00Z",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

### POST /api/admin/branding/logo

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
logo: [File] (PNG, max 1MB)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "default",
    "logoUrl": "/uploads/logo-789012.png",
    ...
  }
}
```

### PATCH /api/admin/branding

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "position": "top-right",
  "opacity": 80,
  "sizePct": 20
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "default",
    "position": "top-right",
    "opacity": 80,
    "sizePct": 20,
    ...
  }
}
```

### POST /api/admin/branding/preview

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "position": "bottom-left",
  "opacity": 70,
  "sizePct": 18,
  "sampleImageData": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "preview": "data:image/jpeg;base64,/9j/4AAQ..."
  }
}
```

## אבטחה

- כל ה-endpoints דורשים אימות (`authenticate`)
- כל ה-endpoints דורשים הרשאת ADMIN (`authorize('ADMIN')`)
- העלאת לוגו: ולידציה ל-PNG בלבד, עד 1MB
- ולידציה ל-position, opacity (0-100), sizePct (5-30)

## שגיאות נפוצות

### `ENOSPC: no space left on device`
**פתרון**: נקה מקום בדיסק ונסה שוב להתקין את החבילות.

### `Logo file not found`
**פתרון**: ודא שהלוגו הועלה בהצלחה דרך מסך האדמין.

### `EPERM: operation not permitted` (Prisma generate)
**פתרון**: יש להפסיק את השרת לפני הרצת `npx prisma generate`, או להמתין שהשרת יעלה מחדש (הוא יריץ generate אוטומטית).

## מגבלות ידועות

- תמונות קיימות לפני הפעלת המערכת לא מקבלות watermark (לא רטרואקטיבי)
- אם אין לוגו מוגדר, התמונות נשמרות ללא watermark
- ה-Preview דורש העלאת תמונת דוגמה (לא כולל תמונת ברירת מחדל במערכת)

## שיפורים עתידיים (אופציונלי)

- [ ] תמיכה בפורמטים נוספים (GIF, WebP, SVG)
- [ ] watermark לוידאו
- [ ] אפשרות לצריבה רטרואקטיבית (batch processing)
- [ ] תמונת דוגמה ברירת מחדל במערכת
- [ ] היסטוריה של שינויי קונפיג (audit log)
- [ ] תמיכה במספר לוגואים (למשל לפי קטגוריה)
- [ ] אפשרות להוסיף טקסט (במקום/נוסף ללוגו)
- [ ] watermark דינמי לפי משתמש (למשל ID מפרסם)

## תמיכה

לשאלות ובעיות, פנה לצוות הפיתוח.

---

**תאריך עדכון אחרון**: 8 ינואר 2026
**גרסה**: 1.0.0
