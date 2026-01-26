# מערכת ניהול היסטוריית ייבוא - תיעוד מלא

## סקירה כללית

הוספנו מערכת מקיפה לניהול היסטוריית ייבוא שמאפשרת:
- צפייה בכל הייבואים שבוצעו במערכת
- מחיקת ייבואים קיימים עם לוגיקה חכמה
- בדיקה אוטומטית של נכסים מאושרים
- שאלות למשתמש לפני מחיקה של פריטים מאושרים

## תכונות עיקריות

### 1. **היסטוריית ייבוא מלאה**
- רשימה של כל הייבואים שבוצעו
- סינון לפי סוג ייבוא (נכסים, ערים ורחובות)
- פרטים מלאים: תאריך, סוג, מספר שורות, הצלחות וכשלונות

### 2. **מחיקת ייבוא נכסים**
- בדיקה אוטומטית אם יש נכסים מאושרים
- שאלה למשתמש: "האם למחוק גם נכסים מאושרים?"
- אפשרות 1: מחיקת הכל (כולל מאושרים)
- אפשרות 2: מחיקת רק לא מאושרים

### 3. **מחיקת ייבוא ערים ורחובות**
- בדיקה אוטומטית אם יש נכסים מאושרים המשתמשים בערים/רחובות
- שאלה למשתמש: "האם למחוק כולל נכסים מאושרים?"
- אפשרות 1: מחיקה של ערים/רחובות כולל נכסים מאושרים
- אפשרות 2: מחיקה רק של ערים/רחובות ללא נכסים מאושרים

## שינויים בקוד

### Backend (Server)

#### 1. **Schema.prisma - עדכון מודל ImportLog**
```prisma
model ImportLog {
  id              String   @id @default(cuid())
  adminId         String
  importType      String
  fileName        String
  totalRows       Int      @default(0)
  successRows     Int      @default(0)
  failedRows      Int      @default(0)
  errors          Json?
  importedItemIds Json?    // NEW: Array of IDs that were imported
  metadata        Json?    // NEW: Additional metadata (cities, streets, etc.)
  createdAt       DateTime @default(now())
}
```

