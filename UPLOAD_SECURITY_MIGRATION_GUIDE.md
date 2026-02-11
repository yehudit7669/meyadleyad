# 🔄 Migration Guide - Upload Security

## למפתחים: איך לעדכן routes קיימים (אופציונלי)

---

## ⚠️ חשוב להבהיר

**אין צורך לשנות כלום!** הקוד הקיים עובד בדיוק כמו קודם.

המדריך הזה **אופציונלי** - רק אם רוצים להוסיף אבטחה מוגברת.

---

## 📋 Before & After Examples

### 1. Upload Images (ads.routes.ts)

#### Before (עובד כמו קודם):
```typescript
import { upload } from '../../middlewares/upload';

router.post('/:id/images', 
  authenticate, 
  upload.array('images', 10), 
  adsController.uploadImages
);
```

#### After (אבטחה מוגברת):
```typescript
import { secureImageUpload } from '../../middlewares/upload';

router.post('/:id/images', 
  authenticate, 
  secureImageUpload.middleware.array('images', 10),
  secureImageUpload.validate,
  adsController.uploadImages
);
```

**מה השתנה?**
- ✅ Magic bytes validation
- ✅ Optional virus scanning
- ✅ Security logging

---

### 2. Upload Floor Plan

#### Before:
```typescript
import { uploadFloorPlan } from '../../middlewares/upload';

router.post('/floor-plan', 
  authenticate, 
  uploadFloorPlan.single('file'), 
  controller.uploadFloorPlan
);
```

#### After:
```typescript
import { secureFloorPlanUpload } from '../../middlewares/upload';

router.post('/floor-plan', 
  authenticate, 
  secureFloorPlanUpload.middleware.single('file'),
  secureFloorPlanUpload.validate,
  controller.uploadFloorPlan
);
```

---

### 3. Upload File (PDF or Image)

#### Before:
```typescript
import { uploadFile } from '../../middlewares/upload';

router.post('/file', 
  authenticate, 
  uploadFile.single('file'), 
  controller.uploadFile
);
```

#### After:
```typescript
import { secureFileUpload } from '../../middlewares/upload';

router.post('/file', 
  authenticate, 
  secureFileUpload.middleware.single('file'),
  secureFileUpload.validate,
  controller.uploadFile
);
```

---

### 4. Custom File Types

אם צריך סוגי קבצים מיוחדים:

#### Before:
```typescript
import { uploadFloorPlan } from '../../middlewares/upload';

router.post('/document', 
  authenticate, 
  uploadFloorPlan.single('file'),  // מאפשר PDF + תמונות
  controller.uploadDocument
);
```

#### After (custom validation):
```typescript
import { uploadFloorPlan, secureUpload } from '../../middlewares/upload';

router.post('/document', 
  authenticate, 
  uploadFloorPlan.single('file'),
  secureUpload([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]),
  controller.uploadDocument
);
```

---

## 🎯 Migration Strategy

### שלב 1: בדוק שהכל עובד (לא לשנות כלום)
```bash
cd server
npm install
npm run dev
```

✅ הכל צריך לעבוד כמו קודם

---

### שלב 2: עדכן routes חדשים (אופציונלי)

עדכן רק **routes חדשים** שאתה מוסיף:

```typescript
// New route - use secure upload from the start
import { secureImageUpload } from '../../middlewares/upload';

router.post('/new-upload', 
  authenticate,
  secureImageUpload.middleware.array('images', 5),
  secureImageUpload.validate,
  controller.newUpload
);
```

---

### שלב 3: עדכן routes קיימים בהדרגה (אופציונלי)

רק אם רוצים, עדכנו route אחד בכל פעם:

```typescript
// OLD (עובד)
router.post('/upload', upload.single('file'), handler);

// NEW (מאובטח יותר)
router.post('/upload', 
  secureImageUpload.middleware.single('file'),
  secureImageUpload.validate,
  handler
);
```

בדקו שהכל עובד לפני המשך.

---

## 📝 Checklist למי שרוצה לעדכן

