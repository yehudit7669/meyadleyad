# 🐳 התקנת Docker והפעלת הפרויקט

## שלב 1: התקנת Docker Desktop (ידנית)

Docker Desktop לא יכול להיות מותקן אוטומטית. יש לבצע את השלבים הבאים:

### הורדה והתקנה:

1. **הורדת Docker Desktop:**
   - פתחי דפדפן וגשי לכתובת: https://www.docker.com/products/docker-desktop/
   - לחצי על **Download for Windows**
   - או הורידי ישירות מ: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

2. **התקנת Docker Desktop:**
   - הפעילי את הקובץ `Docker Desktop Installer.exe` שהורדת
   - עקבי אחר ההוראות על המסך
   - במהלך ההתקנה, וודאי שהאפשרויות הבאות מסומנות:
     - ✓ Install required Windows components for WSL 2
     - ✓ Add shortcut to desktop
   - לחצי **Install**
   - לאחר סיום ההתקנה, **הפעילי מחדש את המחשב** (נדרש!)

3. **הפעלת Docker Desktop:**
   - לאחר אתחול המחשב, הפעילי את Docker Desktop מתפריט Start
   - המתיני עד שהאייקון בשורת המשימות יהפוך לירוק (מצב "Docker Desktop is running")
   - זה עשוי לקחת 1-2 דקות בפעם הראשונה

---

## שלב 2: אימות Docker פועל

לאחר שDocker Desktop פועל, פתחי PowerShell **כמנהל** והריצי:

\`\`\`powershell
docker --version
docker compose version
docker ps
\`\`\`

אם הפקודות עבדו ללא שגיאות - מעולה! Docker מותקן ופועל. עברי לשלב 3.

---

## שלב 3: הפעלת PostgreSQL ב-Docker

הפרויקט כולל קובץ `docker-compose.yml` מוכן. הריצי:

\`\`\`powershell
# עברי לתיקיית הפרויקט
cd C:\Users\User\Desktop\meyadleyad

# הפעילי את PostgreSQL
docker compose up -d
\`\`\`

פקודה זו:
- מורידה את image של PostgreSQL (פעם ראשונה בלבד - ~200MB)
- יוצרת container בשם `meyadleyad-postgres`
- מגדירה:
  - **Database:** meyadleyad
  - **User:** username
  - **Password:** password
  - **Port:** 5432
- יוצרת volume לשמירת הנתונים

### בדיקה שPostgreSQL רץ:

\`\`\`powershell
docker ps
\`\`\`

אמור להופיע:
\`\`\`
CONTAINER ID   IMAGE              STATUS         PORTS                    NAMES
xxxxxxxxxxxx   postgres:15-alpine Up X seconds   0.0.0.0:5432->5432/tcp   meyadleyad-postgres
\`\`\`

---

## שלב 4: יצירת Prisma Client והרצת Migrations

לאחר שPostgreSQL רץ:

\`\`\`powershell
# עברי לתיקיית השרת
cd server

# צרי Prisma Client
npx prisma generate

# הריצי migration ראשונית (יוצרת את הטבלאות במסד)
npx prisma migrate dev --name init

# הריצי seed (ממלא נתונים ראשוניים)
npm run prisma:seed
\`\`\`

### מה קורה במהלך Seed?

הסקריפט `prisma/seed.ts` יוצר:

1. **3 משתמשים:**
   - **Admin:** admin@meyadleyad.com / admin123456
   - **Broker:** broker@example.com / broker123456
   - **User:** user@example.com / user123456

2. **קטגוריות ראשיות:**
   - נדל"ן, רכב, מוצרי חשמל, אופנה, ריהוט, משרות, שירותים

3. **ערים:**
   - ירושלים, תל אביב, חיפה, באר שבע, ועוד...

4. **מודעות לדוגמה** (5-10 מודעות בקטגוריות שונות)

---

## שלב 5: הפעלת השרת והלקוח

### טרמינל 1 - Server (Backend):
\`\`\`powershell
cd C:\Users\User\Desktop\meyadleyad\server
npm run dev
\`\`\`

השרת יעלה על: **http://localhost:5000**

### טרמינל 2 - Client (Frontend):
\`\`\`powershell
cd C:\Users\User\Desktop\meyadleyad\client
npm run dev
\`\`\`

הלקוח יעלה על: **http://localhost:3000**

---

## 📋 פקודות Docker שימושיות

\`\`\`powershell
# צפייה בכל ה-containers שרצים
docker ps

# צפייה בלוגים של PostgreSQL
docker logs meyadleyad-postgres

# צפייה בלוגים בזמן אמת
docker logs -f meyadleyad-postgres

# כניסה לתוך container של PostgreSQL (psql)
docker exec -it meyadleyad-postgres psql -U username -d meyadleyad

# עצירת PostgreSQL
docker compose down

# עצירה + מחיקת כל הנתונים (זהירות!)
docker compose down -v

# הפעלה מחדש של PostgreSQL
docker compose restart

# בדיקת תקינות PostgreSQL
docker exec meyadleyad-postgres pg_isready -U username -d meyadleyad
\`\`\`

---

## 🔧 בעיות נפוצות ופתרונות

### 1. Docker Desktop לא מתחיל:
**פתרון:**
- וודאי ש-WSL 2 מותקן (Docker Desktop מותקן אותו)
- הפעילי מחדש את המחשב
- נסי להריץ Docker Desktop **כמנהל**

### 2. Port 5432 תפוס:
\`\`\`powershell
# מצאי מה משתמש בפורט
netstat -ano | findstr :5432

# עצרי את התהליך (החליפי XXXX ב-PID שמצאת)
taskkill /PID XXXX /F
\`\`\`

### 3. Prisma migration נכשל:
\`\`\`powershell
# אפסי את המסד
cd server
npx prisma migrate reset

# זה ימחק הכל ויריץ מחדש migrations + seed
\`\`\`

### 4. "Error: P1001: Can't reach database server":
- וודאי ש-Docker Desktop **רץ** (אייקון ירוק)
- הריצי: `docker ps` - אמור להראות את `meyadleyad-postgres`
- בדקי את ה-`.env` - DATABASE_URL אמור להיות:
  \`\`\`
  DATABASE_URL="postgresql://username:password@localhost:5432/meyadleyad?schema=public"
  \`\`\`

### 5. Seed נכשל עם "Unique constraint failed":
הסקריפט כבר רץ. אם את רוצה להריץ שוב:
\`\`\`powershell
# מחקי נתונים קיימים
docker compose down -v
docker compose up -d

# המתיני 5 שניות
Start-Sleep -Seconds 5

# הריצי migrations + seed
cd server
npx prisma migrate deploy
npm run prisma:seed
\`\`\`

---

## 🎯 סקריפט אוטומטי (לאחר שDocker מותקן)

יצרתי עבורך סקריפט אוטומטי: **`start-docker.ps1`**

להפעלה:
\`\`\`powershell
cd C:\Users\User\Desktop\meyadleyad
.\start-docker.ps1
\`\`\`

הסקריפט:
1. בודק ש-Docker פועל
2. מפעיל PostgreSQL
3. יוצר Prisma Client
4. מריץ Migrations
5. מריץ Seed
6. מציג סיכום ומידע חשוב

---

## 📊 גישה למסד הנתונים

### דרך Prisma Studio (ממשק גרפי):
\`\`\`powershell
cd server
npx prisma studio
\`\`\`
נפתח בדפדפן: **http://localhost:5555**

### דרך psql (CLI):
\`\`\`powershell
docker exec -it meyadleyad-postgres psql -U username -d meyadleyad
\`\`\`

שאילתות לדוגמה:
\`\`\`sql
-- כל המשתמשים
SELECT id, email, name, role FROM "User";

-- כל המודעות
SELECT id, title, price, status FROM "Ad";

-- כל הקטגוריות
SELECT id, name, slug FROM "Category";
\`\`\`

יציאה מpsql: `\q`

---

## 🚀 מה הלאה?

לאחר שהכל רץ:

1. **פתחי דפדפן:** http://localhost:3000
2. **התחברי** עם אחד ממשתמשי הדמו
3. **נסי ליצור מודעה חדשה**
4. **בדקי את הפאנל Admin** (עם admin@meyadleyad.com)

---

## 📝 הערות חשובות

- **הנתונים נשמרים:** Docker Volume שומר את כל הנתונים גם כשאת עוצרת את ה-container
- **למחוק הכל:** `docker compose down -v` (המילה `-v` מוחקת גם את ה-volume)
- **גיבוי:** אפשר לייצא את המסד עם:
  \`\`\`powershell
  docker exec meyadleyad-postgres pg_dump -U username meyadleyad > backup.sql
  \`\`\`
- **שחזור גיבוי:**
  \`\`\`powershell
  Get-Content backup.sql | docker exec -i meyadleyad-postgres psql -U username -d meyadleyad
  \`\`\`

---

**בהצלחה! 🎉**

אם יש בעיות, הריצי את הפקודות צעד אחר צעד ושלחי לי את השגיאות.
