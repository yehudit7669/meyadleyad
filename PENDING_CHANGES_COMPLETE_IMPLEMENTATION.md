# ✅ מערכת שינויים ממתינים - הטמעה מלאה

## 📋 סיכום

כשמשתמש עורך מודעה שכבר מאושרת (ACTIVE), המודעה המקורית נשארת באתר והשינויים נשמרים בנפרד להמתנה לאישור מנהל.

**כל שדה שניתן לערוך במודעה נשמר ומוצג למנהל להשוואה!** ✅

---

## 🔧 שדות שמטופלים

### שדות בסיסיים (ברמת Ad)
✅ **כותרת (title)** - כותרת המודעה  
✅ **תיאור (description)** - תיאור מלא של המודעה  
✅ **מחיר (price)** - מחיר המודעה  
✅ **כתובת (address)** - כתובת מדויקת  
✅ **שכונה (neighborhood)** - שם השכונה  
✅ **קטגוריה (categoryId)** - קטגוריית המודעה  
✅ **עיר (cityId)** - העיר בה נמצא הנכס  
✅ **רחוב (streetId)** - הרחוב בו נמצא הנכס  
✅ **תמונות (images)** - מערך של תמונות עם תצוגה מקדימה

### שדות מותאמים (customFields)
✅ **חדרים (rooms)** - מספר חדרים (נתמך חצאי חדר)  
✅ **קומה (floor)** - מספר הקומה  
✅ **שטח (squareMeters)** - שטח הנכס במ״ר  
✅ **מספר בית (houseNumber)** - מספר הבית ברחוב  
✅ **מצב הנכס (condition)** - חדש, מצוין, טוב, מתוחזק, משופץ, דרוש שיפוץ, ישן  
✅ **סוג נכס (propertyType)** - דירה, בית פרטי, דירת גן, פנטהאוז, דופלקס, סטודיו, קוטג׳, וילה, בית טורי  
✅ **ריהוט (furniture)** - ללא, חלקי, מלא, מרוהט, לא מרוהט  
✅ **ארנונה (arnona)** - תשלום ארנונה חודשי  
✅ **ועד בית (vaad)** - תשלום ועד בית חודשי  
✅ **תאריך כניסה (entryDate)** - תאריך כניסה מתוכנן  
✅ **שם איש קשר (contactName)** - שם איש קשר נוסף  
✅ **טלפון (contactPhone)** - טלפון איש קשר  
✅ **תוספת לכתובת (addressSupplement)** - פרטים נוספים לכתובת

### מאפיינים (features)
✅ **מעלית (elevator)**  
✅ **חניה (parking)**  
✅ **מחסן (storage)**  
✅ **מרפסת (balcony / sukkaBalcony)**  
✅ **חצר (yard)**  
✅ **מיזוג אוויר (airConditioning)**  
✅ **נוף (view)**  
✅ **יחידת דיור (housingUnit)**  
✅ **ממ״ד (safeRoom / mamad)**  
✅ **יחידת הורים (parentalUnit / masterUnit)**  
✅ **אופציה (hasOption)**

#### מאפיינים לדירות נופש/שבת:
✅ **פלטה (plata)**  
✅ **מיחם (urn)**  
✅ **מצעים (linens)**  
✅ **בריכה (pool)**  
✅ **משחקי ילדים (kidsGames)**  
✅ **מיטת תינוק (babyBed)**  
✅ **לינה בלבד (sleepingOnly)**

---

## 🎨 תצוגת השינויים למנהל

### עיצוב השוואת שדות
כל שדה שהשתנה מוצג בפורמט:

```
📋 שם השדה

נוכחי: ערך ישן (מוצג באדום עם קו חוצה)
חדש:   ערך חדש (מוצג בירוק מודגש)
```

### תצוגת תמונות
תמונות מוצגות עם:
- **ספירה**: "נוכחי: 5 תמונות" → "חדש: 7 תמונות"
- **תצוגה מקדימה**: grid של עד 6 תמונות ראשונות
- **תמונות נוכחיות**: opacity 50%, גבול רגיל
- **תמונות חדשות**: גבול ירוק, ללא opacity
- **סמן עוד תמונות**: אם יש יותר מ-6

---

## 🔄 תהליך העבודה

### 1️⃣ משתמש עורך מודעה מאושרת
```typescript
// client/src/pages/EditAd.tsx
updateMutation.mutate({
  title: formData.title,
  description: formData.description,
  price: formData.price,
  categoryId: formData.categoryId,
  adType: formData.adType,
  cityId: formData.cityId,
  streetId: formData.streetId,
  customFields: customFieldsToSave,
  images: formData.images,
});
```

### 2️⃣ השרת שומר לשינויים ממתינים
```typescript
// server/src/modules/ads/ads.service.ts - updateAd()
if (ad.status === AdStatus.ACTIVE) {
  const pendingChanges = {
    ...data,
    neighborhood,
    requestedAt: new Date().toISOString(),
    requestedBy: userId,
  };

  const updatedAd = await prisma.ad.update({
    where: { id: adId },
    data: {
      hasPendingChanges: true,
      pendingChanges: pendingChanges,
      pendingChangesAt: new Date(),
    },
    // ...
  });
}
```

**המודעה המקורית לא משתנה!** ✅

### 3️⃣ מנהל רואה שינויים ממתינים
- בדף המודעות הממתינות: `/admin/pending-changes`
- תג 🟠 מסומן על מודעות עם `hasPendingChanges: true`
- לחיצה על "הצג שינויים" פותחת מודאל השוואה

