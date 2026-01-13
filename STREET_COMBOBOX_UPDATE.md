# עדכון: Combo Box לבחירת רחובות

## סיכום השינוי
עודכן שדה בחירת הרחוב ב-AdForm מהיות autocomplete בלבד (דורש הקלדה) למערכת combo box מלאה שתומכת בשני מצבים:
1. **דפדוף ברשימה** - לחיצה על כפתור החץ מציגה את כל 419 הרחובות
2. **חיפוש** - הקלדת 2+ תווים מסננת את הרשימה

## שינויים טכניים

### 1. State Management
```typescript
const [streetSearch, setStreetSearch] = useState('');
const [showStreetDropdown, setShowStreetDropdown] = useState(false);
const streetDropdownRef = useRef<HTMLDivElement>(null);
```

### 2. Data Fetching
הוספנו שתי שאילתות נפרדות:
- **allStreets**: טוען את כל הרחובות (עד 500) כשיש cityId
- **searchedStreets**: מסנן רחובות לפי query כשמקלידים 2+ תווים

```typescript
const { data: allStreets } = useQuery({
  queryKey: ['all-streets', formData.cityId],
  queryFn: () => streetsService.getStreets({
    cityId: formData.cityId,
    limit: 500,
  }),
  enabled: !!formData.cityId,
});

const { data: searchedStreets, isLoading: streetsLoading } = useQuery({
  queryKey: ['streets-search', streetSearch, formData.cityId],
  queryFn: () => streetsService.getStreets({
    query: streetSearch,
    cityId: formData.cityId,
    limit: 50,
  }),
  enabled: !!formData.cityId && streetSearch.length >= 2,
});
```

### 3. UI Components

#### Input עם כפתור דרופדאון
```tsx
<input
  type="text"
  value={streetSearch}
  onChange={(e) => {
    setStreetSearch(e.target.value);
    setShowStreetDropdown(e.target.value.length >= 2);
  }}
  onFocus={() => setShowStreetDropdown(streetSearch.length >= 2)}
  placeholder="התחל להקליד שם רחוב או בחר מהרשימה..."
/>

<button
  type="button"
  onClick={() => setShowStreetDropdown(!showStreetDropdown)}
  title="הצג את כל הרחובות"
>
  {/* Down arrow icon */}
</button>
```

#### Dropdown מותנה
הרשימה הנפתחת מציגה:
- **כשיש חיפוש (2+ תווים)**: מציגה את `searchedStreets` המסוננות
- **כשאין חיפוש**: מציגה את כל ה-`allStreets`

```tsx
{showStreetDropdown && (
  <div className="...dropdown">
    {streetSearch.length >= 2 ? (
      // Search results
      searchedStreets.map(...)
    ) : (
      // All streets
      allStreets.map(...)
    )}
  </div>
)}
```

### 4. Click Outside Handler
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (streetDropdownRef.current && !streetDropdownRef.current.contains(event.target as Node)) {
      setShowStreetDropdown(false);
    }
  };

  if (showStreetDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showStreetDropdown]);
```

## UX Improvements

### לפני
- ✗ משתמש חייב להקליד כדי לראות רחובות
- ✗ אין אפשרות לדפדף ברשימה מלאה
- ✗ קשה למשתמשים שלא יודעים שמות רחובות

### אחרי
- ✓ לחיצה על חץ מציגה את כל הרחובות
- ✓ הקלדה מסננת את הרשימה באופן דינמי
- ✓ משתמשים יכולים לגלוש ולגלות רחובות
- ✓ תמיכה בשתי דרכי עבודה - דפדוף וחיפוש

## איך להשתמש

### דרך 1: חיפוש
1. התחל להקליד שם רחוב (לפחות 2 תווים)
2. הרשימה תסתנן אוטומטית
3. לחץ על הרחוב הרצוי

### דרך 2: דפדוף
1. לחץ על כפתור החץ (↓) בצד שמאל של השדה
2. גלול ברשימת כל הרחובות
3. לחץ על הרחוב הרצוי

## קבצים שהשתנו
- `client/src/components/AdForm.tsx`
  - הוספת `useRef` לייבוא
  - הוספת `showStreetDropdown` state
  - הוספת `streetDropdownRef` ref
  - הוספת query ל-`allStreets`
  - שינוי שם query ל-`searchedStreets`
  - הוספת `useEffect` ל-click-outside
  - עדכון UI לתמוך ב-combo box
  - הוספת כפתור toggle לדרופדאון
  - לוגיקה מותנית להצגת search results או all streets

## Performance Considerations
- **Caching**: TanStack Query שומרת את שתי הרשימות בזיכרון
- **Lazy Loading**: רק allStreets נטענים מראש (limit 500)
- **Search Debouncing**: חיפוש מופעל רק מ-2 תווים ומעלה
- **Event Cleanup**: removeEventListener מבוצע ב-cleanup function

## תאימות לעתיד
המערכת מוכנה להרחבה:
- ניתן להוסיף עוד ערים בעתיד
- ניתן להוסיף מיון לרחובות (לפי שכונה/שם)
- ניתן להוסיף סימון מועדפים
- ניתן להוסיף היסטוריית רחובות אחרונים
