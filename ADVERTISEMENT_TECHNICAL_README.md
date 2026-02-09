# מערכת פרסומות - README טכני למפתחים

## 📐 ארכיטקטורה

### עקרון התכנון: Single Source of Truth
המערכת בנויה על עקרון של **אלגוריתם layout מרכזי אחד** שמחשב את הפריסה המדויקת של נכסים ופרסומות.

```
Input: listings[] + ads[]
  ↓
calculateNewspaperLayout()
  ↓
Output: pages[] (מטריצה של items)
```

### יתרונות הגישה
✅ אין כפילות לוגיקה  
✅ כל שינוי בסדר/הוספה/הסרה → ריצה מחדש של האלגוריתם  
✅ התוצאה תמיד עקבית (UI = PDF = General Sheet)

---

## 🗄️ Database Schema

### טבלה: `NewspaperSheetAd`
```prisma
model NewspaperSheetAd {
  id              String   @id @default(cuid())
  sheetId         String
  imageUrl        String
  size            String   // "1x1" | "2x1" | "3x1" | "2x2"
  anchorType      String   // "beforeIndex" | "pagePosition"
  beforeListingId String?
  page            Int?
  row             Int?
  col             Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  
  sheet           NewspaperSheet @relation(...)
  creator         User @relation(...)
  
  @@index([sheetId])
  @@index([createdBy])
}
```

### קשרים
- `NewspaperSheet` ← `has many` → `NewspaperSheetAd`
- `User` ← `created` → `NewspaperSheetAd`

---

## 🧮 אלגוריתם Layout

### קובץ: `server/src/modules/newspaper-sheets/newspaper-layout.service.ts`

#### פונקציה ראשית
```typescript
export function calculateNewspaperLayout(
  listings: Listing[],
  ads: AdSlot[]
): LayoutResult
```

#### תהליך
1. **סינון פרסומות** לפי `beforeIndex` ו-`pagePosition`
2. **מיקום pagePosition ads** קודם (מיקומים קבועים)
3. **מיקום beforeIndex ads** לפי סדר anchors
4. **מילוי נכסים** בתאים הפנויים
5. **יצירת pages** - כל עמוד = 7 שורות × 3 עמודות

#### פלט
```typescript
interface LayoutResult {
  pages: PageLayout[];  // רשימת עמודים
  errors: string[];     // שגיאות במקרה של כשל
}

interface PageLayout {
  pageNumber: number;
  rows: GridItem[][];   // 7 rows × 3 cols
}

interface GridItem {
  type: 'listing' | 'ad' | 'empty';
  id: string;
  data?: any;
  colspan?: number;  // 1-3
  rowspan?: number;  // 1-2
}
```

### דוגמה לשימוש
```typescript
import { calculateNewspaperLayout } from './newspaper-layout.service';

const listings = await getListings();
const ads = await getAds();

const { pages, errors } = calculateNewspaperLayout(listings, ads);

if (errors.length > 0) {
  console.error('Layout errors:', errors);
}

// Render pages...
for (const page of pages) {
  renderPage(page);
}
```

---

## 🌐 API Endpoints

### Base: `/api/admin/newspaper-sheets/:sheetId/ads`

#### POST - הוספת פרסומת
```http
POST /api/admin/newspaper-sheets/:sheetId/ads
Content-Type: application/json

{
  "imageUrl": "/uploads/ads/banner.jpg",
  "size": "2x1",
  "anchorType": "beforeIndex",
  "beforeListingId": "listing-123"
}
```

**Response**:
```json
{
  "id": "ad-456",
  "sheetId": "sheet-789",
  "imageUrl": "/uploads/ads/banner.jpg",
  "size": "2x1",
  ...
}
```

#### PUT/PATCH - עדכון פרסומת
```http
PATCH /api/admin/newspaper-sheets/:sheetId/ads/:adId
Content-Type: application/json

{
  "size": "3x1",
  "page": 2
}
```

#### DELETE - מחיקת פרסומת
```http
DELETE /api/admin/newspaper-sheets/:sheetId/ads/:adId
```

#### GET - חישוב layout (preview)
```http
GET /api/admin/newspaper-sheets/:sheetId/calculate-layout
```

**Response**:
```json
{
  "pages": [
    {
      "pageNumber": 1,
      "rows": [ [...], [...], ... ]
    }
  ],
  "errors": [],
  "sheetInfo": {
    "title": "לוח מודעות",
    "category": "דירות למכירה",
    "city": "בית שמש",
    "listingsCount": 15,
    "adsCount": 3
  }
}
```

---

## ⚛️ React Components

### 1. AdvertisementManager
**מיקום**: `client/src/components/admin/AdvertisementManager.tsx`

**תפקיד**: מודאל לניהול פרסומות (הוספה/עריכה/מחיקה)

**Props**:
```typescript
interface Props {
  sheetId: string;
  advertisements: Advertisement[];
  listings: Listing[];
  onUpdate: () => void;  // Callback לרענון
}
```

**שימוש**:
```tsx
<AdvertisementManager
  sheetId={sheetId}
  advertisements={sheet.ads || []}
  listings={listings}
  onUpdate={() => queryClient.invalidateQueries(['newspaper-sheet'])}
/>
```

