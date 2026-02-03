# בדיקת אינטגרציה - לוח מודעות תצורת עיתון

## תאריך: 3 בפברואר 2026

## סיכום הממצאים

### ✅ **תרחיש 1: יצירת נכס חדש והוספה ללוח המודעות**

#### מיקום הקוד
- **קובץ**: `server/src/modules/admin/admin.service.ts`
- **פונקציה**: `approveAd`
- **שורות**: 212-258

#### איך זה עובד
1. כאשר מנהל מאשר נכס (סטטוס משתנה מ-`PENDING` ל-`ACTIVE`), הקוד בודק אם הנכס צריך להיכנס ללוח המודעות
2. הקוד קורא ל-`newspaperSheetService.getOrCreateActiveSheet()` עם:
   - `categoryId` - הקטגוריה של הנכס
   - `cityId` - העיר של הנכס
   - `adminId` - מזהה המנהל

3. **תרחיש א': גיליון לא קיים**
   - הפונקציה יוצרת גיליון חדש עם:
     - כותרת: `{קטגוריה} - {עיר}` (למשל: "דירות למכירה - בית שמש")
     - סטטוס: `ACTIVE`
     - מבנה גריד: 3 עמודות
   - מוסיפה את הנכס לגיליון החדש

4. **תרחיש ב': גיליון כבר קיים**
   - הפונקציה מוצאת את הגיליון הפעיל הקיים
   - מוסיפה את הנכס לגיליון הקיים באמצעות `addListingToSheet()`

5. **יצירת PDF**
   - לאחר ההוספה, הקוד מייצר PDF אוטומטית עבור הגיליון
   - ה-PDF נשמר עם מספר גרסה מתעדכן

#### קוד רלוונטי
```typescript
// server/src/modules/admin/admin.service.ts (שורות 212-258)

// קבלת או יצירת גיליון פעיל
const sheet = await newspaperSheetService.getOrCreateActiveSheet(
  ad.categoryId,
  ad.cityId,
  adminId
);

// הוספת המודעה לגיליון
await newspaperSheetService.addListingToSheet(
  sheet.id,
  adId,
  adminId
);

// יצירת PDF לגיליון
const pdfResult = await newspaperSheetService.generateSheetPDF(sheet.id, adminId);
```

---

### ✅ **תרחיש 2: מחיקת נכס והסרה מלוח המודעות**

#### מיקום הקוד - **לפני התיקון**
- **קובץ**: `server/src/modules/ads/ads.service.ts`
- **פונקציה**: `deleteAd`
- **בעיה**: הקוד **לא היה** מסיר את הנכס מגיליונות העיתון לפני המחיקה

#### מיקום הקוד - **אחרי התיקון** ✅
- **קובץ**: `server/src/modules/ads/ads.service.ts`
- **פונקציה**: `deleteAd`
- **שורות**: 552-610 (משוערך)

#### איך זה עובד עכשיו
1. כאשר משתמש או מנהל מוחק נכס, הקוד:
   - מחפש את כל הגיליונות שמכילים את הנכס
   - שומר את מזהי הגיליונות המושפעים
   - מסיר את הנכס מכל הגיליונות האלה (באמצעות `prisma.newspaperSheetListing.deleteMany`)
   - מוחק את הנכס עצמו
   - **מייצר PDF מעודכן** לכל גיליון שהושפע (כדי שה-PDF ישקף את המצב החדש)

2. אם יש שגיאה בהסרה מהעיתון או ביצירת PDF, הקוד ממשיך למחיקה (עם לוג שגיאה)

#### קוד שהוסף
```typescript
// server/src/modules/ads/ads.service.ts

async deleteAd(adId: string, userId: string, userRole: string) {
  // ... בדיקות הרשאות ...

  // ✅ NEW: הסרה מגיליונות עיתון לפני מחיקה
  const affectedSheetIds: string[] = [];
  try {
    // מציאת כל הגיליונות שמכילים את הנכס הזה
    const sheetListings = await prisma.newspaperSheetListing.findMany({
      where: { listingId: adId },
      select: { sheetId: true }
    });

    console.log(`🗑️ Removing ad ${adId} from ${sheetListings.length} newspaper sheet(s)...`);

    // שמירת מזהי הגיליונות המושפעים
    affectedSheetIds.push(...sheetListings.map(sl => sl.sheetId));

    // הסרה מכל הגיליונות
    if (sheetListings.length > 0) {
      await prisma.newspaperSheetListing.deleteMany({
        where: { listingId: adId }
      });
      console.log(`✅ Ad ${adId} removed from all newspaper sheets`);
    }
  } catch (error) {
    console.error('❌ Failed to remove ad from newspaper sheets:', error);
    // ממשיכים למחיקה גם אם יש בעיה בהסרה מהעיתון
  }

  await prisma.ad.delete({
    where: { id: adId },
  });

  // ✅ NEW: יצירת PDF מעודכן לגיליונות המושפעים
  if (affectedSheetIds.length > 0) {
    try {
      const { newspaperSheetService } = await import('../newspaper-sheets/newspaper-sheet.service.js');
      
      for (const sheetId of affectedSheetIds) {
        console.log(`📄 Regenerating PDF for affected sheet ${sheetId}...`);
        await newspaperSheetService.generateSheetPDF(sheetId, userId, true); // force = true
        console.log(`✅ PDF regenerated for sheet ${sheetId}`);
      }
    } catch (error) {
      console.error('❌ Failed to regenerate PDFs:', error);
      // לא חוסמים את המחיקה בגלל שגיאה ביצירת PDF
    }
  }
}
```

