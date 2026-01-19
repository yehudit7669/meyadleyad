# 📰 WYSIWYG Editor Implementation - Newspaper Sheet Editor

## סיכום השינויים

### ✅ מה השתנה?
המערכת עברה משינוי **מהפכני** במסך עריכת גיליון העיתון:
- **לפני**: רשימה של מודעות עם drag & drop ב-sidebar
- **אחרי**: WYSIWYG editor עם תצוגה מקדימה חיה של העיתון בפורמט A4

---

## 🎯 תכונות חדשות

### 1️⃣ **A4 Preview Canvas (צד שמאל)**
- תצוגה חיה של העיתון בדיוק כמו ה-PDF הסופי
- פורמט A4 אמיתי עם יחס גובה-רוחב נכון
- עיצוב זהה ל-PDF שמיוצר בשרת

### 2️⃣ **Inline Title Editing (עריכת כותרת במקום)**
- לחיצה על הכותרת פותחת מצב עריכה
- שמירה אוטומטית ב-Enter או blur
- ביטול ב-Escape
- אינדיקציה ויזואלית (רקע כחול, מסגרת מקווקו)

### 3️⃣ **Click-to-Upload Header Image (תמונת כותרת)**
- לחיצה על אזור התמונה פותחת file picker
- Hover effect עם אייקון העלאה
- Placeholder אטרקטיבי אם אין תמונה
- שמירה אוטומטית מיד לאחר העלאה

### 4️⃣ **Drag & Drop Within Preview Grid (גרירה בתוך התצוגה)**
- גרירת כרטיסי נכסים ישירות בתוך הגריד
- DragOverlay מעוצב (סיבוב קל, צל)
- עדכון real-time של המיקום
- שמירה אוטומטית למסד הנתונים

### 5️⃣ **Zoom Controls (70%, 100%, 120%)**
- בקרות zoom בכותרת העליונה
- טווח: 50%-150%
- שלבים של 10%
- עיצוב נקי עם אייקונים

### 6️⃣ **Right Sidebar - Actions Only (פעולות בלבד)**
- העלאה/החלפת תמונת כותרת
- שמירה (JSON בלבד)
- שמור + יצר PDF
- צפה ב-PDF
- איפוס לברירת מחדל
- מידע: גרסה, סטטוס, מספר מודעות

---

## 📁 קבצים שנוצרו/שונו

### קבצים חדשים:
1. **`client/src/pages/admin/NewspaperSheetEditor.css`**
   - CSS ייעודי לעיתון
   - סגנונות תואמים ל-PDF
   - Responsive design
   - Print styles

### קבצים ששונו:
1. **`client/src/pages/admin/NewspaperSheetEditorPage.tsx`**
   - שכתוב מלא של הקומפוננטה
   - מעבר מ-list view ל-WYSIWYG
   - inline editing capabilities
   - Grid-based drag & drop
   - Zoom functionality

---

## 🔧 שינויים טכניים

### Imports שהתעדכנו:
```tsx
// הוסרו:
- useRef (לא בשימוש)
- FileText, ImageIcon, GripVertical, Trash2, ArrowRight
- KeyboardSensor, sortableKeyboardCoordinates
- verticalListSortingStrategy

// נוספו:
- ZoomIn, ZoomOut, ArrowLeft, Upload
- DragOverlay
- rectSortingStrategy (במקום vertical)
- './NewspaperSheetEditor.css'
```

### State חדש:
```tsx
const [isEditingTitle, setIsEditingTitle] = useState(false);
const [zoom, setZoom] = useState(100);
const [activeId, setActiveId] = useState<string | null>(null);
```

### Mutations:
- **הוסר duplicate** של `updatePositionMutation`
- תוקן parameter: `positionIndex` במקום `newPosition`
- הוסף TypeScript types ל-API responses

### DndContext:
- שונה מ-`verticalListSortingStrategy` ל-`rectSortingStrategy`
- הוסף `onDragStart` ו-`activeId` tracking
- הוסף `DragOverlay` עם styling מיוחד
- שונה `PointerSensor` עם `activationConstraint: { distance: 8 }`

---

## 🎨 עיצוב וחווית משתמש

