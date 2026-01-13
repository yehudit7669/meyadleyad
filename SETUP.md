# 🚀 התקנה והרצה מהירה

## שלב 1: התקנת תלויות

### Backend
```powershell
cd server
npm install
```

### Frontend
```powershell
cd client
npm install
```

## שלב 2: הגדרת סביבה

### Backend - הגדרת .env
```powershell
cd server
copy .env.example .env
```

ערוך את `server\.env` עם הנתונים שלך:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/meyadleyad?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
```

### Frontend - הגדרת .env
```powershell
cd client
copy .env.example .env
```

ערוך את `client\.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

## שלב 3: הגדרת Database

### התקנת PostgreSQL (אם עדיין לא מותקן)
1. הורד מ-https://www.postgresql.org/download/windows/
2. התקן והגדר username/password
3. צור DB חדש בשם `meyadleyad`

### הרצת Migrations
```powershell
cd server
npx prisma migrate dev --name init
```

### טעינת נתוני דמו
```powershell
npm run prisma:seed
```

## שלב 4: הרצת השרתים

### הרצת Backend (טרמינל 1)
```powershell
cd server
npm run dev
```
השרת ירוץ על: http://localhost:5000

### הרצת Frontend (טרמינל 2)
```powershell
cd client
npm run dev
```
הקליינט ירוץ על: http://localhost:3000

## ✅ בדיקה

1. פתח דפדפן ב-http://localhost:3000
2. לחץ על "הירשם" וצור חשבון
3. התחבר עם אחד ממשתמשי הדמו:
   - **Admin**: admin@meyadleyad.com / admin123456
   - **Broker**: broker@example.com / broker123456
   - **User**: user@example.com / user123456

## 🛠️ פקודות שימושיות

### Backend
```powershell
npm run dev          # הרצת שרת במצב פיתוח
npm run build        # בניית פרודקשן
npm start            # הרצת פרודקשן
npm run prisma:studio # פתיחת Prisma Studio
```

### Frontend
```powershell
npm run dev          # הרצת במצב פיתוח
npm run build        # בניית פרודקשן
npm run preview      # preview של build
```

## 🐛 פתרון בעיות

### שגיאת חיבור ל-DB
- ודא ש-PostgreSQL רץ
- בדוק את ה-DATABASE_URL ב-.env
- וודא שה-DB קיים

### Port כבר בשימוש
- שנה את PORT ב-server/.env
- שנה את server.port ב-client/vite.config.ts

### שגיאות Prisma
```powershell
cd server
npx prisma generate
npx prisma migrate reset
npm run prisma:seed
```

## 📞 תמיכה

לשאלות: info@meyadleyad.com
