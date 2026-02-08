# תיעוד: מספר גיליון גלובלי לכל הגליונות

## 📋 תיאור השינוי

בעבר כל גיליון קיבל את מספר הגיליון שלו בנפרד (בהתאם ל-`version` המקומי שלו).  
כעת, **כל הגליונות (בכל הקטגוריות והערים) יקבלו את אותו מספר גליון**, שמסונכרן עם הגיליון הכללי.

### תהליך העבודה החדש:

1. **בפעם הראשונה**: כל הגליונות = גיליון 1, והגיליון הכללי = גיליון 1
2. **לאחר הפצת הגיליון הכללי**: כל הגליונות = גיליון 2, והגיליון הכללי = גיליון 2
3. **וכן הלאה...**

---

## 🔧 השינויים שבוצעו

### 1. מבנה הנתונים (Database)

#### טבלה חדשה: `NewspaperGlobalSettings`
```sql
CREATE TABLE "NewspaperGlobalSettings" (
    "id" TEXT NOT NULL,
    "currentIssue" INTEGER NOT NULL DEFAULT 1,
    "lastDistributed" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewspaperGlobalSettings_pkey" PRIMARY KEY ("id")
);
```

**שדות**:
- `currentIssue`: מספר הגליון הגלובלי הנוכחי
- `lastDistributed`: תאריך ההפצה האחרונה של הגיליון הכללי
- `updatedAt`: תאריך עדכון אחרון
- `createdAt`: תאריך יצירה

#### Migration
📁 `server/prisma/migrations/20260208_add_newspaper_global_settings/migration.sql`

---

### 2. שינויים בקוד

#### 2.1 `newspaper-sheet.service.ts`
✅ **פונקציות חדשות**:
- `getGlobalSettings()`: קבלת ההגדרות הגלובליות (או יצירתן אם לא קיימות)
- `incrementGlobalIssueNumber()`: העלאת מספר הגליון הגלובלי ב-1

```typescript
async getGlobalSettings() {
  let settings = await prisma.newspaperGlobalSettings.findFirst();
  
  if (!settings) {
    settings = await prisma.newspaperGlobalSettings.create({
      data: { currentIssue: 1 }
    });
  }
  
  return settings;
}

async incrementGlobalIssueNumber() {
  const settings = await this.getGlobalSettings();
  
  const updated = await prisma.newspaperGlobalSettings.update({
    where: { id: settings.id },
    data: {
      currentIssue: settings.currentIssue + 1,
      lastDistributed: new Date()
    }
  });
  
  console.log(`📰 Global issue number incremented to ${updated.currentIssue}`);
  return updated;
}
```

---

#### 2.2 `newspaper-sheet-pdf.service.ts`
✅ **שימוש במספר גליון גלובלי**:

**לפני**:
```typescript
const issueNumber = (sheet as any).issueNumber || `גליון ${sheet.version}`;
```

**אחרי**:
```typescript
const globalIssueNumber = await this.getGlobalIssueNumber();
const issueNumber = (sheet as any).issueNumber || `גליון ${globalIssueNumber}`;
```

---

#### 2.3 `newspaper-general-sheet.service.ts`
✅ **שימוש במספר גליון גלובלי בגיליון הכללי**:

**לפני**:
```typescript
const issueNumber = `גיליון כללי - ${new Date().toLocaleDateString('he-IL')}`;
```

**אחרי**:
```typescript
const globalIssueNumber = await this.getGlobalIssueNumber();
const issueNumber = `גליון ${globalIssueNumber}`;
```

---

#### 2.4 `newspaper-sheet.controller.ts`
✅ **העלאת מספר הגליון לאחר הפצה מוצלחת**:

בפונקציה `distributeGeneralSheetPDF()`:
```typescript
// Increment global issue number after successful distribution
if (successCount > 0) {
  await newspaperSheetService.incrementGlobalIssueNumber();
  console.log(`✅ Global issue number incremented after successful distribution`);
}
```

---

## 📊 דוגמה לתהליך

| שלב | פעולה | מספר גליון כללי | כל הגליונות |
|-----|-------|----------------|-------------|
| 1 | יצירת גיליונות ראשונים | 1 | גליון 1 |
| 2 | הפצת גיליון כללי | 2 | גליון 1 (עד שיחדשו) |
| 3 | יצירת PDF חדש לגיליון | 2 | גליון 2 |
| 4 | הפצת גיליון כללי שנית | 3 | גליון 2 |
| 5 | יצירת PDF חדש לגיליון | 3 | גליון 3 |

---

## 🧪 בדיקה

### סקריפט בדיקה
📁 `server/test-global-settings.ts`

**הרצה**:
```bash
cd server
npx tsx test-global-settings.ts
```

**מה הסקריפט עושה**:
1. קורא את ההגדרות הגלובליות
2. מדמה הפצה ומעלה את מספר הגליון
3. מוודא שהשינויים נשמרו
4. מחזיר את המצב למקור

---

## ✅ אימות התוצאה

כדי לוודא שהכל עובד כצפוי:

1. **צור גיליון חדש** - ראה שמספר הגליון הוא הנוכחי
2. **הפץ גיליון כללי** - מספר הגליון הגלובלי יעלה ב-1
3. **צור גיליון חדש אחר** - ראה שמספר הגליון התעדכן למספר הגלובלי החדש
4. **בדוק PDF** - ראה ש"גליון X" מופיע נכון בכל הגליונות

---

## 🎯 סיכום

המערכת כעת מנהלת מספר גליון גלובלי אחיד לכל הגליונות:
- ✅ כל הגליונות משתמשים באותו מספר גליון
- ✅ מספר הגליון עולה אוטומטית לאחר הפצת הגיליון הכללי
- ✅ ההיסטוריה של ההפצות נשמרת ב-`lastDistributed`
- ✅ התהליך אוטומטי ולא דורש התערבות ידנית

---

## 📝 הערות חשובות

1. **ערך ברירת מחדל**: המערכת מתחילה מגליון 1 אם אין הגדרות קיימות
2. **רשומה יחידה**: יש רק רשומה אחת בטבלה `NewspaperGlobalSettings`
3. **סנכרון**: כל גיליון שנוצר יקרא את המספר הגלובלי הנוכחי
4. **הפצה**: רק הפצה מוצלחת של הגיליון הכללי מעלה את המספר

---

**תאריך עדכון**: 8 בפברואר 2026  
**גרסה**: 1.0
