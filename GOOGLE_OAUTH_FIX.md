# 🔧 פתרון שגיאת "OAuth client was not found"

## הבעיה שתוקנה

היית מקבלת שגיאה:
```
The OAuth client was not found.
שגיאה 401: invalid_client
```

## מה היה הגורם?

קובץ `.env` בצד הקליינט היה מכיל:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id  # ❌ placeholder
```

## מה תוקן?

✅ עודכן `.env` עם ה-Client ID האמיתי:
```env
VITE_GOOGLE_CLIENT_ID=842896070926-f87c8ji5conqhi3473nav5tlr7aek2na.apps.googleusercontent.com
```

✅ נוסף console.log ב-`App.tsx` לאימות:
```typescript
console.log('GOOGLE CLIENT ID EXISTS:', !!googleClientId);
console.log('GOOGLE CLIENT ID LENGTH:', googleClientId?.length || 0);
```

## 🚀 מה לעשות עכשיו?

### 1. הפסק את שרת הפיתוח (Ctrl+C)

### 2. הרץ מחדש:
```bash
cd client
npm run dev
```

### 3. פתח את הדפדפן ב-http://localhost:5173 (או 3000)

### 4. פתח Developer Console (F12) ובדוק:
```
GOOGLE CLIENT ID EXISTS: true
GOOGLE CLIENT ID LENGTH: 72  # (או מספר דומה)
```

### 5. נסה להתחבר עם Google

---

## ⚠️ חשוב לזכור

**Vite לא טוען משתני .env באופן אוטומטי כשהם משתנים!**

אחרי כל שינוי ב-`.env` צריך:
1. להפסיק את `npm run dev` (Ctrl+C)
2. להריץ שוב `npm run dev`

---

## ✅ האם זה עובד עכשיו?

אחרי הריצה מחדש, כפתור "התחבר עם Google" אמור לעבוד תקין!

אם עדיין יש בעיה, בדוק שה-Client ID בשרת (`.env`) תואם לזה בקליינט.