### 4️⃣ מנהל מאשר או דוחה

#### אישור שינויים:
```typescript
// server/src/modules/admin/admin.service.ts - approvePendingChanges()

// 1. עדכון תמונות (אם יש)
if (pendingChanges.images && Array.isArray(pendingChanges.images)) {
  await prisma.adImage.deleteMany({ where: { adId } });
  await prisma.adImage.createMany({
    data: pendingChanges.images.map((img, index) => ({
      adId,
      url: img.url,
      order: img.order ?? index,
    })),
  });
}

// 2. עדכון כל שאר השדות
const updatedAd = await prisma.ad.update({
  where: { id: adId },
  data: {
    title: pendingChanges.title || ad.title,
    description: pendingChanges.description ?? ad.description,
    price: pendingChanges.price ?? ad.price,
    categoryId: pendingChanges.categoryId || ad.categoryId,
    cityId: pendingChanges.cityId || ad.cityId,
    streetId: pendingChanges.streetId || ad.streetId,
    customFields: pendingChanges.customFields || ad.customFields,
    // ...
    hasPendingChanges: false,
    pendingChanges: null,
    pendingChangesAt: null,
  },
});
```

#### דחיית שינויים:
```typescript
// server/src/modules/admin/admin.service.ts - rejectPendingChanges()
const updatedAd = await prisma.ad.update({
  where: { id: adId },
  data: {
    hasPendingChanges: false,
    pendingChanges: null,
    pendingChangesAt: null,
  },
});
```

---

## 📁 קבצים שהשתנו

### Backend
1. **server/prisma/schema.prisma**
   - הוספת `hasPendingChanges: Boolean`
   - הוספת `pendingChanges: Json?`
   - הוספת `pendingChangesAt: DateTime?`

2. **server/src/modules/ads/ads.service.ts**
   - שינוי `updateAd()` לשמור ל-pendingChanges במקום עדכון ישיר
   - תמיכה בפרמטר `images` בטיפוס

3. **server/src/modules/admin/admin.service.ts**
   - `getAdsWithPendingChanges()` - מביא מודעות עם שינויים ממתינים
   - `approvePendingChanges()` - מאשר שינויים (כולל טיפול בתמונות)
   - `rejectPendingChanges()` - דוחה שינויים

4. **server/src/modules/admin/admin.controller.ts**
   - endpoints חדשים עבור פעולות שינויים ממתינים

5. **server/src/modules/admin/admin.routes.ts**
   - `GET /api/admin/ads/pending-changes`
   - `POST /api/admin/ads/:id/approve-changes`
   - `POST /api/admin/ads/:id/reject-changes`

### Frontend
1. **client/src/services/api.ts**
   - `getPendingChanges()`
   - `approvePendingChanges()`
   - `rejectPendingChanges()`

2. **client/src/pages/admin/PendingChangesPage.tsx**
   - דף מלא עם רשימה וחלון השוואה
   - תמיכה בכל השדות כולל תמונות
   - עיצוב "לפני ← אחרי"

3. **client/src/components/admin/AdminLayout.tsx**
   - פריט תפריט עם תג Badge למספר שינויים ממתינים

4. **client/src/App.tsx**
   - נתיב `/admin/pending-changes`

---

## ✅ בדיקות שבוצעו

- [x] כל השדות הבסיסיים נשמרים ב-pendingChanges
- [x] customFields נשמר כולל features
- [x] תמונות נשמרות ומוצגות
- [x] המודעה המקורית נשארת פעילה
- [x] מנהל רואה את כל השינויים
- [x] אישור מחיל את כל השינויים כולל תמונות
- [x] דחייה מוחקת את השינויים הממתינים
- [x] תצוגת השוואה ברורה עם עיצוב

---

## 🚀 איך להשתמש

### כמשתמש
1. עבור למודעה שלך שכבר מאושרת
2. לחץ "ערוך מודעה"
3. ערוך כל שדה שרוצה (כותרת, תיאור, מחיר, תמונות, וכו')
4. שמור
5. המודעה המקורית נשארת באתר ללא שינוי ✅
6. השינויים שלך ממתינים לאישור מנהל

### כמנהל
1. עבור ל-"שינויים ממתינים" בתפריט
2. רשימה של כל המודעות עם שינויים ממתינים
3. לחץ "הצג שינויים" על כל מודעה
4. ראה השוואה מדויקת של כל שדה שהשתנה
5. אשר או דחה

---

## 📊 סטטיסטיקה

**סה״כ שדות נתמכים**: 30+  
**כולל מאפיינים**: 20+  
**תמיכה בתמונות**: ✅ מלאה  
**תמיכה ב-customFields מקוננים**: ✅ features  

---

## 🎯 מטרות שהושגו

✅ **שמירת המודעה המקורית** - המודעה נשארת פעילה בדיוק כמו שהיא  
✅ **כיסוי מלא של שדות** - כל שדה שניתן לערוך נתמך  
✅ **תמונות מלאות** - כולל תצוגה מקדימה  
✅ **חוויית UX טובה** - השוואה ברורה עם צבעים  
✅ **בטיחות** - רק מנהל יכול לאשר/לדחות  

---

**תאריך יצירה**: 2026-01-14  
**גרסה**: 1.0.0  
**סטטוס**: ✅ הושלם במלואו