### לפני העדכון:
- [ ] וודא ש-`npm install` רץ
- [ ] וודא ש-build עובר: `npm run build`
- [ ] וודא ש-server עולה: `npm run dev`
- [ ] בדוק שהעלאת קבצים עובדת (לא לשנות כלום!)

### בזמן העדכון:
- [ ] עדכן import: `secureImageUpload` במקום `upload`
- [ ] החלף middleware: `secureImageUpload.middleware.array(...)`
- [ ] הוסף validation: `secureImageUpload.validate`
- [ ] בדוק שה-route עובד
- [ ] בדוק שהעלאה תקינה עובדת
- [ ] נסה להעלות קובץ מזויף (צריך להידחות)

### אחרי העדכון:
- [ ] בדוק לוגים: `🔒 [SECURITY]` אמור להופיע
- [ ] נסה upload תקין - צריך לעבור
- [ ] נסה upload לא תקין - צריך להידחות
- [ ] וודא שהמערכת יציבה

---

## 🧪 Testing Checklist

### Test 1: Upload תקין
```bash
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@real_photo.jpg"
```
צפוי: ✅ **200 OK**

### Test 2: Fake extension
```bash
cp virus.exe fake.jpg
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@fake.jpg"
```
צפוי: ❌ **400 Bad Request**
לוג: `🔒 [SECURITY] MIME_MISMATCH`

### Test 3: Text file as image
```bash
echo "This is not an image" > fake.jpg
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@fake.jpg"
```
צפוי: ❌ **400 Bad Request**
לוג: `🔒 [SECURITY] FILE_REJECTED`

---

## 🚨 אם משהו נשבר

### אופציה 1: חזור למקור
```typescript
// פשוט תחזור ל-import הישן
import { upload } from '../../middlewares/upload';

router.post('/upload', upload.single('file'), handler);
```

הכל יעבוד בדיוק כמו קודם!

### אופציה 2: בדוק טעויות נפוצות

#### שגיאה: "Cannot find module 'file-type'"
```bash
npm install file-type@19.0.0
```

#### שגיאה: "secureImageUpload is not a function"
```typescript
// לא נכון:
secureImageUpload.array('images', 10)

// נכון:
secureImageUpload.middleware.array('images', 10)
```

#### שגיאה: "Validation failed"
וודא שהוספת את ה-middleware:
```typescript
router.post('/upload',
  secureImageUpload.middleware.single('file'),
  secureImageUpload.validate,  // ← חשוב!
  handler
);
```

---

## 📊 עדיפות עדכון (אם רוצים)

### עדיפות גבוהה:
1. ✅ Admin import routes - **כבר עודכנו!**
2. ⚠️ Sensitive uploads (ID documents, contracts)
3. ⚠️ Public uploads (user-generated content)

### עדיפות בינונית:
4. Images for ads
5. Profile pictures
6. Floor plans

### עדיפות נמוכה:
7. Internal tools
8. Dev/test routes
9. Legacy features

---

## ✅ המלצות

### עבור Prod:
1. ✅ השתמש ב-`secureImageUpload` לכל route חדש
2. ✅ עדכן routes רגישים (sensitive data)
3. ⚠️ שקול ClamAV בשרתי production
4. ✅ מעקב אחר לוגים `🔒 [SECURITY]`

### עבור Dev:
1. ✅ השאר קוד קיים כמו שהוא
2. ✅ השתמש ב-secure uploads לפיצ'רים חדשים
3. ℹ️  ClamAV לא נדרש

---

## 🎯 סיכום

### מה חובה:
- ✅ `npm install` - **פעם אחת**
- ✅ שום דבר אחר!

### מה אופציונלי:
- עדכון routes ל-`secureImageUpload`
- הפעלת ClamAV בפרודקשן
- מעקב אחר security logs

### מה עובד ממילא:
- ✅ כל הקוד הקיים
- ✅ Magic bytes validation (אוטומטי)
- ✅ Security logging (אוטומטי)

---

**זכור: אין חובה לשנות כלום. הכל עובד כמו קודם!** ✅