### 2. AdSlotCard
**מיקום**: בתוך `NewspaperSheetEditorPage.tsx`

**תפקיד**: תצוגה של פרסומת בגריד (קובייה צהובה עם תמונה)

**Props**:
```typescript
interface Props {
  ad: Advertisement;
  onRemove: () => void;
}
```

---

## 🎨 Styling

### עיצוב פרסומות בעורך
```css
.ad-slot-card {
  background: #fff3cd;
  border: 3px dashed #ffc107;
  position: relative;
}

.ad-badge {
  background: #f59e0b;
  color: white;
  font-weight: bold;
}
```

### עיצוב כפתור ניהול
```css
.ad-manager-button {
  position: fixed;
  bottom: 24px;
  left: 24px;
  background: #f59e0b;
  border-radius: 9999px;
  box-shadow: 0 10px 15px rgba(0,0,0,0.1);
}
```

---

## 🔧 Service Layer

### NewspaperSheetService
**מיקום**: `server/src/modules/newspaper-sheets/newspaper-sheet.service.ts`

#### מתודות חדשות

```typescript
class NewspaperSheetService {
  // הוספת פרסומת
  async addAdvertisement(
    sheetId: string,
    data: AddAdData,
    userId: string
  ): Promise<Ad>

  // עדכון פרסומת
  async updateAdvertisement(
    adId: string,
    data: Partial<AddAdData>,
    userId: string
  ): Promise<Ad>

  // הסרת פרסומת
  async removeAdvertisement(
    sheetId: string,
    adId: string,
    userId: string
  ): Promise<boolean>

  // חישוב layout
  async calculateSheetLayout(
    sheetId: string
  ): Promise<LayoutResult>
}
```

---

## 📝 Types & Interfaces

### קובץ: `types.ts`
```typescript
interface AdSlot {
  id: string;
  imageUrl: string;
  size: '1x1' | '2x1' | '3x1' | '2x2';
  anchorType: 'beforeIndex' | 'pagePosition';
  beforeListingId?: string;
  page?: number;
  row?: number;
  col?: number;
}

interface GridItem {
  type: 'listing' | 'ad' | 'empty';
  id: string;
  data?: any;
  colspan?: number;
  rowspan?: number;
}

interface PageLayout {
  pageNumber: number;
  rows: GridItem[][];
}

interface LayoutResult {
  pages: PageLayout[];
  errors: string[];
}
```

---

## 🧪 Testing

### תרחישי בדיקה

#### 1. הוספת פרסומת beforeIndex
```typescript
test('should place ad before specific listing', async () => {
  const layout = calculateNewspaperLayout(
    [listing1, listing2, listing3],
    [{ anchorType: 'beforeIndex', beforeListingId: listing2.id, size: '1x1' }]
  );
  
  // הפרסומת צריכה להופיע לפני listing2
  expect(layout.errors).toHaveLength(0);
});
```

#### 2. בדיקת חציית עמוד
```typescript
test('should not cross page boundary', async () => {
  // 20 נכסים (כמעט עמוד מלא)
  const listings = Array(20).fill(null).map((_, i) => ({ id: `l${i}` }));
  
  // פרסומת 2x2 לא צריכה לחצות לעמוד 2
  const layout = calculateNewspaperLayout(listings, [
    { size: '2x2', anchorType: 'pagePosition', page: 1, row: 6, col: 1 }
  ]);
  
  expect(layout.errors).toContain('אין מקום');
});
```

---

## 🚀 Deployment

### Environment Variables
```env
# לא דורש הגדרות נוספות
# כל התמונות נשמרות ב-/uploads/images/ (כמו תמונות נכסים)
```

### Build
```bash
# Server
cd server
npm run build

# Client
cd client
npm run build
```

---

## 🔮 תוספות עתידיות (אופציונלי)

### 1. PDF עם פרסומות
**קובץ לעדכן**: `newspaper-sheet-pdf.service.ts`

```typescript
async generateHTML(sheet: SheetWithListings) {
  // במקום לרנדר ישירות מהנכסים:
  const layout = calculateNewspaperLayout(sheet.listings, sheet.ads);
  
  for (const page of layout.pages) {
    html += '<div class="page">';
    for (const row of page.rows) {
      html += '<div class="row">';
      for (const item of row) {
        if (item.type === 'ad') {
          html += `<img src="${item.data.imageUrl}" />`;
        } else if (item.type === 'listing') {
          html += renderListingCard(item.data);
        }
      }
      html += '</div>';
    }
    html += '</div>';
  }
}
```

### 2. Drag & Drop לפרסומות
- להוסיף פרסומות ל-`SortableContext`
- לשמור position במקום anchor
- דורש שינוי מודל הנתונים

### 3. Preview של Layout
- קומפוננטה שמציגה את ה-pages המחושבות
- עם מספרי עמודים
- שימושי לדיבוג

---

## 📞 תמיכה
לשאלות טכניות:
- קרא את הקוד ב-`newspaper-layout.service.ts`
- בדוק את ה-API documentation
- התייעץ עם צוות הפיתוח

---

**עודכן**: 9 בפברואר 2026  
**גרסה**: 1.0.0
