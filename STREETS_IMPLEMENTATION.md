# הוראות הרצה והפעלת המערכת - רחובות בית שמש

## סקירה
המערכת עודכנה לעבוד עם בית שמש כעיר יחידה, כולל רחובות ושכונות מקובץ CSV.

## שינויים שבוצעו

### 1. עדכון Prisma Schema
- ✅ נוסף מודל `Neighborhood` - שכונות
- ✅ נוסף מודל `Street` - רחובות  
- ✅ עודכן מודל `Ad` - כולל `streetId` ו-`neighborhood`
- ✅ עודכן מודל `City` - כולל קשרים לשכונות ורחובות

### 2. Seed Script
- ✅ נוצר `server/prisma/seedStreets.ts`
- קורא את קובץ `רחובות בית שמש.csv`
- יוצר את העיר "בית שמש"
- יוצר שכונות מעמודה C
- יוצר רחובות עם קוד, שם ושיוך לשכונה

### 3. Backend API
- ✅ נוצר מודול `streets` ב-`server/src/modules/streets/`
  - `streets.service.ts` - לוגיקה עסקית
  - `streets.controller.ts` - controllers
  - `streets.routes.ts` - routes
  - `streets.validation.ts` - validations

**Endpoints חדשים:**
- `GET /api/streets?query=&cityId=` - חיפוש רחובות
- `GET /api/streets/:id` - פרטי רחוב
- `GET /api/streets/city/beit-shemesh` - קבלת מזהה בית שמש

### 4. עדכון Ads Service
- ✅ עודכן `createAd` - מקבל `cityId` (חובה) ו-`streetId` (חובה)
- ✅ השכונה מתמלאת אוטומטית מה-DB לפי הרחוב
- ✅ ולידציה שהרחוב שייך לעיר

### 5. Frontend
- ✅ נוסף `streetsService` ב-`client/src/services/api.ts`
- ✅ עודכן `AdForm.tsx`:
  - שדה עיר קבוע: "בית שמש" (disabled)
  - שדה רחוב: autocomplete עם חיפוש
  - שדה שכונה: read-only, מתמלא אוטומטית

## הוראות הפעלה

### שלב 1: הכנה
```powershell
# וודא ש-Docker Desktop פועל
docker --version

# התחל את Docker containers
cd C:\Users\User\Desktop\meyadleyad
docker-compose up -d

# המתן עד שהמערכת מוכנה (30 שניות)
```

### שלב 2: Migration
```powershell
cd C:\Users\User\Desktop\meyadleyad\server

# צור migration חדש
npx prisma migrate dev --name add_streets_and_neighborhoods

# זה יצור טבלאות: Neighborhood, Street ויעדכן Ad
```

### שלב 3: Seed - טעינת רחובות
```powershell
cd C:\Users\User\Desktop\meyadleyad\server

# הרץ את ה-seed script
npx ts-node prisma/seedStreets.ts
```

**תוצאה צפויה:**
```
🌱 Starting streets seed for Beit Shemesh...
✅ City created/found: בית שמש
📄 Parsed XXX streets from CSV
🏘️ Found XX unique neighborhoods
  ✓ Neighborhood: המשקפיים
  ✓ Neighborhood: רמת בית שמש א
  ...
🔄 Processing XXX unique streets...
✅ Streets seed completed!
   - Created/Updated: XXX streets
   - Skipped: 0 streets
   - Neighborhoods: XX
```

### שלב 4: הפעלת השרת
```powershell
cd C:\Users\User\Desktop\meyadleyad\server
npm run dev
```

### שלב 5: הפעלת הלקוח
```powershell
# טרמינל נפרד
cd C:\Users\User\Desktop\meyadleyad\client
npm run dev
```

## בדיקת הפונקציונליות

### 1. בדיקת API
```powershell
# קבלת עיר בית שמש
curl http://localhost:5000/api/streets/city/beit-shemesh

# חיפוש רחובות
curl "http://localhost:5000/api/streets?query=הרצל"

# חיפוש רחובות בבית שמש
curl "http://localhost:5000/api/streets?query=נחל&cityId=<CITY_ID>"
```

### 2. בדיקת טופס יצירת מודעה

