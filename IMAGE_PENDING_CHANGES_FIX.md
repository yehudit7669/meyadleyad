# ✅ תיקון: תמונות לא עולות לאתר עד אישור מנהל

## 🐛 הבעיה שזוהתה

כשמשתמש עורך מודעה מאושרת (ACTIVE) ומוסיף/משנה/מוחק תמונות, התמונות היו מתעדכנות **מיד באתר** לפני אישור מנהל! 

זה מנוגד למערכת השינויים הממתינים שבנינו.

---

## 🔍 מקור הבעיה

### 1. העלאת תמונות חדשות ישירות
**קובץ**: `client/src/services/api.ts - updateAd()`

הקוד היה מעלה תמונות חדשות **תמיד** אחרי עדכון המודעה:
```typescript
// ❌ קוד ישן - העלה תמונות ללא תנאי
if (data.images && data.images.length > 0) {
  const newImages = data.images.filter((img: any) => img.file);
  if (newImages.length > 0) {
    await api.post(`/ads/${ad.id}/images`, formData, ...);
  }
}
```

### 2. מחיקת תמונות קיימות ישירות
**קובץ**: `client/src/pages/EditAd.tsx - handleDeleteImage()`

הקוד היה מוחק תמונות **מיד** כשמשתמש לוחץ מחק:
```typescript
// ❌ קוד ישן - מחק תמונות ללא בדיקת סטטוס
const handleDeleteImage = async (imageId: string) => {
  await adsService.deleteImage(imageId);
}
```

---

## ✅ הפתרון

### 1. מניעת העלאת תמונות למודעות ACTIVE
**קובץ**: `client/src/services/api.ts`

```typescript
// ✅ קוד חדש - בודק סטטוס לפני העלאה
if (ad.status !== 'ACTIVE' && data.images && data.images.length > 0) {
  const newImages = data.images.filter((img: any) => img.file);
  if (newImages.length > 0) {
    // העלאת תמונות רק אם המודעה לא ACTIVE
    await api.post(`/ads/${ad.id}/images`, formData, ...);
  }
}
```

**תוצאה**: תמונות חדשות לא מועלות למודעות ACTIVE. במקום זאת, הן נשמרות כ-base64 ב-`pendingChanges`.

### 2. מניעת מחיקת תמונות ממודעות ACTIVE
**קובץ**: `client/src/pages/EditAd.tsx`

```typescript
// ✅ קוד חדש - בודק סטטוס לפני מחיקה
const handleDeleteImage = async (imageId: string) => {
  if (ad?.status === 'ACTIVE') {
    // לא מוחקים - השינויים יחכו לאישור מנהל
    return;
  }
  
  // רק אם המודעה לא מאושרת - מוחקים ישירות
  await adsService.deleteImage(imageId);
}
```

**תוצאה**: תמונות קיימות לא נמחקות מהשרת עד שהמנהל מאשר את השינויים.

### 3. המרת base64 לקבצים באישור מנהל
**קובץ**: `server/src/modules/admin/admin.service.ts - approvePendingChanges()`

```typescript
// ✅ קוד חדש - מעבד תמונות base64
if (pendingChanges.images && Array.isArray(pendingChanges.images)) {
  const processedImages = [];
  
  for (const img of pendingChanges.images) {
    let imageUrl = img.url;
    
    // אם התמונה היא base64 (תמונה חדשה שטרם הועלתה)
    if (imageUrl && imageUrl.startsWith('data:image')) {
      // המרת base64 לקובץ
      const base64Data = imageUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // שמירת הקובץ
      const filename = `${crypto.randomBytes(16).toString('hex')}.jpg`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      
      // עדכון ל-URL יחסי
      imageUrl = `/uploads/${filename}`;
    }
    
    processedImages.push({ adId, url: imageUrl, order: img.order ?? index });
  }
  
  // מחיקת תמונות ישנות
  await prisma.adImage.deleteMany({ where: { adId } });
  
  // יצירת תמונות חדשות
  await prisma.adImage.createMany({ data: processedImages });
}
```

**תוצאה**: כשמנהל מאשר, תמונות base64 מומרות לקבצים ונשמרות בשרת.

### 4. תצוגת תמונות ב-PendingChangesPage
**קובץ**: `client/src/pages/admin/PendingChangesPage.tsx`

```typescript
// ✅ Helper להמרת URL
const getFullImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url; // base64
  if (url.startsWith('http')) return url; // URL מלא
  // URL יחסי
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${baseUrl}${url}`;
};

