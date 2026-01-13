# מסלול "דרושים" - מחפש נכס

## סקירה כללית

הפכנו את מסלול "דרושים" ב"פרסום חדש" למסלול של **מחפש נכס**, עם 4 סוגי מודעות:

1. **דירה לקניה** - מחפש לקנות דירה
2. **דירה להשכרה** - מחפש לשכור דירה  
3. **דירה לשבת** - מחפש דירה לשבת/חג
4. **נדל"ן מסחרי** - מחפש נכס מסחרי (TODO - בהכנה)

## מבנה הקבצים החדשים

```
client/src/
├── components/wizard/wanted/
│   ├── WantedTypeSelection.tsx           # מסך בחירה ראשי (4 כפתורים)
│   │
│   ├── WantedForSaleWizard.tsx           # Wizard מחפש לקנות
│   ├── WantedForSaleStep1.tsx            # שלב 1: תיווך
│   ├── WantedForSaleStep2.tsx            # שלב 2: רחוב מבוקש (טקסט חופשי)
│   ├── WantedForSaleStep3.tsx            # שלב 3: פרטי נכס
│   ├── WantedForSaleStep4.tsx            # שלב 4: פרטי התקשרות
│   │
│   ├── WantedForRentWizard.tsx           # Wizard מחפש לשכור
│   ├── WantedForRentStep1.tsx            # שלב 1: תיווך
│   ├── WantedForRentStep2.tsx            # שלב 2: רחוב מבוקש (טקסט חופשי)
│   ├── WantedForRentStep3.tsx            # שלב 3: פרטי נכס (ללא hasOption)
│   ├── WantedForRentStep4.tsx            # שלב 4: פרטי התקשרות
│   │
│   ├── WantedHolidayWizard.tsx           # Wizard מחפש דירה לשבת
│   ├── WantedHolidayStep1.tsx            # שלב 1: אזור מבוקש (טקסט חופשי)
│   ├── WantedHolidayStep2.tsx            # שלב 2: בתשלום/ללא תשלום
│   ├── WantedHolidayStep3.tsx            # שלב 3: פרטי נכס לשבת
│   └── WantedHolidayStep4.tsx            # שלב 4: פרטי התקשרות
│
├── types/wizard.ts                        # עדכון טיפוסים
└── constants/adTypes.ts                   # עדכון קבועים
```

## שינויים עיקריים

### 1. טיפוסים חדשים (types/wizard.ts)

הוספנו 4 טיפוסי AdType חדשים:
```typescript
export enum AdType {
  // ...קיימים
  WANTED_FOR_SALE = 'WANTED_FOR_SALE',
  WANTED_FOR_RENT = 'WANTED_FOR_RENT',
  WANTED_HOLIDAY = 'WANTED_HOLIDAY',
  WANTED_COMMERCIAL = 'WANTED_COMMERCIAL',
}
```

### 2. קבועים (constants/adTypes.ts)

הוספנו `WANTED_TYPE_OPTIONS` עם 4 אפשרויות:
- דירה לקניה (🏠)
- דירה להשכרה (🔑)
- דירה לשבת (🕯️)
- נדל"ן מסחרי (🏢)

### 3. Routing (App.tsx)

הוספנו 3 Routes חדשים:
```typescript
<Route path="/publish/wanted/for-sale" element={<WantedForSaleWizard />} />
<Route path="/publish/wanted/for-rent" element={<WantedForRentWizard />} />
<Route path="/publish/wanted/holiday" element={<WantedHolidayWizard />} />
```

### 4. JobWizard עודכן

עכשיו JobWizard פשוט מציג את WantedTypeSelection:
```typescript
const JobWizard = () => {
  return <WantedTypeSelection />;
};
```

## זרימת המשתמש

### דירה לקניה (מחפש לקנות)

1. **שלב 1 - תיווך**: בחירה בין "עם תיווך" ל"ללא תיווך"
2. **שלב 2 - רחוב מבוקש**: שדה טקסט חופשי (לא רשימה סגורה!)
3. **שלב 3 - פרטי נכס**:
   - סוג נכס (בית פרטי, דירת גן, דופלקס, דירה, יחידת דיור)
   - מספר חדרים (1-8)
   - שטח במ"ר
   - קומה
   - מרפסות (0-3)
   - מצב הנכס (חדש מקבלן, חדש, משופץ, שמור, ישן)
   - ריהוט (מלא, חלקי, ללא)
   - מאפיינים: חניה, מחסן, נוף, מיזוג, מרפסת סוכה, יחידת הורים, ממ"ד, חצר, יחידת דיור, מעלית, **אופציה**
   - מחיר מבוקש (תקציב)
   - ארנונה וועד בית
   - תאריך כניסה רצוי