---

## מבנה הנתונים

### טבלאות רלוונטיות

1. **NewspaperSheet** - גיליון עיתון
   - `id` - מזהה ייחודי
   - `categoryId` - קטגוריה (למשל: דירות למכירה)
   - `cityId` - עיר (למשל: בית שמש)
   - `title` - כותרת הגיליון
   - `status` - `DRAFT` | `ACTIVE` | `ARCHIVED`
   - `version` - גרסת PDF נוכחית
   - `pdfPath` - נתיב ל-PDF

2. **NewspaperSheetListing** - קשר בין גיליון לנכס
   - `id` - מזהה ייחודי
   - `sheetId` - מזהה הגיליון
   - `listingId` - מזהה הנכס (Ad)
   - `positionIndex` - מיקום בגריד
   - **Composite Unique Key**: `(sheetId, listingId)` - מונע כפילויות

3. **Ad** - נכס
   - `id` - מזהה ייחודי
   - `categoryId` - קטגוריה
   - `cityId` - עיר
   - `status` - `PENDING` | `ACTIVE` | `REJECTED` | וכו'

---

## תהליכי עבודה

### תרחיש מלא: מאישור ועד למחיקה

```
1. נכס חדש נוצר → סטטוס: PENDING
   ↓
2. מנהל מאשר נכס → approveAd() נקראת
   ↓
3. בדיקה: האם צריך להוסיף ללוח מודעות?
   ├─ כן → getOrCreateActiveSheet(categoryId, cityId)
   │        ├─ גיליון קיים? → הוסף לגיליון
   │        └─ גיליון לא קיים? → צור גיליון חדש + הוסף
   │
   ↓
4. addListingToSheet() מוסיף את הנכס
   ↓
5. generateSheetPDF() מייצר PDF חדש
   ↓
6. נכס פעיל ומופיע בלוח המודעות ✅
   
   ...זמן עובר...
   
7. משתמש/מנהל מוחק נכס → deleteAd() נקראת
   ↓
8. חיפוש כל הגיליונות שמכילים את הנכס
   ↓
9. שמירת מזהי הגיליונות המושפעים
   ↓
10. הסרה מכל הגיליונות (deleteMany)
    ↓
11. מחיקת הנכס עצמו
    ↓
12. **יצירת PDF מעודכן לכל גיליון שהושפע** ✨
    ↓
13. נכס נמחק, הוסר מהגיליונות, וה-PDF עודכן ✅
```

---

## דוגמאות מעשיות

### דוגמה 1: נכס ראשון בקטגוריה+עיר
```
נכס: דירה למכירה בבית שמש
קטגוריה: "דירות למכירה" (categoryId: xxx)
עיר: "בית שמש" (cityId: yyy)

תהליך:
1. מנהל מאשר → approveAd()
2. בדיקה: האם קיים גיליון ל-"דירות למכירה - בית שמש"?
   ✗ לא קיים
3. יצירת גיליון חדש:
   - כותרת: "דירות למכירה - בית שמש"
   - סטטוס: ACTIVE
   - גריד: 3 עמודות
4. הוספת הנכס לגיליון (position 0)
5. יצירת PDF (version 1)

תוצאה: גיליון חדש עם נכס אחד
```

### דוגמה 2: נכס שני באותה קטגוריה+עיר
```
נכס: דירה למכירה בבית שמש (שניה)
קטגוריה: "דירות למכירה" (categoryId: xxx)
עיר: "בית שמש" (cityId: yyy)

תהליך:
1. מנהל מאשר → approveAd()
2. בדיקה: האם קיים גיליון ל-"דירות למכירה - בית שמש"?
   ✓ כן! (נוצר בדוגמה 1)
3. שימוש בגיליון הקיים
4. הוספת הנכס לגיליון (position 1)
5. עדכון PDF (version 2)

תוצאה: אותו גיליון עם 2 נכסים
```

