# הוראות הפעלה מהירות - מערכת רחובות בית שמש

## 🚀 Quick Start

### 1. הכנה (חד פעמי)

```powershell
# וודא ש-Docker Desktop פועל
docker --version

# התחל Docker containers
cd C:\Users\User\Desktop\meyadleyad
docker-compose up -d

# המתן 30 שניות
Start-Sleep -Seconds 30
```

### 2. Migration ו-Seed (חד פעמי)

```powershell
cd C:\Users\User\Desktop\meyadleyad\server

# צור migration
npx prisma migrate dev --name add_streets_and_neighborhoods

# טען רחובות מ-CSV
npx ts-node prisma/seedStreets.ts
```

### 3. הפעל שרת ולקוח

**טרמינל 1 - Server:**
```powershell
cd C:\Users\User\Desktop\meyadleyad\server
npm run dev
```

**טרמינל 2 - Client:**
```powershell
cd C:\Users\User\Desktop\meyadleyad\client
npm run dev
```

### 4. בדיקה

1. פתח `http://localhost:5173`
2. התחבר (או הירשם)
3. לחץ "פרסם מודעה"
4. בדוק:
   - ✅ עיר = "בית שמש" (disabled)
   - ✅ רחוב = autocomplete (הקלד "נחל")
   - ✅ שכונה = אוטומטי (read-only)

## ✅ תוצאה צפויה של Seed

```
🌱 Starting streets seed for Beit Shemesh...
✅ City created/found: בית שמש
📄 Parsed ~400 streets from CSV
🏘️ Found ~XX unique neighborhoods
✅ Streets seed completed!
   - Created/Updated: ~380 streets
   - Neighborhoods: ~XX
```

## 🔧 פתרון בעיות

### Docker לא עובד
```powershell
# הפעל Docker Desktop ידנית
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 30
docker-compose up -d
```

### DB Connection Error
```powershell
# אפס והתחל מחדש
cd C:\Users\User\Desktop\meyadleyad\server
npx prisma migrate reset
npx prisma migrate dev
npx ts-node prisma/seedStreets.ts
```

### CSV לא נמצא
הקובץ צריך להיות ב:
`C:\Users\User\Desktop\meyadleyad\server\רחובות בית שמש.csv`

## 📋 Checklist

- [ ] Docker Desktop רץ
- [ ] Containers רצים: `docker-compose ps`
- [ ] Migration עבר בהצלחה
- [ ] Seed טען רחובות
- [ ] Server רץ על port 5000
- [ ] Client רץ על port 5173
- [ ] טופס יצירת מודעה מציג רחובות

## 📚 מסמכים נוספים

ראה [STREETS_IMPLEMENTATION.md](STREETS_IMPLEMENTATION.md) לתיעוד מפורט.
