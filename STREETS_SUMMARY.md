# 🏙️ מערכת רחובות בית שמש - סיכום שינויים

## 📋 מה השתנה?

המערכת עודכנה לעבוד עם מודל חדש:
- **עיר אחת בלבד**: בית שמש (כברירת מחדל)
- **רחובות**: ~380 רחובות מקובץ CSV
- **שכונות**: השכונה מתמלאת אוטומטית לפי הרחוב שנבחר

---

## 🎯 שינויים מרכזיים

### 1. Backend (Server)

#### ✅ Database Schema (Prisma)
- **מודל חדש: `Neighborhood`** - שכונות
- **מודל חדש: `Street`** - רחובות (כולל קוד, שם, שיוך לשכונה)
- **עודכן: `City`** - קשרים לשכונות ורחובות
- **עודכן: `Ad`** - כולל `cityId` (חובה), `streetId`, `neighborhood`

#### ✅ API Endpoints חדשים
```
GET /api/streets                        - חיפוש רחובות
GET /api/streets/:id                    - פרטי רחוב
GET /api/streets/city/beit-shemesh      - קבלת עיר בית שמש
```

#### ✅ Seed Script
- `server/prisma/seedStreets.ts` - טוען רחובות מ-CSV
- קורא `רחובות בית שמש.csv` (380 רחובות)
- יוצר שכונות ורחובות עם קודים

#### ✅ Validations
- `cityId` - חובה
- `streetId` - חובה
- `neighborhood` - מתמלא אוטומטית מה-DB (לא מה-client)

---

### 2. Frontend (Client)

#### ✅ AdForm Component
**שדה עיר:**
- מוצג: "בית שמש"
- `disabled` - לא ניתן לעריכה
- הערה: "כרגע המערכת פועלת רק בבית שמש"

**שדה רחוב:**
- Autocomplete עם חיפוש חי
- הקלדת 2 תווים → מציג רשימת רחובות
- בחירת רחוב → השכונה מתמלאת אוטומטית
- לא ניתן להקליד רחוב ידנית

**שדה שכונה:**
- `disabled` / `read-only`
- מתמלא אוטומטית לפי הרחוב
- הערה: "השכונה מתמלאת אוטומטית"

#### ✅ Services
- `streetsService` - חיפוש והבאת רחובות
- `citiesService.getBeitShemesh()` - קבלת עיר בית שמש

---

## 📂 קבצים חדשים

### Backend
```
server/
├── prisma/
│   └── seedStreets.ts                    # Seed script לרחובות
├── src/
│   └── modules/
│       └── streets/
│           ├── streets.service.ts        # לוגיקה עסקית
│           ├── streets.controller.ts     # Controllers
│           ├── streets.routes.ts         # Routes
│           └── streets.validation.ts     # Zod validations
└── רחובות בית שמש.csv                    # CSV עם רחובות
```

### Documentation
```
├── STREETS_IMPLEMENTATION.md             # תיעוד מפורט
├── QUICK_START_STREETS.md                # הוראות מהירות
├── setup-streets.ps1                     # סקריפט אוטומטי להתקנה
└── test-streets-api.ps1                  # בדיקת API
```

---

## 🚀 איך להתחיל?

### אופציה 1: סקריפט אוטומטי (מומלץ)
```powershell
cd C:\Users\User\Desktop\meyadleyad
.\setup-streets.ps1
```

### אופציה 2: ידנית
```powershell
# 1. הפעל Docker
docker-compose up -d

# 2. Migration
cd server
npx prisma migrate dev --name add_streets_and_neighborhoods

# 3. Seed
npx ts-node prisma/seedStreets.ts

# 4. הפעל שרת
npm run dev

# 5. הפעל לקוח (טרמינל נפרד)
cd ../client
npm run dev
```

---

## ✅ בדיקות

### בדיקת API
```powershell
.\test-streets-api.ps1
```

### בדיקת UI
1. פתח `http://localhost:5173`
2. התחבר למערכת
3. לחץ "פרסם מודעה"
4. בדוק:
   - ✅ עיר = "בית שמש" (disabled)
   - ✅ רחוב = autocomplete
   - ✅ שכונה = אוטומטי

### בדיקת DB
```powershell
cd server
npx prisma studio
```
בדוק טבלאות: `City`, `Neighborhood`, `Street`, `Ad`

---

## 📊 נתונים

- **עיר אחת**: בית שמש
- **~380 רחובות** מה-CSV
- **~XX שכונות** (מתוך ה-CSV)
- **פורמט CSV**: `שם רחוב, קוד רחוב, שם שכונה`

---

## 🔮 עתיד

### להוסיף ערים נוספות:
1. הוסף CSV נוסף עם רחובות העיר
2. עדכן את ה-seed script
3. הסר את ה-`disabled` משדה העיר
4. הוסף סינון רחובות לפי עיר נבחרת

### להוסיף רחובות לעריכת מודעה:
1. החלף את הטופס ב-`EditAd.tsx` ל-`<AdForm />`
2. העבר `initialData` עם `streetId`

---

## 📞 תמיכה

### פתרון בעיות
ראה [STREETS_IMPLEMENTATION.md](STREETS_IMPLEMENTATION.md) 
ו-[QUICK_START_STREETS.md](QUICK_START_STREETS.md)

### קבצים חשובים
- Schema: `server/prisma/schema.prisma`
- Seed: `server/prisma/seedStreets.ts`
- API: `server/src/modules/streets/`
- Form: `client/src/components/AdForm.tsx`

---

## ✨ תכונות

- ✅ חיפוש רחובות בעברית (case-insensitive)
- ✅ Autocomplete חכם
- ✅ שכונות אוטומטיות
- ✅ ולידציה מלאה (client + server)
- ✅ UX אינטואיטיבי
- ✅ תמיכה בקודי רחובות עירייתיים

---

**תאריך עדכון**: 5 בינואר 2026
**גרסה**: 1.0.0 - Streets System