1. פתח דפדפן: `http://localhost:5173`
2. התחבר למערכת
3. לחץ על "פרסם מודעה"
4. בצע בדיקות:
   - ✅ שדה "עיר" מציג "בית שמש" ו-disabled
   - ✅ שדה "רחוב" מאפשר חיפוש
   - ✅ הקלד "נחל" - צריך להופיע רשימת רחובות
   - ✅ בחר רחוב - השכונה תתמלא אוטומטית
   - ✅ שדה "שכונה" הוא read-only
   - ✅ פרסם מודעה - ודא שנשמרת עם `cityId`, `streetId`, `neighborhood`

### 3. בדיקת DB
```powershell
cd C:\Users\User\Desktop\meyadleyad\server
npx prisma studio
```

בדוק:
- טבלת `City` - יש "בית שמש"
- טבלת `Neighborhood` - יש שכונות
- טבלת `Street` - יש רחובות עם קודים
- טבלת `Ad` - מודעות חדשות כוללות `cityId`, `streetId`, `neighborhood`

## פתרון בעיות

### Migration נכשל
```powershell
# אפס את ה-DB והתחל מחדש
cd C:\Users\User\Desktop\meyadleyad\server
npx prisma migrate reset
npx prisma migrate dev
npx ts-node prisma/seedStreets.ts
```

### קובץ CSV לא נמצא
וודא שהקובץ `רחובות בית שמש.csv` נמצא ב:
```
C:\Users\User\Desktop\meyadleyad\server\רחובות בית שמש.csv
```

### הרחובות לא נטענו
```powershell
# בדוק שהעיר בית שמש קיימת
cd C:\Users\User\Desktop\meyadleyad\server
npx prisma studio
# בדוק טבלת City

# אם לא קיימת, הרץ שוב:
npx ts-node prisma/seedStreets.ts
```

## מבנה הנתונים

### CSV Format
```
שם רחוב,קוד רחוב,שם שכונה
הרצל,101,רמת משה
נחל שורק,422,רמת בית שמש א
רבי עקיבא,460,רמת בית שמש ב
```

### Database Schema
```
City
  - id
  - name: "בית שמש"
  - nameHe: "בית שמש"

Neighborhood
  - id
  - name
  - cityId (FK -> City)

Street
  - id
  - name
  - code
  - cityId (FK -> City)
  - neighborhoodId (FK -> Neighborhood, nullable)

Ad
  - ...
  - cityId (FK -> City, required)
  - streetId (FK -> Street, optional)
  - neighborhood (string, auto-filled)
```

## Validations

### Client Side
- ✅ עיר: בית שמש בלבד (disabled field)
- ✅ רחוב: חובה, מתוך רשימה בלבד
- ✅ שכונה: read-only, אוטומטי

### Server Side (Zod)
```typescript
{
  cityId: z.string().uuid('עיר לא תקינה'), // חובה
  streetId: z.string().uuid('רחוב לא תקין'), // חובה
  // neighborhood לא מגיע מה-client!
}
```

### Service Logic
1. וולידציה ש-`streetId` קיים
2. וולידציה ש-`cityId` קיים
3. וולידציה שהרחוב שייך לעיר
4. שליפת השכונה מה-DB
5. שמירת המודעה עם השכונה הנכונה

## Next Steps (עתידי)

### הוספת רחובות לעריכת מודעה
כרגע `EditAd.tsx` לא משתמש ב-`AdForm` component. 
כדי להוסיף תמיכה ברחובות גם שם:
1. החלף את הטופס הישן ב-`<AdForm />`
2. העבר את ה-`initialData` עם `streetId`

### הוספת ערים נוספות

כאשר תרצה להוסיף ערים נוספות:

1. הוסף CSV נוסף עם רחובות העיר החדשה
2. עדכן את ה-seed script לקרוא מספר קבצים
3. עדכן את `AdForm.tsx` - הסר את ה-disabled מהעיר
4. הוסף בחירת עיר + סינון רחובות לפי עיר

## סיכום

המערכת מוכנה לעבודה עם:
- ✅ עיר אחת: בית שמש
- ✅ רחובות מה-CSV
- ✅ שכונות אוטומטיות
- ✅ ולידציה מלאה בצד שרת ולקוח
- ✅ UX אינטואיטיבי עם autocomplete

**הערה חשובה:** אל תשכח להריץ את ה-migration וה-seed לפני הבדיקה!
