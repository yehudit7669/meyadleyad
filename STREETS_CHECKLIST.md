# ✅ Checklist - מערכת רחובות בית שמש

## לפני התחלת העבודה

- [ ] Docker Desktop מותקן ורץ
- [ ] Node.js מותקן (v18+)
- [ ] PostgreSQL רץ ב-Docker
- [ ] קובץ CSV נמצא ב: `server/רחובות בית שמש.csv`

---

## התקנה וסידור

### Database
- [ ] `docker-compose up -d` - הפעלת containers
- [ ] `npx prisma migrate dev` - יצירת migration
- [ ] `npx ts-node prisma/seedStreets.ts` - טעינת רחובות
- [ ] אימות ב-Prisma Studio:
  - [ ] City: יש "בית שמש"
  - [ ] Neighborhood: יש שכונות
  - [ ] Street: יש ~380 רחובות

### Server
- [ ] `cd server && npm install`
- [ ] קובץ `.env` מוגדר
- [ ] `npm run dev` - שרת רץ על port 5000
- [ ] API עובד: `curl http://localhost:5000/api/streets/city/beit-shemesh`

### Client
- [ ] `cd client && npm install`
- [ ] קובץ `.env` מוגדר
- [ ] `npm run dev` - לקוח רץ על port 5173

---

## בדיקות פונקציונליות

### API Tests
- [ ] GET `/api/streets/city/beit-shemesh` - מחזיר עיר
- [ ] GET `/api/streets?query=נחל` - מחזיר רחובות
- [ ] GET `/api/streets/:id` - מחזיר פרטי רחוב
- [ ] חיפוש בעברית עובד
- [ ] neighborhoods מוחזרות נכון

### UI Tests - יצירת מודעה
- [ ] שדה "עיר" מציג "בית שמש"
- [ ] שדה "עיר" הוא disabled
- [ ] שדה "רחוב" מאפשר הקלדה
- [ ] חיפוש רחוב (2+ תווים) מציג תוצאות
- [ ] בחירת רחוב ממלאת שכונה אוטומטית
- [ ] שדה "שכונה" הוא read-only
- [ ] שגיאת ולידציה אם לא נבחר רחוב
- [ ] מודעה נשמרת עם cityId, streetId, neighborhood

### Backend Validation
- [ ] שרת דורש cityId
- [ ] שרת דורש streetId
- [ ] שרת לא מקבל neighborhood מה-client
- [ ] שרת משלים neighborhood מה-DB
- [ ] שגיאה אם רחוב לא קיים
- [ ] שגיאה אם רחוב לא שייך לעיר

### Data Integrity
- [ ] כל רחוב שייך לעיר בית שמש
- [ ] לא ניתן לבחור עיר אחרת
- [ ] neighborhood תואמת לרחוב שנבחר
- [ ] קוד רחוב נשמר נכון

---

## Performance & UX

- [ ] חיפוש רחובות מהיר (< 500ms)
- [ ] Autocomplete responsive
- [ ] הודעות שגיאה ברורות בעברית
- [ ] Loading states מוצגים
- [ ] אין שגיאות ב-console

---

## Documentation

- [ ] STREETS_IMPLEMENTATION.md קיים
- [ ] QUICK_START_STREETS.md קיים
- [ ] STREETS_SUMMARY.md קיים
- [ ] setup-streets.ps1 עובד
- [ ] test-streets-api.ps1 עובד

---

## Production Ready

- [ ] Migrations committed to git
- [ ] CSV file in repo or documented location
- [ ] Environment variables documented
- [ ] Error handling מלא
- [ ] Logging מוגדר
- [ ] Tests pass

---

## סטטוס כללי

**Backend**: _____ / 100%
**Frontend**: _____ / 100%
**Testing**: _____ / 100%
**Documentation**: _____ / 100%

**Overall Ready**: [ ] YES / [ ] NO

---

**תאריך בדיקה**: ____________
**בודק**: ____________
**הערות**: 
```



```
