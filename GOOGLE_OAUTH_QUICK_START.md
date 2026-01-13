# התחברות עם Google - הוראות התקנה מהירות

## ✅ מה כבר מוכן?
הקוד כבר מוכן לחלוטין! צריך רק להגדיר את Google OAuth.

## 🚀 התקנה מהירה (3 צעדים)

### 1️⃣ התקן את החבילות

```bash
# Client
cd client
npm install

# Server - הכל כבר מותקן
cd ../server
npm install
```

### 2️⃣ קבל Google Client ID

1. עבור ל-[Google Cloud Console](https://console.cloud.google.com/)
2. צור פרויקט חדש
3. עבור ל-"APIs & Services" → "Credentials"
4. צור "OAuth 2.0 Client ID"
5. הוסף ל-"Authorized JavaScript origins":
   - `http://localhost:3000`
   - `http://localhost:5173`

### 3️⃣ עדכן קבצי .env

**Server (.env)**
```env
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
```

**Client (.env)**
```env
VITE_GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
```

## ▶️ הרצה

```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client
cd client
npm run dev
```

## 🎯 איפה זה נמצא?

- **Login Page**: `http://localhost:3000/login`
- **Register Page**: `http://localhost:3000/register`

תראה כפתור "התחבר עם Google" בשני הדפים.

---

📖 **הוראות מפורטות**: ראה [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