// תצוגת תמונות נוכחיות
<img src={getFullImageUrl(img.url)} ... />

// תצוגת תמונות חדשות (כולל base64)
<img src={getFullImageUrl(img.url)} ... />
```

**תוצאה**: תמונות מוצגות נכון - גם URLs רגילים וגם base64.

---

## 🔄 תהליך העבודה המעודכן

### 1️⃣ משתמש מעדכן מודעה ACTIVE
- בוחר תמונות חדשות → נשמרות כ-base64 בזיכרון הדפדפן
- מוחק תמונות קיימות → המחיקה לא מתבצעת בשרת
- לוחץ "שמור שינויים"

### 2️⃣ הקליינט שולח את השינויים
```typescript
updateMutation.mutate({
  title: formData.title,
  description: formData.description,
  price: formData.price,
  // ...
  images: formData.images, // מכיל base64 של תמונות חדשות + URLs של קיימות
});
```

### 3️⃣ ה-API Service בודק סטטוס
```typescript
if (ad.status !== 'ACTIVE') {
  // העלאת תמונות חדשות רק אם המודעה לא ACTIVE
  await api.post(`/ads/${ad.id}/images`, formData);
}
```

### 4️⃣ השרת שומר ב-pendingChanges
```typescript
const pendingChanges = {
  ...data,
  images: data.images, // מכיל base64 + URLs
  requestedAt: new Date().toISOString(),
  requestedBy: userId,
};

await prisma.ad.update({
  where: { id: adId },
  data: {
    hasPendingChanges: true,
    pendingChanges: pendingChanges,
    pendingChangesAt: new Date(),
  },
});
```

**המודעה המקורית נשארת ללא שינוי!** ✅

### 5️⃣ מנהל רואה שינויים
- נכנס ל-"שינויים ממתינים"
- רואה השוואה:
  - תמונות נוכחיות (מהשרת)
  - תמונות חדשות (base64 preview)

### 6️⃣ מנהל מאשר
```typescript
// המרת base64 לקבצים
for (const img of pendingChanges.images) {
  if (img.url.startsWith('data:image')) {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    img.url = `/uploads/${filename}`;
  }
}

// עדכון התמונות במודעה
await prisma.adImage.deleteMany({ where: { adId } });
await prisma.adImage.createMany({ data: processedImages });
```

---

## 📁 קבצים שהשתנו

### Frontend
1. **client/src/services/api.ts**
   - תוספת בדיקת `ad.status !== 'ACTIVE'` לפני העלאת תמונות
   - תוספת `images` לבקשת PUT

2. **client/src/pages/EditAd.tsx**
   - תוספת בדיקת סטטוס ב-`handleDeleteImage()`

3. **client/src/pages/admin/PendingChangesPage.tsx**
   - תוספת `getFullImageUrl()` helper
   - שימוש בו לתצוגת תמונות

### Backend
1. **server/src/modules/admin/admin.service.ts**
   - import של `fs`, `path`, `crypto`
   - לוגיקת המרת base64 לקבצים ב-`approvePendingChanges()`

---

## ✅ תוצאה סופית

### לפני התיקון ❌
- משתמש מעדכן תמונות → **תמונות עולות מיד לאתר**
- משתמש מוחק תמונות → **תמונות נמחקות מיד**
- המודעה באתר משתנה לפני אישור מנהל

### אחרי התיקון ✅
- משתמש מעדכן תמונות → **נשמרות כ-base64 ב-pendingChanges**
- משתמש מוחק תמונות → **לא נמחקות עד אישור מנהל**
- המודעה באתר **נשארת ללא שינוי** עד אישור מנהל
- מנהל רואה **preview של תמונות חדשות**
- כשמנהל מאשר → **תמונות base64 מומרות לקבצים**

---

## 🎯 בדיקות שבוצעו

- [x] תמונות חדשות לא עולות למודעות ACTIVE
- [x] תמונות קיימות לא נמחקות ממודעות ACTIVE
- [x] תמונות base64 נשמרות ב-pendingChanges
- [x] תמונות מוצגות ב-PendingChangesPage (גם base64 וגם URLs)
- [x] כשמנהל מאשר - תמונות base64 מומרות לקבצים
- [x] כשמנהל מאשר - תמונות ישנות נמחקות ותמונות חדשות נוצרות

---

**תאריך תיקון**: 2026-02-09  
**גרסה**: 1.1.0  
**סטטוס**: ✅ תוקן במלואו
