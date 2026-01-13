# 🚀 הפעלת הפרויקט - מדריך מהיר

## תוכן עניינים
1. [התקנת PostgreSQL](#1-התקנת-postgresql)
2. [הגדרת מסד נתונים](#2-הגדרת-מסד-נתונים)
3. [התקנת תלויות](#3-התקנת-תלויות)
4. [יצירת מסד הנתונים](#4-יצירת-מסד-הנתונים)
5. [הפעלת השרתים](#5-הפעלת-השרתים)

---

## 1. התקנת PostgreSQL

### אם PostgreSQL לא מותקן:

הורד והתקן מ-https://www.postgresql.org/download/windows/

במהלך ההתקנה:
- זכור את הסיסמה ל-`postgres` superuser
- השאר פורט 5432 (ברירת מחדל)
- התקן את כל הרכיבים

---

## 2. הגדרת מסד נתונים

פתח PowerShell כ-Administrator והרץ:

```powershell
# החלף 'YourPostgresPassword' בסיסמה שהגדרת בהתקנה
$env:PGPASSWORD='YourPostgresPassword'

# צור משתמש חדש
psql -U postgres -c "CREATE USER username WITH PASSWORD 'password';"

# צור מסד נתונים
psql -U postgres -c "CREATE DATABASE meyadleyad OWNER username;"

# תן הרשאות
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE meyadleyad TO username;"
```

**או** התחבר ידנית ל-psql:

```powershell
psql -U postgres
```

ובתוך psql:

```sql
CREATE USER username WITH PASSWORD 'password';
CREATE DATABASE meyadleyad OWNER username;
GRANT ALL PRIVILEGES ON DATABASE meyadleyad TO username;
\q
```

---

## 3. התקנת תלויות

```powershell
cd c:\Users\User\Desktop\meyadleyad

# התקן תלויות השרת
cd server
npm install

# התקן תלויות הלקוח
cd ..\client
npm install
```

---

## 4. יצירת מסד הנתונים

```powershell
# חזור לתיקיית השרת
cd ..\server

# צור Prisma Client
npx prisma generate

# הרץ מיגרציה ראשונית (יוצר את כל הטבלאות)
npx prisma migrate dev --name init

# מלא נתונים ראשוניים (משתמשים, קטגוריות, ערים)
npm run prisma:seed
```

### משתמשי דמו שנוצרים:

| תפקיד | אימייל | סיסמה |
|-------|--------|-------|
| Admin | admin@meyadleyad.com | admin123456 |
| Broker | broker@example.com | broker123456 |
| User | user@example.com | user123456 |

---

## 5. הפעלת השרתים

### Terminal 1 - שרת Backend:

```powershell
cd c:\Users\User\Desktop\meyadleyad\server
npm run dev
```

השרת ירוץ על: **http://localhost:5000**

### Terminal 2 - שרת Frontend:

```powershell
cd c:\Users\User\Desktop\meyadleyad\client
npm run dev
```

האתר ירוץ על: **http://localhost:3000**

---

## ✅ בדיקת תקינות

### בדוק שמסד הנתונים תקין:

```powershell
cd server
npx prisma studio
```

זה יפתח ממשק ויזואלי לצפייה בנתונים: **http://localhost:5555**

### בדוק שהשרת עובד:

פתח דפדפן וגש ל-http://localhost:5000/api/health

אמור להציג:
```json
{"status":"ok","timestamp":"2025-12-31T..."}
```

### בדוק את האתר:

פתח דפדפן וגש ל-http://localhost:3000

אמור לראות את דף הבית עם קטגוריות ומודעות.

---

## 🔧 פקודות שימושיות

### איפוס מסד נתונים:
```powershell
cd server
npx prisma migrate reset
npm run prisma:seed
```

### צפייה בנתונים:
```powershell
cd server
npx prisma studio
```

### בדיקת שגיאות TypeScript:
```powershell
# Server
cd server
npx tsc --noEmit

# Client
cd client
npx tsc --noEmit
```

### יצירת build לייצור:
```powershell
# Server
cd server
npm run build

# Client
cd client
npm run build
```

---

## 🐛 פתרון בעיות נפוצות

### שגיאה: "psql: command not found"

הוסף את PostgreSQL ל-PATH:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
```

### שגיאה: "relation does not exist"

הרץ מיגרציה שוב:
```powershell
cd server
npx prisma migrate reset
npm run prisma:seed
```

### שגיאה: "Port 5000 is already in use"

שנה את הפורט ב-`server/.env`:
```
PORT=5001
```

### שגיאה: "Port 3000 is already in use"

שנה את הפורט ב-`client/vite.config.ts`:
```typescript
server: {
  port: 3001,
  ...
}
```

---

## 📁 מבנה התיקיות

```
meyadleyad/
├── server/                 # Backend (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma  # סכימת מסד הנתונים
│   │   └── seed.ts        # נתונים ראשוניים
│   ├── src/
│   │   ├── modules/       # מודולים (auth, ads, categories...)
│   │   ├── middlewares/   # אימות, ולידציה, העלאת קבצים
│   │   └── config/        # הגדרות
│   └── .env               # משתני סביבה
├── client/                # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/    # קומפוננטות
│   │   ├── pages/         # עמודים
│   │   ├── hooks/         # React hooks
│   │   └── services/      # API calls
│   └── .env               # משתני סביבה
└── docker-compose.yml     # Docker (אופציונלי)
```

---

## 🎯 הבא בתור

1. **פתח את האתר**: http://localhost:3000
2. **התחבר עם משתמש Admin**: admin@meyadleyad.com / admin123456
3. **צור מודעה חדשה** מפאנל הניהול
4. **התחל לפתח** - עריכת קוד תגרום לטעינה מחדש אוטומטית

---

**זה הכל! הפרויקט אמור לרוץ עכשיו 🎉**
