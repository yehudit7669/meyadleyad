# 🗺️ הגדרת Google Maps API

## בעיה נוכחית
המפה מציגה רק כפתור ולא מפה אמיתית כי **אין Google Maps API Key תקין**.

## פתרון מלא (5 דקות)

### שלב 1: יצירת API Key
1. היכנס ל: https://console.cloud.google.com
2. צור פרויקט חדש או בחר קיים
3. לך ל: **APIs & Services** → **Credentials**
4. לחץ **Create Credentials** → **API Key**
5. העתק את ה-API Key

### שלב 2: הפעלת APIs נדרשים
1. לך ל: **APIs & Services** → **Library**
2. חפש והפעל:
   - ✅ **Maps JavaScript API**
   - ✅ **Geocoding API**
   - ✅ **Places API** (אופציונלי)

### שלב 3: הפעלת Billing
⚠️ **חובה!** Google Maps דורש הפעלת Billing גם ל-Free Tier

1. לך ל: **Billing**
2. הוסף כרטיס אשראי
3. Google נותנת $200 חינם לחודש
4. אם אתה תחת הגבול - לא תחויב

### שלב 4: הגדרת API Key במערכת
1. פתח את הקובץ: `client/.env`
2. החלף:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```
   ל:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyC... (ה-Key שלך)
   ```

### שלב 5: הפעלה מחדש
```powershell
# עצור את השרת (Ctrl+C)
cd client
npm run dev
```

## בדיקת תקינות

פתח את הדפדפן והקלד `F12` (Console), תראה:

### ✅ כשהכל עובד:
```
🔑 Has valid API key: true
🗺️ Maps API Loaded: true
✅ RENDERING GOOGLE MAP
📍 Coordinates: {lat: 31.7683, lng: 35.2137}
```

### ❌ כשיש בעיה:
```
🔑 Has valid API key: false
❌ Google Maps load error: InvalidKeyMapError
```

**אם אתה רואה שגיאה:**
- `InvalidKeyMapError` → API Key לא תקין
- `RefererNotAllowedMapError` → הגבלת Domain (הסר בהגדרות API Key)
- `BillingNotEnabledMapError` → חייב להפעיל Billing

## תוצאה צפויה

אחרי הפעלת API Key תקין, תראה:
- ✅ מפת Google אמיתית (לא כפתור)
- ✅ Tiles (האריחים של המפה)
- ✅ Marker אדום על המיקום
- ✅ אפשרות להגדיל/להקטין
- ✅ Street View

## מחירים
- **$0-200/חודש:** חינם לחלוטין (Google נותנת $200 credit)
- **מעל $200/חודש:** $7 ל-1000 טעינות מפה

לרוב האתרים הקטנים - זה **חינם לחלוטין**.

## בעיות נפוצות

### לא רואה מפה, רק כפתור
**סיבה:** API Key לא תקין או לא מוגדר
**פתרון:** בדוק Console, תראה `🔑 Has valid API key: false`

### שגיאה "InvalidKeyMapError"
**סיבה:** API Key לא נכון או לא הופעל Maps JavaScript API
**פתרון:** בדוק שה-Key נכון והפעלת Maps JavaScript API

### שגיאה "BillingNotEnabledMapError"
**סיבה:** לא הופעל Billing בפרויקט
**פתרון:** חובה להוסיף כרטיס אשראי (אבל לא תחויב תחת $200/חודש)

## תמיכה
אם משהו לא עובד:
1. פתח Console (F12)
2. העתק את השגיאות
3. בדוק שה-API Key מוגדר נכון ב `.env`