4. **שלב 4 - פרטי התקשרות**:
   - שם (אופציונלי)
   - טלפון (חובה)

### דירה להשכרה (מחפש לשכור)

**זהה לדירה לקניה**, אך **ללא מאפיין "אופציה"** בשלב 3.

### דירה לשבת (מחפש)

1. **שלב 1 - אזור מבוקש**: טקסט חופשי (שכונה/רחוב/אזור)
2. **שלב 2 - בתשלום/ללא תשלום**: בחירה
3. **שלב 3 - פרטי נכס**:
   - פרשה (רשימה סגורה)
   - סוג נכס
   - מספר חדרים (1-8)
   - מטרה (אירוח / לינה בלבד)
   - קומה
   - מרפסות (0-3)
   - מאפיינים: פלטה, מיחם, נוף, מצעים, מיזוג, מרפסת, בריכה, חצר, משחקי ילדים, מיטת תינוק, יחידת הורים, לינה בלבד
   - **מחיר מבוקש** - מוצג רק אם נבחר "בתשלום" בשלב 2
4. **שלב 4 - פרטי התקשרות**

## נקודות חשובות

### ✅ שדה רחוב/אזור = טקסט חופשי
- **אין** autocomplete
- **אין** רשימה סגורה של רחובות בית שמש
- המשתמש יכול להקליד כל דבר (למשל: "אזור גבעת שרת", "רחוב הרצל")

### ✅ שימוש חוזר בקומפוננטות
- השתמשנו באותם קבועים (PROPERTY_TYPE_OPTIONS, ROOMS_OPTIONS, וכו')
- השתמשנו באותן שדות פרטי התקשרות
- מבנה Wizard דומה ל-ResidentialWizard

### ✅ הפרדה מלוגיקה קיימת
- כל מה שכתוב כאן שייך **רק לענף "דרושים"**
- **אין שינוי** בלוגיקה הקיימת של דירה למכירה/להשכרה/לשבת "רגילה"

### ✅ הודעת הצלחה
בכל 3 ה-Wizards, לאחר פרסום המודעה:
```typescript
navigate(`/ads/${data.id}`, {
  state: { message: `מודעה מס' ${adNumber} הועלתה בהצלחה!` }
});
```

## שדות ייחודיים לכל Wizard

### WantedForSale
- `hasBroker: boolean`
- `desiredStreet: string` (טקסט חופשי)
- `hasOption: boolean` (כן כולל אופציה)

### WantedForRent
- `hasBroker: boolean`
- `desiredStreet: string` (טקסט חופשי)
- **ללא** `hasOption`

### WantedHoliday
- `desiredArea: string` (טקסט חופשי)
- `isPaid: boolean`
- `parasha: string`
- `priceRequested?: number` (מוצג רק אם isPaid=true)

## API Payload

כל Wizard שולח payload עם:
```typescript
{
  title: string,               // כותרת שנבנית אוטומטית
  description: string,         // תיאור קצר
  price: number,               // המחיר המבוקש
  categoryId: string,          // ID קטגוריה (wanted-for-sale / wanted-for-rent / wanted-shabbat)
  adType: AdType,              // WANTED_FOR_SALE / WANTED_FOR_RENT / WANTED_HOLIDAY
  contactName?: string,
  contactPhone: string,
  customFields: {
    isWanted: true,            // דגל חשוב להבחנה!
    // ...שאר השדות הספציפיים
  }
}
```

## מה נותר לעשות (צד שרת)

1. **בדיקה/יצירה של קטגוריות**:
   - `wanted-for-sale`
   - `wanted-for-rent`
   - `wanted-shabbat` (או `wanted-holiday`)

2. **טיפול ב-`isWanted: true`** ב-customFields כדי להבדיל בין מודעות "מציע" ל"מחפש"

3. **שמירת adNumber** ב-DB והחזרתו בתגובה

4. **Validation** של כל השדות החדשים

## סיכום

יצרנו מסלול מלא ל"דרושים" (מחפש נכס) עם:
- ✅ 3 Wizards מלאים ופעילים
- ✅ 1 Wizard TODO (נדל"ן מסחרי)
- ✅ מסך בחירה ראשי
- ✅ טיפוסים ו-Validation מלאים
- ✅ שימוש חוזר בקומפוננטות קיימות
- ✅ ללא שינוי בלוגיקה קיימת
- ✅ שדה רחוב/אזור = טקסט חופשי (לא autocomplete)
- ✅ הודעת הצלחה עם adNumber

כל הקוד מבוסס על עקרונות ה-DRY (Don't Repeat Yourself) ומשתמש בקומפוננטות קיימות איפה שאפשר!
