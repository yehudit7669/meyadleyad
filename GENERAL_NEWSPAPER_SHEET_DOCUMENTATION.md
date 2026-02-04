# מערכת לוח מודעות כללי - תיעוד מלא

## 📋 סקירה כללית

מערכת לוח המודעות הכללי מאחדת את כל לוחות המודעות הקיימים (קטגוריה + עיר) לקובץ PDF אחד מקיף.

### ✨ תכונות עיקריות

1. **לוח מודעות כללי אחד** - מכיל את כל הנכסים מכל הקטגוריות והערים
2. **כותרת בעמוד הראשון בלבד** - "לוח מודעות כללי"
3. **דפים נוספים ללא כותרת** - רק המודעות עצמן עם סרגל צד (עיר + קטגוריה)
4. **סדר מסודר** - לפי ערים או קטגוריות (ניתן לבחור)
5. **סנכרון אוטומטי** - הלוח נוצר תמיד מחדש על פי הנתונים העדכניים

---

## 🏗️ ארכיטקטורה

### קבצים חדשים שנוצרו

```
server/src/modules/newspaper-sheets/
├── newspaper-general-sheet.service.ts   ← Service חדש ללוח כללי
└── types.ts                             ← עודכן עם types חדשים
```

### Types חדשים (types.ts)

```typescript
/**
 * General Sheet Options
 */
export interface GeneralSheetOptions {
  force?: boolean;
  orderBy?: 'city' | 'category';
}

/**
 * Combined Sheet for General Newspaper
 */
export interface CombinedSheetData {
  cityName: string;
  categoryName: string;
  sheets: SheetWithListings[];
}
```

---

## 🔧 API Endpoints

### יצירת לוח מודעות כללי

**POST** `/api/admin/newspaper-sheets/general/generate-pdf`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "force": false,
  "orderBy": "city"
}
```

**Options:**
- `force` (boolean, אופציונלי): כפה יצירה חדשה גם אם קיים PDF
- `orderBy` (string, אופציונלי): `"city"` או `"category"` - סדר הדפים

**Response:**
```json
{
  "pdfPath": "/uploads/newspaper-sheets/general_sheet_1675432100000.pdf"
}
```

---

## 📄 מבנה הלוח הכללי

### עמוד ראשון

```
┌─────────────────────────────────────┐
│                                     │
│     לוח מודעות כללי                 │
│     ═══════════════                 │
│                                     │
│   כל הנכסים באתר במסמך אחד          │
│   X לוחות מודעות מסודרים             │
│   לפי עיר וקטגוריה                  │
│                                     │
└─────────────────────────────────────┘
```

### דפים נוספים

כל דף מכיל:
- **סרגל צד** - עיר + קטגוריה (כמו בלוחות הרגילים)
- **גריד של מודעות** - 3 עמודות
- **ללא כותרת עליונה** - רק המודעות

---

## 🔄 תהליך היצירה

### שלב 1: שליפת נתונים
```typescript
const sheets = await this.getAllActiveSheets(orderBy);
```
- שליפת כל הלוחות הפעילים
- סינון רק לוחות עם לפחות נכס אחד
- מיון לפי עיר או קטגוריה

### שלב 2: יצירת HTML
```typescript
const html = await this.generateCombinedHTML(sheets);
```
- עמוד ראשון עם כותרת כללית
- דפים נוספים - כל לוח ללא כותרת

### שלב 3: יצירת PDF
```typescript
const pdfBuffer = await page.pdf({ format: 'A4', ... });
```
- שימוש ב-Puppeteer
- פורמט A4
- שמירה כ-Buffer

### שלב 4: שמירת הקובץ
```typescript
await fs.writeFile(filePath, pdfBuffer);
```
- שמירה ב-`/uploads/newspaper-sheets/`
- שם קובץ: `general_sheet_<timestamp>.pdf`

---

## 🎨 עיצוב

### סגנונות משותפים

הלוח הכללי משתמש באותם סגנונות של הלוחות הרגילים:

- **צבעי ברנדינג**: `#C9943D` (זהב), `#1F3F3A` (ירוק כהה)
- **גופן**: Assistant, Rubik
- **גריד**: 3 עמודות
- **כרטיסי נכסים**: עיצוב זהה לגיליונות רגילים

### הבדלים

1. **עמוד ראשון** - כותרת מיוחדת ללוח כללי
2. **דפים נוספים** - ללא כותרת, רק סרגל צד + גריד
3. **מרווח עליון** - `margin-top: 10mm` בדפים נוספים

---

## 🔌 שימוש מקוד

### דוגמה 1: יצירת לוח כללי בסיסי

```typescript
import { newspaperSheetService } from './newspaper-sheet.service';

const result = await newspaperSheetService.generateGeneralSheetPDF(
  userId,
  { orderBy: 'city' }
);

console.log('PDF path:', result.pdfPath);
```

### דוגמה 2: יצירה עם כפיה

```typescript
const result = await newspaperSheetService.generateGeneralSheetPDF(
  userId,
  { 
    force: true,
    orderBy: 'category' 
  }
);
```

### דוגמה 3: שימוש ישיר ב-Service

```typescript
import { newspaperGeneralSheetService } from './newspaper-general-sheet.service';

const pdfBuffer = await newspaperGeneralSheetService.generateGeneralSheetPDF({
  orderBy: 'city'
});

// שמירה ידנית
fs.writeFileSync('general.pdf', pdfBuffer);
```