### Layout Structure:
```
┌─────────────────────────────────────────────────┐
│ Top Bar (חזרה | כותרת | Zoom Controls)         │
├──────────────────────┬──────────────────────────┤
│                      │                          │
│  A4 Preview Canvas   │   Action Sidebar         │
│  (flex-1)            │   (w-80)                 │
│                      │                          │
│  - Title (editable)  │   - Upload Image         │
│  - Header Image      │   - Save                 │
│  - 3-col Grid        │   - Save + Generate PDF  │
│  - Property Cards    │   - View PDF             │
│  - Footer            │   - Reset                │
│                      │   - Info Box             │
│                      │                          │
└──────────────────────┴──────────────────────────┘
```

### CSS Classes:
- `.newspaper-page` - A4 container
- `.newspaper-header` - כותרת + מסגרת תחתונה
- `.newspaper-title` - כותרת עם hover effect
- `.newspaper-banner` - תמונת כותרת
- `.newspaper-grid` - grid 3 עמודות
- `.newspaper-property-card` - כרטיס נכס
- `.dragging-overlay` - DragOverlay styling
- `.newspaper-footer` - footer עם תאריך

---

## 🚀 איך להשתמש?

### עריכת כותרת:
1. לחץ על הכותרת בתצוגה המקדימה
2. ערוך את הטקסט
3. לחץ Enter או click מחוץ לשדה לשמירה
4. Escape לביטול

### העלאת תמונת כותרת:
1. לחץ על אזור התמונה בתצוגה המקדימה
   **או**
2. לחץ "העלה / החלף תמונה" ב-sidebar
3. בחר קובץ
4. התמונה נשמרת אוטומטית

### שינוי סדר מודעות:
1. גרור כרטיס נכס בתוך הגריד
2. שחרר במיקום הרצוי
3. המיקום נשמר אוטומטית לשרת

### Zoom:
1. השתמש ב-+ / - בכותרת העליונה
2. או לחץ על המספר לאיפוס ל-100%

### שמירה ויצירת PDF:
1. **שמירה בלבד**: שומר title + headerImage (JSON)
2. **שמור + יצר PDF**: שומר + מייצר PDF חדש
3. **צפה ב-PDF**: פותח PDF קיים בטאב חדש

---

## ✨ הבדלים ממערכת הישנה

| תכונה | לפני | אחרי |
|-------|------|------|
| **תצוגה** | רשימה של מודעות | WYSIWYG A4 preview |
| **עריכת כותרת** | Input field נפרד | Inline editing |
| **תמונת כותרת** | File input + preview | Click-to-upload on preview |
| **Drag & Drop** | List vertical | Grid-based in preview |
| **עיצוב** | Generic list items | Newspaper-styled cards |
| **Zoom** | ❌ לא היה | ✅ 50%-150% |
| **Real-time** | ❌ צריך refresh | ✅ מיידי |

---

## 🐛 תיקוני באגים

### TypeScript Errors:
- ✅ תוקן `useRef` unused import
- ✅ תוקן `response.data` type (הוסף generics)
- ✅ הוסר duplicate `updatePositionMutation`
- ✅ תוקן parameter name: `positionIndex` vs `newPosition`

### Logic Fixes:
- ✅ הוסף `onDragStart` לעקוב אחרי `activeId`
- ✅ תוקן `DragOverlay` עם conditional rendering
- ✅ הוסף `activationConstraint` למנוע accidental drags
- ✅ תוקן auto-save של header image

---

## 📋 TODO (אופציונלי להמשך)

- [ ] הוסף "ביטול שינויים" (undo/redo)
- [ ] הוסף keyboard shortcuts (Ctrl+S לשמירה)
- [ ] הוסף loading state בזמן העלאת תמונה
- [ ] הוסף crop tool לתמונת כותרת
- [ ] הוסף preview של תמונה לפני העלאה
- [ ] הוסף drag handles ברורים יותר (אייקון)
- [ ] הוסף tooltips להסבר פעולות
- [ ] הוסף confirmation dialog לפני reset

---

## 🎉 סיכום

המערכת עברה שדרוג משמעותי:
- ✅ **WYSIWYG** - "What You See Is What You Get"
- ✅ **Inline Editing** - עריכה ישירה על התצוגה
- ✅ **Real-time Preview** - תצוגה חיה זהה ל-PDF
- ✅ **Better UX** - פחות clicks, יותר אינטואיטיבי
- ✅ **Professional** - נראה ומרגיש כמו כלי מקצועי

**המשתמש עכשיו רואה בדיוק מה שהוא מקבל ב-PDF!** 🎯
