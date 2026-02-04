# 📰 לוח מודעות כללי - מדריך שימוש מהיר

## 🎯 מטרה

יצירת לוח מודעות כללי אחד שמאחד את כל הנכסים באתר - מכל הקטגוריות וכל הערים.

---

## ✨ תכונות

✅ **כותרת בעמוד הראשון** - "לוח מודעות כללי"  
✅ **דפים נוספים ללא כותרת** - רק סרגל צד (עיר + קטגוריה) + מודעות  
✅ **סדר מסודר** - לפי ערים או קטגוריות  
✅ **סנכרון אוטומטי** - תמיד מעודכן עם הנתונים האחרונים  
✅ **אין כפילויות** - כל נכס מופיע פעם אחת בלבד  

---

## 🚀 איך להשתמש?

### אפשרות 1: דרך API

```bash
POST /api/admin/newspaper-sheets/general/generate-pdf
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "orderBy": "city"
}
```

**תגובה:**
```json
{
  "pdfPath": "/uploads/newspaper-sheets/general_sheet_1234567890.pdf"
}
```

### אפשרות 2: מקוד TypeScript

```typescript
import { newspaperSheetService } from './newspaper-sheet.service';

const result = await newspaperSheetService.generateGeneralSheetPDF(
  userId,
  { orderBy: 'city' }
);

console.log('PDF נוצר:', result.pdfPath);
```

### אפשרות 3: בדיקה מהירה

```powershell
# הרץ סקריפט בדיקה
.\test-general-sheet.ps1
```

---

## 📊 סדר הדפים

### לפי עיר (`orderBy: "city"`)

```
עמוד 1: לוח מודעות כללי (כותרת)
עמוד 2-N: כל הקטגוריות של עיר ראשונה
עמוד N+1: כל הקטגוריות של עיר שנייה
...
```

**דוגמה:**
```
עמוד 1: כותרת כללית
עמוד 2: ירושלים - דירות למכירה
עמוד 3: ירושלים - דירות להשכרה
עמוד 4: תל אביב - דירות למכירה
עמוד 5: תל אביב - דירות להשכרה
```

### לפי קטגוריה (`orderBy: "category"`)

```
עמוד 1: לוח מודעות כללי (כותרת)
עמוד 2-N: כל הערים של קטגוריה ראשונה
עמוד N+1: כל הערים של קטגוריה שנייה
...
```

**דוגמה:**
```
עמוד 1: כותרת כללית
עמוד 2: דירות למכירה - ירושלים
עמוד 3: דירות למכירה - תל אביב
עמוד 4: דירות להשכרה - ירושלים
עמוד 5: דירות להשכרה - תל אביב
```

---

## 🔄 סנכרון אוטומטי

הלוח הכללי **תמיד מעודכן** כי הוא נוצר on-demand:

### כשמוסיפים נכס
1. הנכס מתווסף ללוח הספציפי שלו (קטגוריה + עיר)
2. בקריאה הבאה ל-`generateGeneralSheetPDF` הוא יכלל אוטומטית

### כשמוחקים נכס
1. הנכס מוסר מהלוח הספציפי שלו
2. בקריאה הבאה ל-`generateGeneralSheetPDF` הוא לא יכלל

### אין צורך בעדכון ידני!

---

## 📁 מבנה הקבצים

```
server/src/modules/newspaper-sheets/
├── newspaper-general-sheet.service.ts    ← Service ללוח כללי
├── newspaper-sheet.service.ts            ← הוספה: generateGeneralSheetPDF()
├── newspaper-sheet.controller.ts         ← הוספה: generateGeneralSheetPDF()
├── newspaper-sheet.routes.ts             ← הוספה: POST /general/generate-pdf
└── types.ts                              ← הוספה: GeneralSheetOptions

server/
└── test-general-sheet.ts                 ← סקריפט בדיקה

root/
├── test-general-sheet.ps1                ← סקריפט PowerShell
└── GENERAL_NEWSPAPER_SHEET_DOCUMENTATION.md
```

---

## 🧪 בדיקות

### בדיקה 1: יצירת לוח כללי

```bash
curl -X POST http://localhost:5000/api/admin/newspaper-sheets/general/generate-pdf \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"orderBy": "city"}'
```

### בדיקה 2: הרצת סקריפט

```powershell
.\test-general-sheet.ps1
```

### בדיקה 3: וידוא תוכן

1. פתח את ה-PDF שנוצר
2. וודא שעמוד ראשון מכיל "לוח מודעות כללי"
3. וודא שדפים נוספים מכילים רק סרגל צד + מודעות
4. וודא שכל הנכסים מופיעים

---

## ⚙️ אפשרויות

### `orderBy`

- `"city"` (ברירת מחדל) - מיון לפי ערים
- `"category"` - מיון לפי קטגוריות

### `force`

- `false` (ברירת מחדל) - לא כופה יצירה
- `true` - כופה יצירה חדשה

**דוגמה:**
```json
{
  "orderBy": "category",
  "force": true
}
```

---

## 🎨 עיצוב

הלוח הכללי משתמש באותו עיצוב של הלוחות הרגילים:

- **צבעים**: זהב (#C9943D) + ירוק כהה (#1F3F3A)
- **גופן**: Assistant, Rubik
- **גריד**: 3 עמודות
- **כרטיסי נכסים**: עיצוב זהה

---

## ❓ שאלות נפוצות

### האם הלוח הכללי מתעדכן אוטומטית?
כן! כל קריאה ל-API יוצרת את הלוח מחדש עם הנתונים העדכניים.

### איך מוחקים לוחות ישנים?
ניתן למחוק ידנית מתיקיית `/uploads/newspaper-sheets/`

### האם יש הגבלה על גודל?
לא, הלוח יכיל את כל הנכסים שיש במערכת.

### מה קורה אם אין נכסים?
תתקבל שגיאה: "אין לוחות מודעות פעילים במערכת"

---

## 📞 תמיכה

- **תיעוד מלא**: ראה `GENERAL_NEWSPAPER_SHEET_DOCUMENTATION.md`
- **לוגים**: בדוק את הקונסול - יש `console.log` בכל שלב
- **בעיות**: וודא שיש לוחות פעילים עם נכסים

---

## ✅ סיכום מהיר

```typescript
// 1. ייבא את ה-service
import { newspaperSheetService } from './newspaper-sheet.service';

// 2. צור לוח כללי
const result = await newspaperSheetService.generateGeneralSheetPDF(userId, {
  orderBy: 'city'  // או 'category'
});

// 3. קבל את הנתיב
console.log('PDF:', result.pdfPath);

// 4. הורד או הצג
window.open(result.pdfPath, '_blank');
```

---

**זהו! לוח המודעות הכללי מוכן לשימוש** 🎉
