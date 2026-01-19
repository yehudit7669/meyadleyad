# מערכת גיליונות עיתון - תיעוד מלא

## סקירה כללית

מערכת גיליונות העיתון מאפשרת ניהול מודעות בפורמט עיתון דיגיטלי, עם PDF אחד לכל קטגוריה+עיר.

### עקרון מרכזי

❌ **לא** PDF לכל מודעה  
✅ **כן** PDF לכל גיליון (קטגוריה + עיר)

## מבנה הנתונים

### NewspaperSheet (גיליון)
```typescript
{
  id: string
  categoryId: string
  cityId: string
  title: string  // "דירות למכירה - בית שמש"
  headerImage?: string  // תמונת כותרת (banner)
  layoutConfig: {
    gridColumns: number
    cardPositions: Array<{
      listingId: string
      position: number
    }>
  }
  version: number  // גרסת PDF נוכחית
  pdfPath?: string  // נתיב ל-PDF הנוכחי
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}
```

### NewspaperSheetListing (קישור מודעה לגיליון)
```typescript
{
  sheetId: string
  listingId: string
  positionIndex: number  // מיקום בגריד
}
```

### NewspaperSheetVersion (היסטוריית גרסאות)
```typescript
{
  sheetId: string
  version: number
  pdfPath: string
  generatedBy: string
  createdAt: Date
}
```

## תהליך עבודה

### 1. אישור מודעה
כאשר Admin מאשר מודעה בקטגוריה "לוח מודעות - תצורת עיתון":

1. המערכת בודקת אם קיים גיליון פעיל לקטגוריה+עיר
2. אם לא - יוצרת גיליון חדש (DRAFT)
3. מוסיפה את המודעה לגיליון
4. מעדכנת את ה-layoutConfig

**לא** נוצר PDF בשלב זה!

### 2. עריכה וסידור
Admin יכול:
- לעדכן כותרת הגיליון
- להעלות תמונת כותרת (banner)
- לשנות סידור כרטיסי הנכסים (Drag & Drop)
- להסיר מודעות מהגיליון

### 3. יצירת PDF
כאשר Admin לוחץ על "יצירת PDF":

1. המערכת טוענת את הגיליון + כל המודעות
2. מייצרת HTML מעוצב בפורמט עיתון
3. ממירה ל-PDF עם Puppeteer
4. שומרת את הקובץ: `sheet_{id}_v{version}.pdf`
5. יוצרת רשומה ב-NewspaperSheetVersion
6. מעדכנת את version++ בגיליון

### 4. גרסאות
כל יצירה מחדש של PDF:
- משמרת את הגרסה הקודמת
- יוצרת קובץ חדש עם version מוגדל
- מאפשרת צפייה בהיסטוריה

## API Endpoints

### GET /api/admin/newspaper-sheets
רשימת כל הגיליונות

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `categoryId` (אופציונלי)
- `cityId` (אופציונלי)
- `status` (אופציונלי)

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "title": "דירות למכירה - בית שמש",
      "category": { "nameHe": "דירות למכירה" },
      "city": { "nameHe": "בית שמש" },
      "version": 3,
      "pdfPath": "/uploads/newspaper-sheets/sheet_xxx_v3.pdf",
      "status": "ACTIVE",
      "_count": { "listings": 12 }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### GET /api/admin/newspaper-sheets/:id
קבלת גיליון בודד עם כל הפרטים

**Response:**
```json
{
  "id": "...",
  "title": "דירות למכירה - בית שמש",
  "headerImage": "/uploads/headers/...",
  "layoutConfig": {
    "gridColumns": 3,
    "cardPositions": [...]
  },
  "version": 3,
  "pdfPath": "/uploads/newspaper-sheets/...",
  "listings": [
    {
      "positionIndex": 0,
      "listing": {
        "title": "דירה 4 חדרים",
        "address": "רחוב האורן 15",
        "price": 1500000,
        "AdImage": [...]
      }
    }
  ]
}
```

### POST /api/admin/newspaper-sheets/:id/add-listing
הוספת מודעה לגיליון

**Body:**
```json
{
  "listingId": "ad_123",
  "positionIndex": 5  // אופציונלי
}
```

### PUT /api/admin/newspaper-sheets/:id/listings/:listingId/position
עדכון מיקום מודעה (Drag & Drop)

**Body:**
```json
{
  "newPosition": 8
}
```

### DELETE /api/admin/newspaper-sheets/:id/listings/:listingId
הסרת מודעה מגיליון

### PUT /api/admin/newspaper-sheets/:id
עדכון פרטי גיליון

**Body:**
```json
{
  "title": "כותרת מעודכנת",
  "headerImage": "/uploads/new-header.jpg",
  "status": "ACTIVE"
}
```

### POST /api/admin/newspaper-sheets/:id/generate-pdf
יצירת PDF לגיליון

**Body:**
```json
{
  "force": false  // כפה יצירה חדשה גם אם קיים PDF
}
```

**Response:**
```json
{
  "pdfPath": "/uploads/newspaper-sheets/sheet_xxx_v4.pdf",
  "version": 4
}
```

### GET /api/admin/newspaper-sheets/category/:categoryId/city/:cityId
קבלת או יצירת גיליון פעיל לקטגוריה+עיר

## מבנה ה-PDF

### פורמט
- גודל: A4
- רזולוציה: הדפסה איכותית
- תמיכה בעברית (RTL)

