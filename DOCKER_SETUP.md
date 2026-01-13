# �️ הגדרת PostgreSQL למערכת

## דרישות מוקדמות

וודא שמותקנים:
- PostgreSQL 14+ (הורד מ-https://www.postgresql.org/download/windows/)
- Node.js 18+
- npm או yarn

## אופציה 1: PostgreSQL מקומי (Windows)

### התקנת PostgreSQL

1. הורד והתקן PostgreSQL מ-https://www.postgresql.org/download/windows/
2. במהלך ההתקנה, זכור את הסיסמה ל-postgres superuser
3. וודא שהפורט הוא 5432 (ברירת מחדל)

### יצירת מסד נתונים

פתח PowerShell והרץ:

```powershell
# התחבר ל-PostgreSQL (הקלד את הסיסמה שהגדרת)
psql -U postgres

# בתוך psql, צור משתמש ומסד נתונים:
CREATE USER username WITH PASSWORD 'password';
CREATE DATABASE meyadleyad OWNER username;
GRANT ALL PRIVILEGES ON DATABASE meyadleyad TO username;
\q
```

או בפקודה אחת:

```powershell
$env:PGPASSWORD='YourPostgresPassword'; psql -U postgres -c "CREATE USER username WITH PASSWORD 'password';"
$env:PGPASSWORD='YourPostgresPassword'; psql -U postgres -c "CREATE DATABASE meyadleyad OWNER username;"
$env:PGPASSWORD='YourPostgresPassword'; psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE meyadleyad TO username;"
```

### עדכן את .env

הקובץ `server/.env` כבר מוגדר נכון:
```
DATABASE_URL="postgresql://username:password@localhost:5432/meyadleyad?schema=public"
```

## אופציה 2: Docker (אם Docker Desktop מותקן)

### דרישות מוקדמות

- Docker Desktop for Windows
- Node.js 18+
- npm או yarn

## שלב 1: הפעלת PostgreSQL ב-Docker

### הפעל את הקונטיינר:

```powershell
# מתיקיית הפרויקט הראשית
docker compose up -d
```

הפקודה הזו:
- מורידה את image של PostgreSQL 15 (אם לא קיים)
- יוצרת קונטיינר בשם `meyadleyad-postgres`
- מגדירה מסד נתונים: `meyadleyad`
- משתמש: `username`, סיסמה: `password`
- חושפת פורט 5432 למחשב המקומי
- שומרת נתונים ב-volume קבוע `postgres_data`

### בדוק שהקונטיינר רץ:

```powershell
docker ps
```

אתה אמור לראות:
```
CONTAINER ID   IMAGE              PORTS                    NAMES
xxxxx          postgres:15-alpine 0.0.0.0:5432->5432/tcp   meyadleyad-postgres
```

### בדוק בריאות מסד הנתונים:

```powershell
docker compose exec postgres pg_isready -U username -d meyadleyad
```

תשובה מצופה: `meyadleyad:5432 - accepting connections`

## שלב 2: יצירת Prisma Client

עבור לתיקיית השרת:

```powershell
cd server
```

### צור את Prisma Client:

```powershell
npx prisma generate
```

זה יוצר את הקוד המחובר לסכימה שהגדרת ב-`prisma/schema.prisma`

## שלב 3: הרצת מיגרציה ראשונית

```powershell
npx prisma migrate dev --name init
```

הפקודה הזו:
1. יוצרת את כל הטבלאות במסד הנתונים
2. מיישמת את הסכימה מ-`schema.prisma`
3. שומרת קובץ מיגרציה ב-`prisma/migrations/`
4. מריצה אוטומטית את `prisma generate`

## שלב 4: מילוי נתונים ראשוניים (Seed)

```powershell
npm run prisma:seed
```

הפקודה הזו:
- מריצה את `prisma/seed.ts`
- יוצרת משתמשי דמו:
  - **Admin**: admin@meyadleyad.com / admin123456
  - **Broker**: broker@example.com / broker123456
  - **User**: user@example.com / user123456
- יוצרת קטגוריות ראשוניות (נדל"ן, רכב, משרות וכו')
- יוצרת ערים (ירושלים, תל אביב, חיפה וכו')

## שלב 5: הפעלת השרת

```powershell
npm run dev
```

השרת יתחיל על `http://localhost:5000`

## פקודות Docker שימושיות

### עצירת הקונטיינר:
```powershell
docker compose down
```

### עצירה + מחיקת נתונים:
```powershell
docker compose down -v
```
⚠️ זה ימחק את כל הנתונים במסד!

### כניסה לקונטיינר:
```powershell
docker compose exec postgres psql -U username -d meyadleyad
```

### צפייה בלוגים:
```powershell
docker compose logs -f postgres
```

### איפוס מלא (מחיקה + יצירה מחדש):
```powershell
docker compose down -v
docker compose up -d
cd server
npx prisma migrate dev --name init
npm run prisma:seed
```

## גישה למסד הנתונים

### מחוץ ל-Docker (מהמחשב שלך):
```
Host: localhost
Port: 5432
Database: meyadleyad
User: username
Password: password
```

### כתובת חיבור מלאה:
```
postgresql://username:password@localhost:5432/meyadleyad?schema=public
```

## בדיקת תקינות המערכת

```powershell
# בדוק שהקונטיינר רץ
docker ps | Select-String "meyadleyad-postgres"

# בדוק חיבור למסד
docker compose exec postgres psql -U username -d meyadleyad -c "\dt"
```

אם הכל עובד, תראה רשימה של טבלאות: User, Ad, Category, City, וכו'

## פתרון בעיות נפוצות

### שגיאת "port 5432 is already allocated":
```powershell
# בדוק מי משתמש בפורט
Get-NetTCPConnection -LocalPort 5432

# עצור PostgreSQL מקומי אם רץ
Stop-Service postgresql-x64-*

# או שנה את הפורט ב-docker-compose.yml ל-5433:5432
```

### שגיאת "relation does not exist":
```powershell
# הרץ מיגרציה שוב
cd server
npx prisma migrate reset
npm run prisma:seed
```

### Prisma Client לא מזהה שינויים:
```powershell
npx prisma generate
```

## תרשים זרימה

```
docker compose up -d
     ↓
PostgreSQL Container רץ על port 5432
     ↓
npx prisma generate
     ↓
npx prisma migrate dev --name init
     ↓
npm run prisma:seed
     ↓
npm run dev (Server מוכן!)
```

## שמירת נתונים

הנתונים נשמרים ב-Docker volume בשם `postgres_data`.
כל עוד לא מריצים `docker compose down -v`, הנתונים נשארים גם לאחר:
- עצירת הקונטיינר
- הפעלה מחדש של המחשב
- עדכון קוד

## סיכום

### עבור PostgreSQL מקומי:

1. **הפעלה ראשונית**:
   ```powershell
   # צור משתמש ומסד נתונים (פעם אחת)
   $env:PGPASSWORD='YourPostgresPassword'; psql -U postgres -c "CREATE USER username WITH PASSWORD 'password';"
   $env:PGPASSWORD='YourPostgresPassword'; psql -U postgres -c "CREATE DATABASE meyadleyad OWNER username;"
   
   # הרץ מיגרציות
   cd server
   npx prisma generate
   npx prisma migrate dev --name init
   npm run prisma:seed
   npm run dev
   ```

2. **עבודה יומית**:
   ```powershell
   cd server
   npm run dev
   ```

3. **איפוס מסד נתונים**:
   ```powershell
   cd server
   npx prisma migrate reset
   npm run prisma:seed
   ```

### עבור Docker:

1. **הפעלה ראשונית**:
   ```powershell
   docker compose up -d
   cd server
   npx prisma generate
   npx prisma migrate dev --name init
   npm run prisma:seed
   npm run dev
   ```

2. **עבודה יומית**:
   ```powershell
   docker compose up -d  # אם הקונטיינר לא רץ
   cd server
   npm run dev
   ```

3. **איפוס מלא**:
   ```powershell
   docker compose down -v
   docker compose up -d
   cd server
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```

✅ עכשיו יש לך PostgreSQL מוכן לעבודה!