**שדות חדשים:**
- `importedItemIds`: מערך של IDs של הפריטים שיובאו (ads)
- `metadata`: מטה-דאטה נוספת (cityIds, streetIds וכו')

#### 2. **import-history.service.ts - שירות חדש**
קובץ: `server/src/modules/admin/import-history.service.ts`

**פונקציות:**
- `getImportHistory()` - קבלת היסטוריית ייבוא
- `getImportDetails()` - פרטים על ייבוא ספציפי
- `checkApprovedPropertiesInImport()` - בדיקת נכסים מאושרים
- `checkApprovedAdsUsingCitiesStreets()` - בדיקת נכסים מאושרים לערים/רחובות
- `deleteImportedProperties()` - מחיקת ייבוא נכסים
- `deleteImportedCitiesStreets()` - מחיקת ייבוא ערים/רחובות

#### 3. **import-history.routes.ts - Routes חדשים**
קובץ: `server/src/modules/admin/import-history.routes.ts`

**Endpoints:**
```
GET    /api/admin/import-history
GET    /api/admin/import-history/:id
GET    /api/admin/import-history/:id/check-approved-properties
GET    /api/admin/import-history/:id/check-approved-ads-cities-streets
DELETE /api/admin/import-history/:id/properties
DELETE /api/admin/import-history/:id/cities-streets
```

#### 4. **import.routes.ts - עדכונים**
עכשיו מתעד את כל הפריטים שנוצרו:

**ייבוא נכסים:**
```typescript
const createdAdIds: string[] = [];
// ... create ads ...
createdAdIds.push(newAd.id);

// Save to log
await tx.importLog.create({
  data: {
    // ...
    importedItemIds: createdAdIds,
  },
});
```

**ייבוא ערים ורחובות:**
```typescript
const createdCityIds: string[] = [];
const createdStreetIds: string[] = [];
// ... create cities/streets ...
createdCityIds.push(city.id);
createdStreetIds.push(street.id);

// Save to log
await prisma.importLog.create({
  data: {
    // ...
    metadata: {
      cityIds: createdCityIds,
      streetIds: createdStreetIds,
    },
  },
});
```

#### 5. **routes/index.ts - עדכון**
```typescript
import importHistoryRoutes from '../modules/admin/import-history.routes';
// ...
router.use('/admin/import-history', importHistoryRoutes);
```

### Frontend (Client)

#### 1. **api.ts - שירותים חדשים**
קובץ: `client/src/services/api.ts`

```typescript
export const importHistoryService = {
  getImportHistory: async (params) => { ... },
  getImportDetails: async (id) => { ... },
  checkApprovedProperties: async (id) => { ... },
  checkApprovedAdsCitiesStreets: async (id) => { ... },
  deleteImportedProperties: async (id, includeApproved) => { ... },
  deleteImportedCitiesStreets: async (id, deleteWithApprovedAds) => { ... },
};
```

#### 2. **ImportHistory.tsx - קומפוננטה חדשה**
קובץ: `client/src/pages/admin/ImportHistory.tsx`

**תכונות:**
- טבלה עם כל הייבואים
- סינון לפי סוג ייבוא
- Pagination
- כפתורים: צפייה בפרטים, מחיקה
- Modal אישור מחיקה עם אזהרות
- בדיקה אוטומטית של נכסים מאושרים

**דוגמה ל-Modal מחיקה:**
```tsx
{approvedCheck && approvedCheck.hasApproved && (
  <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 mb-4">
    <p>קיימים {approvedCheck.approvedCount} נכסים מאושרים!</p>
    <label>
      <input
        type="checkbox"
        checked={deleteOptions.includeApproved}
        onChange={...}
      />
      <span>למחוק גם נכסים מאושרים</span>
    </label>
  </div>
)}
```

#### 3. **App.tsx - עדכון Routes**
```tsx
import ImportHistory from './pages/admin/ImportHistory';
// ...
<Route path="/admin/import-history" element={
  <AdminRoute>
    <AdminLayout>
      <ImportHistory />
    </AdminLayout>
  </AdminRoute>
} />
```

#### 4. **AdminLayout.tsx - עדכון תפריט**
```tsx
{
  id: 'import-history',
  title: 'היסטוריית ייבוא',
  path: '/admin/import-history',
  requiredRoles: ['ADMIN', 'SUPER_ADMIN']
}
```

## זרימת עבודה (Workflow)

### זרימה 1: מחיקת ייבוא נכסים עם נכסים מאושרים

```
1. מנהל לוחץ על "מחק" ליד ייבוא נכסים
   ↓
2. המערכת בודקת: checkApprovedProperties(importId)
   ↓
3. מתקבלת תשובה: { hasApproved: true, approvedCount: 15, pendingCount: 5 }
   ↓
4. מוצג Modal עם אזהרה: "קיימים 15 נכסים מאושרים!"
   ↓
5. משתמש בוחר אחת מהאפשרויות:
   
   אפשרות א: סימן ✓ "למחוק גם נכסים מאושרים"
   → deleteImportedProperties(importId, includeApproved: true)
   → מוחקים את כל 20 הנכסים (15 מאושרים + 5 לא מאושרים)
   
   אפשרות ב: לא סימן ✗ "למחוק גם נכסים מאושרים"
   → deleteImportedProperties(importId, includeApproved: false)
   → מוחקים רק 5 נכסים לא מאושרים
```

### זרימה 2: מחיקת ייבוא ערים ורחובות עם נכסים מאושרים

```
1. מנהל לוחץ על "מחק" ליד ייבוא ערים/רחובות
   ↓
2. המערכת בודקת: checkApprovedAdsCitiesStreets(importId)
   ↓
3. מתקבלת תשובה: { hasApproved: true, approvedCount: 25 }
   ↓
4. מוצג Modal עם אזהרה: "קיימים 25 נכסים מאושרים שמשתמשים בערים/רחובות אלו!"
   ↓
5. משתמש בוחר:
   
   אפשרות א: סימן ✓ "למחוק כולל נכסים מאושרים"
   → deleteImportedCitiesStreets(importId, deleteWithApprovedAds: true)
   → מוחקים את כל הנכסים (25), ואז את הרחובות/ערים
   
   אפשרות ב: לא סימן ✗
   → deleteImportedCitiesStreets(importId, deleteWithApprovedAds: false)
   → רק ערים/רחובות ללא נכסים מאושרים נמחקים
   → ערים/רחובות עם נכסים מאושרים נשארים!
```

## דוגמאות API

### 1. קבלת היסטוריית ייבוא
```bash
GET /api/admin/import-history?page=1&limit=20&importType=PROPERTIES

Response:
{
  "status": "success",
  "data": {
    "imports": [
      {
        "id": "clxx123",
        "importType": "PROPERTIES",
        "fileName": "import-2026-01-26",
        "totalRows": 50,
        "successRows": 45,
        "failedRows": 5,
        "createdAt": "2026-01-26T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "totalPages": 3,
      "total": 50
    }
  }
}
```

### 2. בדיקת נכסים מאושרים
```bash
GET /api/admin/import-history/clxx123/check-approved-properties

Response:
{
  "status": "success",
  "data": {
    "hasApproved": true,
    "approvedCount": 15,
    "pendingCount": 5,
    "totalCount": 20
  }
}
```

### 3. מחיקת ייבוא
```bash
DELETE /api/admin/import-history/clxx123/properties
Body: { "includeApproved": true }

Response:
{
  "status": "success",
  "message": "Import deleted successfully",
  "data": {
    "deletedCount": 20,
    "importDeleted": true
  }
}
```

## הוראות התקנה

### 1. הרצת Migration
```bash
cd server
npx prisma migrate dev --name add_import_tracking
```

### 2. הרצת שרת
```bash
npm run dev
```

### 3. בדיקת ה-UI
1. היכנס כמנהל
2. עבור ל: `/admin/import-history`
3. צפה ברשימת הייבואים
4. נסה למחוק ייבוא ובדוק את האזהרות

## בעיות נפוצות (Troubleshooting)

### בעיה: "Cannot find module 'import-history.service'"
**פתרון:** ודא ש-transpiler ריענן את הקבצים. הפעל מחדש את השרת.

### בעיה: הטבלה ריקה
**פתרון:** צריך לבצע לפחות ייבוא אחד כדי שיהיו נתונים.

### בעיה: השדות החדשים null
**פתרון:** זה תקין לייבואים ישנים שלא עקבו אחרי IDs. רק ייבואים חדשים יכילו את הנתונים.

## סיכום

המערכת מספקת:
✅ היסטוריה מלאה של כל הייבואים
✅ מעקב אחרי כל הפריטים שיובאו
✅ בדיקה אוטומטית של נכסים מאושרים
✅ שאלות חכמות למנהל לפני מחיקה
✅ מחיקה גמישה - עם או בלי נכסים מאושרים
✅ UX מצוין עם אזהרות ברורות
✅ תמיכה בכל סוגי הייבוא

כל השינויים נבדקו ואין שגיאות! 🎉
