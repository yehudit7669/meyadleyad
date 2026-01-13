# מערכת Wizard לפרסום מודעות - מיעדליעד

## סקירה כללית

מערכת ה-Wizard החדשה מספקת תהליך רב-שלבי ממוקד משתמש לפרסום מודעות בקטגוריות שונות.

## מבנה המערכת

### 1. מסך בחירת סוג מודעה (`/publish`)

מסך ראשי עם 8 אפשרויות:
- דירה לקניה (FOR_SALE)
- דירה להשכרה (FOR_RENT)
- יחידת דיור (UNIT)
- דירות לשבת - מציע (HOLIDAY_RENT)
- דרוש דירה לשבת (HOLIDAY_WANTED)
- פרויקטים (PROJECT)
- נדל״ן מסחרי (COMMERCIAL)
- דרושים (JOB)

### 2. Wizard למודעות מגורים (קניה/השכרה/יחידת דיור)

**שלב 1: תיווך**
- בחירה בין "עם תיווך" ל"ללא תיווך"
- אפשרות למלא שם מתווך ומשרד תיווך

**שלב 2: כתובת**
- עיר: בית שמש (קבוע)
- רחוב: בחירה מרשימה סגורה עם autocomplete
- שכונה: מתמלאת אוטומטית
- מספר בית (חובה)
- תוספת כתובת (אופציונלי)

**שלב 3: פרטי הנכס**
- סוג נכס (דירה/דופלקס/דירת גן/בית פרטי/יחידה)
- מספר חדרים (1-8)
- שטח במ״ר
- מצב הנכס (חדש מקבלן/חדש/משופץ/שמור/ישן)
- קומה
- מספר מרפסות (0-3)
- ריהוט (מלא/חלקי/ללא)
- תאריך כניסה
- מחיר מבוקש
- ארנונה וועד בית
- מאפיינים (10 אפשרויות כגון חניה, מחסן, ממ״ד וכו')
- תיאור חופשי

**שלב 4: תמונות**
- העלאת עד 10 תמונות
- העלאת תכנית דירה (PDF/JPG/PNG)
- אפשרות לדלג

**שלב 5: פרטי התקשרות**
- שם איש קשר
- טלפון (עם ולידציה)
- זמני קבלת שיחות (אופציונלי)
- אישור תנאי שימוש (חובה)

### 3. Wizards נוספים

כרגע Wizards עבור דירות שבת, פרויקטים, נדל״ן מסחרי ודרושים מציגים מסך placeholder עם אפשרות לחזור לבחירת סוג או למעבר לטופס הקיים.

## תכונות מרכזיות

### ולידציה
- שימוש ב-Zod schemas לכל שלב
- הודעות שגיאה ברורות בעברית
- סימון שדות חובה

### UX/UI
- עיצוב RTL מלא
- תמיכה מלאה במובייל (Mobile First)
- פס התקדמות חזותי
- אנימציות חלקות
- נגישות מלאה (ARIA labels, skip links)

### אינטגרציה
- חיבור מלא ל-Backend API
- שימוש ב-React Query לניהול state
- העלאת תמונות עם ImageUpload component קיים
- הגנת routes עם ProtectedRoute

## קבצים עיקריים

### Types & Schemas
- `client/src/types/wizard.ts` - כל ה-types וה-schemas
- `client/src/constants/adTypes.ts` - קבועים ואפשרויות

### Components
- `client/src/pages/PublishAdSelection.tsx` - מסך בחירה ראשי
- `client/src/components/wizard/WizardProgress.tsx` - פס התקדמות
- `client/src/components/wizard/WizardNavigation.tsx` - ניווט
- `client/src/components/wizard/residential/*` - Wizard מגורים
- `client/src/components/wizard/holiday/*` - Wizard שבת
- `client/src/components/wizard/project/*` - Wizard פרויקטים
- `client/src/components/wizard/commercial/*` - Wizard מסחרי
- `client/src/components/wizard/job/*` - Wizard דרושים

### Routes
כל ה-routes מוגנים ב-ProtectedRoute:
- `/publish` - בחירת סוג מודעה
- `/publish/wizard/for_sale` - דירה לקניה
- `/publish/wizard/for_rent` - דירה להשכרה
- `/publish/wizard/unit` - יחידת דיור
- `/publish/wizard/holiday_rent` - דירה לשבת (מציע)
- `/publish/wizard/holiday_wanted` - דרוש דירה לשבת
- `/publish/wizard/project` - פרויקט
- `/publish/wizard/commercial` - מסחרי
- `/publish/wizard/job` - דרושים

## כפתור "פרסום חדש"

הכפתור "פרסום חדש" ב-Header מחובר ל-`/publish`:
- משתמשים מחוברים - ניתוב ישיר למסך הבחירה
- משתמשים לא מחוברים - הפניה אוטומטית ל-`/login`

## עבודה עתידית

1. **Wizard מלא לדירות שבת** - מימוש שני מסלולים (מציע/מחפש)
2. **Wizard פרויקטים** - טופס ייעודי לפרויקטי בנייה
3. **Wizard נדל״ן מסחרי** - טופס לנכסים מסחריים
4. **Wizard דרושים** - טופס למשרות
5. **שיפורים נוספים**:
   - שמירת טיוטה (draft)
   - תצוגה מקדימה לפני פרסום
   - אפשרות לערוך במעבר בין שלבים
   - תמיכה בעיתות נוספות מעבר לבית שמש

## הרצה

```bash
cd client
npm install
npm run dev
```

המערכת תהיה זמינה ב-`http://localhost:5173`

## בדיקות

הקפד לבדוק:
1. ✅ ניווט בין שלבים
2. ✅ ולידציה בכל שלב
3. ✅ שמירת נתונים בין שלבים
4. ✅ העלאת תמונות
5. ✅ שליחה ל-API
6. ✅ טיפול בשגיאות
7. ✅ תצוגה במובייל
8. ✅ נגישות

## תמיכה

לשאלות או בעיות, פנה למפתח הראשי.