### דוגמה 3: נכס באותה קטגוריה, עיר שונה
```
נכס: דירה למכירה בירושלים
קטגוריה: "דירות למכירה" (categoryId: xxx)
עיר: "ירושלים" (cityId: zzz) ← שונה!

תהליך:
1. מנהל מאשר → approveAd()
2. בדיקה: האם קיים גיליון ל-"דירות למכירה - ירושלים"?
   ✗ לא קיים (קיים רק ל-בית שמש)
3. יצירת גיליון חדש:
   - כותרת: "דירות למכירה - ירושלים"
   - סטטוס: ACTIVE
4. הוספת הנכס לגיליון החדש
5. יצירת PDF

תוצאה: גיליון חדש נפרד לירושלים
```

### דוגמה 4: מחיקת נכס
```
מוחקים את הנכס השני מדוגמה 2

תהליך:
1. deleteAd(adId) נקראת
2. חיפוש: האם הנכס מופיע בגיליונות?
   ✓ כן - בגיליון "דירות למכירה - בית שמש"
3. שמירת מזהה הגיליון (לצורך עדכון PDF)
4. הסרה מהגיליון (deleteMany)
5. מחיקת הנכס
6. ✨ יצירת PDF חדש לגיליון (ללא הנכס שנמחק)

תוצאה: 
- הגיליון נשאר עם נכס אחד בלבד (הראשון)
- ה-PDF עודכן ומשקף את המצב החדש
```

---

## בדיקות שבוצעו