---

## 📊 סדר הדפים

### לפי עיר (city)

```
עמוד 1: כותרת כללית
עמוד 2: ירושלים - דירות למכירה
עמוד 3: ירושלים - דירות להשכרה
עמוד 4: תל אביב - דירות למכירה
עמוד 5: תל אביב - דירות להשכרה
...
```

### לפי קטגוריה (category)

```
עמוד 1: כותרת כללית
עמוד 2: דירות למכירה - ירושלים
עמוד 3: דירות למכירה - תל אביב
עמוד 4: דירות להשכרה - ירושלים
עמוד 5: דירות להשכרה - תל אביב
...
```

---

## ✅ סנכרון אוטומטי

הלוח הכללי **תמיד מעודכן** מכיוון שהוא נוצר on-demand:

### תרחישים

1. **הוספת נכס** 
   - הנכס מתווסף ללוח הספציפי (קטגוריה + עיר)
   - בקריאה הבאה ל-`generateGeneralSheetPDF` הוא יכלל אוטומטית

2. **הסרת נכס**
   - הנכס מוסר מהלוח הספציפי
   - בקריאה הבאה ל-`generateGeneralSheetPDF` הוא לא יכלל

3. **אין כפילויות**
   - כל נכס מופיע פעם אחת בלבד
   - לפי הלוח הספציפי שלו (קטגוריה + עיר)

---

## 🧪 בדיקות

### בדיקה 1: יצירת לוח כללי

```bash
curl -X POST http://localhost:5000/api/admin/newspaper-sheets/general/generate-pdf \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"orderBy": "city"}'
```

**תוצאה צפויה:**
```json
{
  "pdfPath": "/uploads/newspaper-sheets/general_sheet_1234567890.pdf"
}
```

### בדיקה 2: וידוא תוכן PDF

1. פתח את הקובץ שנוצר
2. בדוק שעמוד ראשון מכיל כותרת "לוח מודעות כללי"
3. בדוק שדפים נוספים מכילים רק סרגל צד + מודעות
4. בדוק שכל הנכסים מופיעים

### בדיקה 3: סדר הדפים

```typescript
// בדיקה שהסדר נכון
const sheets = await newspaperGeneralSheetService['getAllActiveSheets']('city');

console.log(sheets.map(s => ({
  city: s.city.nameHe,
  category: s.category.nameHe
})));

// צפי: כל העיר אחת אחרי השנייה
```

---

## 🔒 אבטחה

- ✅ נדרש אימות (`authenticate`)
- ✅ נדרש הרשאת Admin (`requireAdmin`)
- ✅ רק משתמשים מורשים יכולים ליצור לוח כללי

---

## 📝 Audit Log

כל יצירה של לוח כללי נרשמת:

```typescript
{
  action: 'GENERAL_SHEET_PDF_GENERATED',
  userId: '<user-id>',
  data: {
    pdfPath: '/uploads/newspaper-sheets/general_sheet_xxx.pdf',
    orderBy: 'city'
  }
}
```

---

## ⚙️ הגדרות

### ברירות מחדל

```typescript
const DEFAULT_OPTIONS = {
  orderBy: 'city',  // סדר לפי עיר
  force: false      // לא כופה יצירה חדשה
};
```

### ניתן לשנות ב-Request Body

```json
{
  "orderBy": "category",
  "force": true
}
```

---

## 🚀 דוגמאות שימוש

### מהממשק האדמיניסטרטיבי

```typescript
// בלחיצה על כפתור "צור לוח כללי"
const handleGenerateGeneral = async () => {
  const response = await fetch('/api/admin/newspaper-sheets/general/generate-pdf', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderBy: selectedOrder,
      force: false
    })
  });

  const data = await response.json();
  window.open(data.pdfPath, '_blank');
};
```

### כ-Cron Job יומי

```typescript
import cron from 'node-cron';
import { newspaperSheetService } from './newspaper-sheet.service';

// כל יום בחצות
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Generating daily general sheet...');
  
  const result = await newspaperSheetService.generateGeneralSheetPDF(
    'system',
    { orderBy: 'city' }
  );
  
  console.log('✅ Daily general sheet created:', result.pdfPath);
});
```

---

## 🎯 תכונות עתידיות (אפשריות)

- [ ] שמירת היסטוריה של לוחות כלליים
- [ ] שליחה אוטומטית במייל
- [ ] אפשרות לבחור ערים/קטגוריות ספציפיות
- [ ] תמיכה בעמוד שער מותאם אישית
- [ ] אפשרות להוסיף פרסומות בין הדפים

---

## 📞 תמיכה

לשאלות או בעיות:
- בדוק את הלוגים: `console.log` בכל שלב
- וודא שיש לוחות פעילים עם נכסים
- בדוק הרשאות Admin

---

## ✅ סיכום

✅ **לוח כללי אחד** - מאחד את כל הלוחות הקיימים  
✅ **כותרת בעמוד הראשון בלבד**  
✅ **דפים נוספים ללא כותרת** - רק סרגל צד + מודעות  
✅ **סדר מסודר** - לפי עיר או קטגוריה  
✅ **סנכרון אוטומטי** - תמיד מעודכן  
✅ **לא משבר קוד קיים** - מודול נפרד ומבודד  
✅ **API פשוט** - endpoint אחד ליצירה  

---

**תאריך עדכון:** {{ new Date().toLocaleDateString('he-IL') }}  
**גרסה:** 1.0.0
