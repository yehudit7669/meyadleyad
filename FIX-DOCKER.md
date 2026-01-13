# 🔧 פתרון בעיית Docker Desktop - WSL 2

## ❌ הבעיה
Docker Desktop מותקן, אבל לא יכול לפעול כי **WSL 2** לא מופעל ב-Windows.

## ✅ הפתרון (3 שלבים פשוטים)

### שלב 1: הפעלת WSL 2 (דורש הרשאות Admin)

**פתחי PowerShell כמנהל (Administrator):**
1. לחצי על כפתור Start
2. חפשי "PowerShell"
3. לחצי לחיצה ימנית על "Windows PowerShell"
4. בחרי "Run as administrator"
5. לחצי "Yes" באישור

**בחלון PowerShell שנפתח (כמנהל), הריצי:**

```powershell
# 1. הפעלת WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 2. הפעלת Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 3. התקנת WSL 2
wsl --install --no-launch

# 4. הגדרת WSL 2 כברירת מחדל
wsl --set-default-version 2
```

### שלב 2: אתחול המחשב (חובה!)

```powershell
Restart-Computer -Force
```

**או:** לחצי Start → Power → Restart

### שלב 3: אחרי האתחול

1. **הפעילי את Docker Desktop** מתפריט Start
2. **המתיני** עד שהאייקון בשורת המשימות יהפוך לירוק (1-2 דקות)
3. **פתחי PowerShell רגיל** (לא כמנהל) והריצי:

```powershell
cd C:\Users\User\Desktop\meyadleyad
.\start-docker.ps1
```

זהו! הכל יעבוד מעולה.

---

## 🚀 חלופה: עבודה ללא Docker (מהיר יותר לעכשיו)

אם את רוצה להתחיל לעבוד **מיד** בלי Docker, אפשר להשתמש ב-PostgreSQL רגיל:

### 1. הורידי PostgreSQL
https://www.postgresql.org/download/windows/

### 2. התקיני (ברירות מחדל בסדר)
- Port: 5432
- Password: בחרי סיסמה (לדוגמה: password)

### 3. עדכני את server/.env:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/meyadleyad?schema=public"
```
(החליפי `password` בסיסמה שבחרת)

### 4. צרי את המסד:
```powershell
# פתחי SQL Shell (psql) מתפריט Start
# הקישי Enter 4 פעמים, ואז הקישי את הסיסמה
CREATE DATABASE meyadleyad;
\q
```

### 5. הריצי את הפרויקט:
```powershell
# Terminal 1 - הכנת השרת
cd C:\Users\User\Desktop\meyadleyad\server
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev

# Terminal 2 - הכנת הלקוח
cd C:\Users\User\Desktop\meyadleyad\client
npm run dev
```

**זהו!** הפרויקט ירוץ על:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 🤔 מה להמליץ?

| אופציה | יתרונות | חסרונות | זמן |
|--------|---------|---------|-----|
| **Docker** | נקי, מבודד, קל לנהל | דורש אתחול, הגדרות Admin | 10-15 דק' |
| **PostgreSQL רגיל** | מהיר להתקנה, פשוט | צריך לנהל ידנית | 5 דק' |

**המליצה שלי:** אם את רוצה לעבוד **עכשיו** - לכי על PostgreSQL רגיל.
אם את יכולה לחכות ולעשות אתחול - Docker יותר נקי לטווח ארוך.

---

## 💡 איזו אופציה את בוחרת?

1️⃣ **Docker** - אני אכינה לך את כל הפקודות (דורש אתחול)
2️⃣ **PostgreSQL רגיל** - נתקין ונתחיל לעבוד תוך 5 דקות

**ספרי לי מה את מעדיפה ואני אדריך אותך צעד אחר צעד** 😊