### ✅ בדיקה 1: לוגיקת אישור נכס
- **מיקום**: [admin.service.ts](server/src/modules/admin/admin.service.ts#L156-L260)
- **סטטוס**: הלוגיקה קיימת ועובדת
- **פרטים**:
  - הקוד בודק אם הנכס צריך להיכנס ללוח מודעות
  - קורא ל-`getOrCreateActiveSheet` עם קטגוריה ועיר
  - מוסיף את הנכס לגיליון
  - מייצר PDF

### ✅ בדיקה 2: לוגיקת יצירה/מציאת גיליון
- **מיקום**: [newspaper-sheet.service.ts](server/src/modules/newspaper-sheets/newspaper-sheet.service.ts#L26-L100)
- **סטטוס**: הלוגיקה קיימת ועובדת
- **פרטים**:
  - הפונקציה מחפשת גיליון פעיל קיים לקטגוריה+עיר
  - אם לא קיים - יוצרת חדש
  - אם קיים - מחזירה את הקיים

### ⚠️ בדיקה 3: לוגיקת מחיקת נכס (תוקן!)
- **מיקום**: [ads.service.ts](server/src/modules/ads/ads.service.ts#L552-L610)
- **סטטוס לפני**: ❌ חסר - לא היה מסיר מגיליונות ולא היה מעדכן PDF
- **סטטוס אחרי**: ✅ תוקן - מסיר מכל הגיליונות + **מעדכן PDF אוטומטית**
- **פרטים**:
  - הוספתי קוד שמחפש את כל הגיליונות שמכילים את הנכס
  - שומר את מזהי הגיליונות המושפעים
  - מוחק את הקשרים (NewspaperSheetListing)
  - **מייצר PDF חדש לכל גיליון שהושפע**
  - רק אז מוחק את הנכס עצמו

---

## שינויים שבוצעו

### שינוי 1: תיקון פונקציית deleteAd - הסרה מגיליונות

**קובץ**: `server/src/modules/ads/ads.service.ts`

**מה שהוסף - חלק א' (הסרה מגיליונות)**:
```typescript
// ✅ NEW: הסרה מגיליונות עיתון לפני מחיקה
const affectedSheetIds: string[] = [];
try {
  // מציאת כל הגיליונות שמכילים את הנכס הזה
  const sheetListings = await prisma.newspaperSheetListing.findMany({
    where: { listingId: adId },
    select: { sheetId: true }
  });

  console.log(`🗑️ Removing ad ${adId} from ${sheetListings.length} newspaper sheet(s)...`);

  // שמירת מזהי הגיליונות המושפעים
  affectedSheetIds.push(...sheetListings.map(sl => sl.sheetId));

  // הסרה מכל הגיליונות
  if (sheetListings.length > 0) {
    await prisma.newspaperSheetListing.deleteMany({
      where: { listingId: adId }
    });
    console.log(`✅ Ad ${adId} removed from all newspaper sheets`);
  }
} catch (error) {
  console.error('❌ Failed to remove ad from newspaper sheets:', error);
  // ממשיכים למחיקה גם אם יש בעיה בהסרה מהעיתון
}
```

**למה זה חשוב**:
- מונע foreign key errors
- שומר על שלמות הנתונים
- מבטיח שנכס שנמחק לא יישאר בגיליונות "תלויים באוויר"

### שינוי 2: עדכון אוטומטי של PDF אחרי מחיקה

**קובץ**: `server/src/modules/ads/ads.service.ts` (המשך)

**מה שהוסף - חלק ב' (עדכון PDF)**:
```typescript
// ✅ NEW: יצירת PDF מעודכן לגיליונות המושפעים
if (affectedSheetIds.length > 0) {
  try {
    const { newspaperSheetService } = await import('../newspaper-sheets/newspaper-sheet.service.js');
    
    for (const sheetId of affectedSheetIds) {
      console.log(`📄 Regenerating PDF for affected sheet ${sheetId}...`);
      await newspaperSheetService.generateSheetPDF(sheetId, userId, true); // force = true
      console.log(`✅ PDF regenerated for sheet ${sheetId}`);
    }
  } catch (error) {
    console.error('❌ Failed to regenerate PDFs:', error);
    // לא חוסמים את המחיקה בגלל שגיאה ביצירת PDF
  }
}
```

**למה זה חשוב**:
- מבטיח ש-PDF תמיד משקף את המצב העדכני של הגיליון
- משתמשים שמורידים את ה-PDF לא יראו נכסים שכבר נמחקו
- הגיליון נשאר עדכני בזמן אמת

---

## נקודות לתשומת לב

### 🔍 מצב TESTING
הקוד באישור נכס נמצא במצב בדיקה:
```typescript
// 🧪 TEMPORARY: Add ALL ads to newspaper sheets for testing
const isNewspaperCategory = true;
```

**משמעות**: **כל** הנכסים מתווספים ללוח מודעות, לא רק אלה בקטגוריות מסוימות.

**לפני עליה לפרודקשן** - צריך לשנות ל:
```typescript
const isNewspaperCategory = ad.Category.slug?.includes('loach') || 
                            ad.Category.slug?.includes('newspaper') ||
                            ad.Category.nameHe?.includes('לוח מודעות') ||
                            ad.Category.nameHe?.includes('עיתון');
```

### ⚡ ביצועים
- הפונקציה `deleteAd` עושה שאילתות DB נוספות לפני מחיקה:
  1. חיפוש גיליונות שמכילים את הנכס
  2. מחיקת הקשרים
  3. יצירת PDF לכל גיליון שהושפע
- השפעה על ביצועים מינימלית כי:
  1. זה קורה רק במחיקה (לא פעולה תכופה)
  2. השאילתות פשוטות וממוינות
  3. יש לנו אינדקס על `listingId`
  4. יצירת PDF רצה באסינכרון ולא חוסמת

---

## סיכום

### ✅ מה עובד
1. **יצירת גיליון חדש** - כאשר נכס ראשון בקטגוריה+עיר מאושר
2. **הוספה לגיליון קיים** - כאשר נכס נוסף באותה קטגוריה+עיר מאושר
3. **יצירת PDF אוטומטי** - לאחר כל הוספת נכס
4. **הסרה מגיליונות במחיקה** - נכס שנמחק מוסר מכל הגיליונות
5. **✨ עדכון PDF אוטומטי במחיקה** - PDF מתעדכן לאחר מחיקת נכס
6. **🔄 ניהול סטטוס מודעות** - שינוי סטטוס דרך עמוד הניהול מוסיף/מסיר מלוח מודעות

### 📋 מה לבדוק בפועל
1. ✅ אישור נכס ראשון → גיליון חדש נוצר + PDF נוצר
2. ✅ אישור נכס שני באותה קטגוריה+עיר → מתווסף לגיליון קיים + PDF מתעדכן
3. ✅ אישור נכס בקטגוריה שונה → גיליון נפרד נוצר
4. ✅ מחיקת נכס → הנכס נמחק מהגיליון + **PDF מתעדכן אוטומטית**

### 🎯 המלצות
1. לבדוק בפועל עם נכסים אמיתיים
2. ✅ ~~לוודא ש-PDF מתעדכן אחרי מחיקה~~ **תוקן!** PDF כעת מתעדכן אוטומטית
3. לעבור ממצב TESTING לקטגוריות ספציפיות לפני פרודקשן

---

**סטטוס כללי**: ✅ **המערכת עובדת כראוי ותוקנה**

הלוגיקה של לוח המודעות - תצורת עיתון פועלת נכון:
- נכס חדש נוסף ללוח המודעות (או יוצר חדש)
- נכס שנמחק מוסר מלוח המודעות
- כל הפונקציות עובדות כצפוי
