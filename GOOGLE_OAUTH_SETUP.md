# 🔐 הגדרת התחברות עם Google OAuth

## מה הוסף למערכת?

המערכת כעת תומכת ב**התחברות והרשמה באמצעות Google** בנוסף להתחברות רגילה באימייל וסיסמה.

---

## ✅ מה כבר מוכן?

### Backend (Server)
- ✅ Route: `POST /api/auth/google` - מקבל `idToken` מגוגל
- ✅ `auth.service.ts` - פונקציית `googleAuth()` שמאמתת את ה-token
- ✅ תמיכה ב-`google-auth-library` (כבר מותקן)
- ✅ Schema במסד הנתונים - שדה `googleId` בטבלת User
- ✅ Validation schema ל-Google token

### Frontend (Client)
- ✅ `GoogleLoginButton` component - כפתור מעוצב להתחברות עם Google
- ✅ שילוב ב-`Login.tsx` וב-`Register.tsx`
- ✅ `GoogleOAuthProvider` ב-`App.tsx`
- ✅ `authService.googleAuth()` - שליחת token לשרת
- ✅ חבילת `@react-oauth/google` (נוספה ל-package.json)

---

## 🚀 מה צריך לעשות כדי להפעיל?

### שלב 1: קבלת Google Client ID

1. **עבור ל-[Google Cloud Console](https://console.cloud.google.com/)**

2. **צור פרויקט חדש** (או בחר קיים)
   - לחץ על התפריט העליון → "Select a project" → "New Project"
   - תן שם לפרויקט (למשל: "Meyadleyad")

3. **הפעל את Google+ API**
   - עבור ל-"APIs & Services" → "Library"
   - חפש "Google+ API" והפעל אותו

4. **צור OAuth 2.0 Credentials**
   - עבור ל-"APIs & Services" → "Credentials"
   - לחץ "Create Credentials" → "OAuth client ID"
   - בחר "Web application"
   
5. **הגדר Authorized JavaScript origins**
   ```
   http://localhost:3000
   http://localhost:5173
   https://your-production-domain.com
   ```

6. **הגדר Authorized redirect URIs** (אופציונלי לflow זה):
   ```
   http://localhost:3000
   http://localhost:5173
   ```

7. **שמור את ה-Client ID וה-Client Secret**

---

### שלב 2: עדכון קבצי .env

#### Server (.env)
```env
# OAuth Google
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET_HERE"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"
```

#### Client (.env)
```env
VITE_GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
```

> ⚠️ **חשוב**: ודא שאותו `Client ID` מופיע גם בשרת וגם בקליינט!

---

### שלב 3: התקנת התלויות

אם טרם הותקנו, הרץ:

```bash
# Client
cd client
npm install

# Server (google-auth-library כבר קיים)
cd ../server
npm install
```

---

### שלב 4: הרצת המערכת

```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client
cd client
npm run dev
```

---

## 🎯 איך זה עובד?

### תזרים ההתחברות:

1. **משתמש לוחץ על "התחבר עם Google"**
   - הכפתור מופיע הן ב-Login והן ב-Register
   
2. **Google פותח חלון popup להתחברות**
   - המשתמש מתחבר עם חשבון Google שלו
   - Google מחזיר `idToken` (JWT חתום)

3. **הקליינט שולח את ה-idToken לשרת**
   ```typescript
   POST /api/auth/google
   Body: { "token": "eyJhbGc..." }
   ```

4. **השרת מאמת את ה-token מול Google**
   - משתמש ב-`google-auth-library`
   - מוודא שה-token תקף ונחתם על ידי Google
   - מחלץ: email, name, picture, sub (Google ID)

5. **חיפוש/יצירת משתמש**
   - אם יש משתמש עם אותו email → מתחבר אליו
   - אם אין → יוצר משתמש חדש עם:
     - `googleId` = payload.sub
     - `isVerified` = true (כי Google כבר אימת את המייל)
     - `password` = null (אין סיסמה)

6. **יצירת JWT Tokens**
   - `accessToken` - בתוקף ל-15 דקות
   - `refreshToken` - בתוקף ל-7 ימים
   - נשמר ב-localStorage בצד הקליינט

7. **Redirect לפי תפקיד**
   - `ADMIN` → `/admin`
   - `BROKER` → `/profile`
   - `USER` → `/`

---

## 🔒 אבטחה

### מה המערכת עושה:
✅ **לא שומרת** את ה-Google idToken בדפדפן  
✅ **רק את ה-JWT שלך** נשמר ב-localStorage  
✅ **מאמתת** את ה-token מול Google בשרת  
✅ **בודקת** שה-email מאומת (`email_verified`)  
✅ **מחברת חשבונות** - אם יש משתמש עם אותו email  
✅ **Rate limiting** על ה-endpoint (אם הוגדר במערכת)  

### מה לא לעשות:
❌ לא לאפשר Google login אם email לא מאומת  
❌ לא ליצור כפילויות של משתמשים  
❌ לא לשמור Google tokens בדפדפן  

---

## 🧪 בדיקת התקנה

### 1. בדיקה בקליינט
- עבור ל-`http://localhost:3000/login` (או 5173)
- וודא שרואה כפתור **"התחבר עם Google"**
- וודא שרואה קו מפריד **"או"**
- הכפתור צריך להיות עם לוגו Google ומעוצב יפה

### 2. בדיקת Console
פתח את ה-Developer Tools:
```javascript
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
// צריך להדפיס את ה-Client ID שלך
```

### 3. בדיקת התחברות
- לחץ על הכפתור
- אמור להיפתח popup של Google
- אחרי התחברות → redirect לדף הבית
- בדוק ב-localStorage:
  ```javascript
  localStorage.getItem('accessToken')
  localStorage.getItem('user')
  ```

---

## 🐛 פתרון בעיות נפוצות

### בעיה: "Invalid Google token"
**פתרון:**
- ווודא שה-`GOOGLE_CLIENT_ID` בשרת תואם לזה בקליינט
- בדוק שה-Client ID תקף ב-Google Cloud Console
- ווודא שה-domain מורשה ב-"Authorized JavaScript origins"

### בעיה: הכפתור לא מופיע
**פתרון:**
- ווודא ש-`npm install` רץ בהצלחה
- בדוק שיש `VITE_GOOGLE_CLIENT_ID` ב-.env
- נסה לרענן את הדף (Ctrl+R)

### בעיה: "Popup blocked"
**פתרון:**
- אפשר popups בדפדפן עבור localhost
- או השתמש ב-redirect mode במקום popup

### בעיה: "Email already registered"
זה לא באמת בעיה! המערכת **מחברת** את החשבון הקיים לגוגל.

---

## 📊 מבנה טבלת User

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String?   // null אם התחבר דרך Google בלבד
  name          String
  googleId      String?   @unique  // Google sub (user ID)
  avatar        String?   // תמונת פרופיל מגוגל
  isVerified    Boolean   @default(false)  // true אם נרשם דרך Google
  role          UserRole  @default(USER)
  // ... שדות נוספים
}
```

---

## 🎨 עיצוב הכפתור

הכפתור משתמש ב-Google's official design guidelines:
- לוגו רשמי של Google
- צבעי Google (כחול, אדום, צהוב, ירוק)
- טקסט בעברית: "התחבר עם Google" / "הירשם עם Google"
- Responsive ומותאם למובייל

---

## 📝 קוד לדוגמה

### שימוש ב-GoogleLoginButton
```tsx
import GoogleLoginButton from '../components/GoogleLoginButton';

<GoogleLoginButton 
  onError={(error) => setError(error)}
  text="התחבר עם Google"
/>
```

### קריאה ידנית ל-API
```typescript
import { authService } from '../services/auth.service';

const response = await authService.googleAuth(idToken);
// response = { accessToken, refreshToken, user }
```

---

## 🚀 Production Deploy

בעת העלאה לפרודקשן:

1. **עדכן Authorized origins**:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```

2. **עדכן .env בשרת**:
   ```env
   GOOGLE_CLIENT_ID="production-client-id"
   GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"
   ```

3. **עדכן .env בקליינט**:
   ```env
   VITE_GOOGLE_CLIENT_ID="production-client-id"
   ```

---

## ✨ סיכום

המערכת כעת תומכת ב-3 דרכי התחברות:
1. **Email + Password** - התחברות רגילה
2. **Google OAuth** - התחברות מהירה עם Google
3. **Refresh Tokens** - התחברות מתמשכת

הכל משולב עם:
- ✅ JWT Authentication
- ✅ Refresh Tokens
- ✅ RBAC (Role-Based Access Control)
- ✅ אותה זרימה בדיוק לשני סוגי ההתחברות

**אין צורך לשנות כלום בארכיטקטורה הקיימת!** 🎉
