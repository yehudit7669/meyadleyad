# 🚀 Quick Start Guide

## התקנה מהירה

### 1. הגדרת Database

התקן PostgreSQL ויצור מסד נתונים:

```sql
CREATE DATABASE meyadleyad;
```

### 2. Backend

```bash
cd server

# התקנה
npm install

# העתק והגדר .env
copy .env.example .env

# ערוך DATABASE_URL ב-.env:
DATABASE_URL="postgresql://username:password@localhost:5432/meyadleyad?schema=public"

# הרץ migrations
npx prisma migrate dev

# טען נתוני דמו
npm run prisma:seed

# הפעל את השרת
npm run dev
```

### 3. Frontend

בטרמינל נפרד:

```bash
cd client

# התקנה
npm install

# העתק .env
copy .env.example .env

# הפעל
npm run dev
```

### 4. פתח דפדפן

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Prisma Studio: `npx prisma studio` (בתיקיית server)

### 5. התחבר

השתמש באחד מחשבונות הדמו:
- **Admin**: admin@meyadleyad.com / admin123456
- **Broker**: broker@example.com / broker123456
- **User**: user@example.com / user123456

## 🎯 הגדרות חשובות

### Backend .env
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=5000
CLIENT_URL="http://localhost:3000"
```

### Frontend .env
```env
VITE_API_URL=http://localhost:5000/api
```

## ✅ בדיקות

1. ✅ Backend רץ - נווט ל-http://localhost:5000/health
2. ✅ Frontend רץ - נווט ל-http://localhost:3000
3. ✅ DB מחובר - הרץ `npx prisma studio`
4. ✅ התחבר עם משתמש דמו

## 🛠️ פקודות שימושיות

### Backend
```bash
npm run dev          # Development
npm run build        # Build
npm start           # Production
npm run prisma:studio # DB UI
```

### Frontend
```bash
npm run dev          # Development
npm run build        # Build
npm run preview      # Preview build
```

## 🐛 פתרון בעיות

### בעיית חיבור ל-DB
- ודא ש-PostgreSQL רץ
- בדוק את DATABASE_URL
- הרץ: `npx prisma migrate reset`

### שגיאות CORS
- ודא ש-CLIENT_URL ב-backend .env נכון
- בדוק שה-frontend רץ על הפורט הנכון

### Token Issues
- נקה localStorage
- התנתק והתחבר מחדש

זהו! המערכת מוכנה לפיתוח 🎉
