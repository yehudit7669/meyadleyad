# הוראות להרצת Prisma Migration

## 1. הרצת Migration

```bash
cd server
npx prisma migrate dev --name add_import_tracking_fields
```

## 2. יצירת Prisma Client
```bash
npx prisma generate
```

## 3. הפעלת השרת מחדש
```bash
npm run dev
```

## הערות
- Migration זה מוסיף את השדות `importedItemIds` ו-`metadata` ל-ImportLog
- אם יש שגיאה של TypeScript על השדות החדשים, הפעל את `npx prisma generate` שוב
