# ✅ אינטגרציה Google Forms - הוגדר בהצלחה!

## 📦 מה נוצר?

1. **GOOGLE_FORMS_APPS_SCRIPT.js** - קוד Apps Script מוכן לשימוש
2. **GOOGLE_FORMS_INTEGRATION_GUIDE.md** - מדריך מפורט בעברית
3. **עדכון בשרת** - השרת מוכן לקבל נתונים מהטופס

---

## 🚀 מה צריך לעשות עכשיו?

### שלב 1: פתח את הטופס
```
https://docs.google.com/forms/d/e/1FAIpQLSd5ZjstupkxjBc9d7j7h3hOkIHVNgfjZLlCtPbB7j0cDmbt2w/edit
```

### שלב 2: פתח Apps Script
- לחץ על **⋮** (שלוש נקודות) → **Extensions** → **Apps Script**

### שלב 3: העתק את הקוד
- פתח את הקובץ `GOOGLE_FORMS_APPS_SCRIPT.js`
- העתק את **כל הקוד**
- הדבק ב-Apps Script (מחק קוד קיים)
- שמור (Ctrl+S)

### שלב 4: צור Trigger
- לחץ על **⏰** (Triggers) בצד
- **Add Trigger**
- בחר:
  - Function: `onFormSubmit`
  - Event source: `From form`
  - Event type: `On form submit`
- שמור ואשר הרשאות

### שלב 5: התאם שמות שאלות (אם נדרש)
אם שמות השאלות בטופס שונים מאלה:
```
כתובת אימייל
שם מלא
מספר טלפון
כותרת המודעה
תיאור הנכס
מחיר
עיר
רחוב ומספר בית
מספר חדרים
שטח במ״ר
קומה
חניה
מעלית
מרפסת
מחסן
מצב הנכס
תאריך כניסה
```

**ערוך את `FIELD_MAPPING` בקוד** (השורות 36-56)

---

## 🧪 בדיקה

1. **מלא את הטופס** עם נתונים אמיתיים
   - ⚠️ **חשוב:** השתמש באימייל של משתמש **רשום** במערכת!
   
2. **בדוק ב-Apps Script:**
   - Extensions → Apps Script → **Executions** (⚡)
   - האם יש הצלחה?

3. **בדוק במערכת המקום:**
   - היכנס כמנהל
   - נווט ל-**"מודעות ממתינות לאישור"**
   - האם המודעה הופיעה? ✅
   - אשר אותה
   - המשתמש יקבל **מייל אישור**

---

## 📊 איך לראות Logs?

**Apps Script:**
- Apps Script → **Executions** (⚡)

**שרת:**
```powershell
docker logs meyadleyad-server -f
```

חפש:
```
📝 Received Google Forms webhook
✅ Normalized form data
✅ Created ad 12345 in PENDING status
```

---

## ❌ בעיות נפוצות

### "User not registered"
המשתמש לא רשום במערכת. הוא צריך להירשם תחילה.

### "Invalid category"
הקטגוריה בקוד לא תואמת לבסיס הנתונים.
ודא שזה כתוב בדיוק כך: `דירות למכירה`

### הטריגר לא עובד
- ודא שהטריגר נוצר (Apps Script → Triggers)
- ודא שהפונקציה היא `onFormSubmit`
- ודא שה-Event הוא `On form submit`

---

## 📚 מדריך מפורט

קרא את `GOOGLE_FORMS_INTEGRATION_GUIDE.md` למידע מלא

---

## ✅ מה יקרה אחרי ההגדרה?

1. משתמש ממלא טופס → 
2. Google Forms שולח ל-Apps Script → 
3. Apps Script שולח לשרת → 
4. שרת יוצר מודעה ממתינה → 
5. מנהל מאשר → 
6. מודעה עולה לאוויר + מייל למשתמש

**אוטומטי 100%! 🎉**