### מבנה הדף
```
┌─────────────────────────────────────┐
│  [כותרת הגיליון]                    │
│  דירות למכירה | בית שמש              │
├─────────────────────────────────────┤
│  [תמונת כותרת רחבה - Banner]        │
├─────────────────────────────────────┤
│  ┌───┐  ┌───┐  ┌───┐                │
│  │ 1 │  │ 2 │  │ 3 │  ← Grid        │
│  └───┘  └───┘  └───┘                │
│  ┌───┐  ┌───┐  ┌───┐                │
│  │ 4 │  │ 5 │  │ 6 │                │
│  └───┘  └───┘  └───┘                │
├─────────────────────────────────────┤
│  גרסה 3 | תאריך                      │
└─────────────────────────────────────┘
```

### כרטיס נכס
כל כרטיס מכיל:
- תמונה ראשית (אם קיימת)
- כתובת מלאה
- מספר חדרים | שטח
- קומה (אם רלוונטי)
- תיאור קצר (2 שורות)
- מחיר מודגש

## Audit Log

כל הפעולות נרשמות:
- `NEWSPAPER_SHEET_CREATED` - יצירת גיליון חדש
- `NEWSPAPER_SHEET_UPDATED` - עדכון גיליון
- `NEWSPAPER_SHEET_DELETED` - מחיקת גיליון
- `LISTING_ADDED_TO_SHEET` - הוספת מודעה
- `LISTING_REMOVED_FROM_SHEET` - הסרת מודעה
- `LISTING_POSITION_UPDATED` - שינוי מיקום
- `SHEET_PDF_GENERATED` - יצירת PDF

## הרשאות

כל פעולות ה-newspaper-sheets דורשות הרשאת **Admin**.

המלצה להוסיף הרשאות ספציפיות:
- `VIEW_SHEET_PDF` - צפייה ב-PDF
- `EXPORT_SHEET_PDF` - הורדת PDF
- `REGENERATE_SHEET` - יצירת PDF מחדש
- `EDIT_SHEET_LAYOUT` - עריכת סידור

## תאימות לאחור

המודל הישן `NewspaperAd` נשאר במסד הנתונים (DEPRECATED) לצורך תאימות.  
הוא לא משמש יותר למודעות חדשות.

## נקודות שימוש

### אוטומציה
- מודעה מאושרת → הוספה אוטומטית לגיליון
- גיליון ריק → יצירה אוטומטית בעת הוספת מודעה ראשונה

### ידני
- עריכת כותרת וסידור
- יצירת PDF
- ניהול מודעות בגיליון

## דוגמאות שימוש

### יצירת גיליון חדש מקוד
```typescript
const sheet = await newspaperSheetService.getOrCreateActiveSheet(
  'category_id',
  'city_id',
  'admin_user_id'
);
```

### הוספת מודעה לגיליון
```typescript
await newspaperSheetService.addListingToSheet(
  'sheet_id',
  'listing_id',
  'admin_user_id',
  5  // position (optional)
);
```

### יצירת PDF
```typescript
const result = await newspaperSheetService.generateSheetPDF(
  'sheet_id',
  'admin_user_id',
  false  // force
);
// result: { pdfPath: '...', version: 4 }
```

## בדיקות והדגמה

### תרחיש 1: אישור מודעה ראשונה
1. אשר מודעה בקטגוריה "לוח מודעות" בבית שמש
2. בדוק ב-database שנוצר גיליון חדש
3. ודא שהמודעה מקושרת לגיליון
4. ודא ש-**לא** נוצר PDF אוטומטית

### תרחיש 2: אישור מודעה נוספת
1. אשר מודעה שנייה באותה קטגוריה+עיר
2. ודא שנוספה לגיליון הקיים
3. ודא שה-positionIndex הוא הבא בתור

### תרחיש 3: Drag & Drop
1. שנה את המיקום של כרטיס במסך העריכה
2. ודא שה-positionIndex התעדכן ב-DB
3. ודא שה-layoutConfig התעדכן

### תרחיש 4: יצירת PDF
1. לחץ על "יצירת PDF"
2. ודא שנוצר קובץ ב-uploads/newspaper-sheets
3. ודא שגרסה התעדכנה
4. ודא שנרשם ב-NewspaperSheetVersion

### תרחיש 5: גרסאות
1. ערוך את הגיליון (שנה סידור, הוסף מודעה)
2. צור PDF מחדש
3. ודא שנוצר קובץ חדש עם v2
4. ודא שה-PDF הישן נשמר

## צ'קליסט לפני השקה

- [ ] Migration הורץ בהצלחה
- [ ] API נבדק עם כל ה-endpoints
- [ ] אישור מודעה מוסיף לגיליון אוטומטית
- [ ] Drag & Drop עובד ומתעדכן ב-DB
- [ ] יצירת PDF עובדת ומייצרת קובץ תקין
- [ ] גרסאות נשמרות ולא נמחקות
- [ ] Audit Log רושם את כל הפעולות
- [ ] אין גישה למשתמשים רגילים
- [ ] תמיכה בעברית ב-PDF
- [ ] תמונות מוצגות נכון ב-PDF
- [ ] מחירים מוצגים בפורמט נכון

## תמיכה ותחזוקה

### לוגים
כל פעולה נרשמת ב-console:
```
✅ Ad {adId} added to newspaper sheet {sheetId} ({title})
✅ PDF generated: {pdfPath}, version {version}
❌ Failed to add ad to newspaper sheet: {error}
```

### בעיות נפוצות

**בעיה**: מודעה לא מתווספת לגיליון  
**פתרון**: בדוק שהקטגוריה נכונה ויש cityId

**בעיה**: PDF לא נוצר  
**פתרון**: ודא ש-Puppeteer מותקן ופועל

**בעיה**: תמונות לא מוצגות ב-PDF  
**פתרון**: בדוק נתיבי קבצים ב-uploads/

---

**גרסה**: 1.0  
**תאריך**: 18/01/2026
