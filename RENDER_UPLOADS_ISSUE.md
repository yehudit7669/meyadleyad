# 🚨 בעיית העלאת קבצים ב־Render (Ephemeral Storage)

## 📋 סיכום הבעיה

ב־Render, הקבצים שמועלים לתיקייה `uploads/` **נמחקים לאחר כל deploy או restart** של השרת.
זה קורה מכיוון ש־Render משתמש ב־**Ephemeral Storage** - אחסון זמני שלא נשמר בין deployments.

### התסמינים:
- ✅ העלאת קבצים עובדת בהתחלה
- ❌ אחרי deploy/restart - הקבצים נעלמים
- ❌ שגיאה בדפדפן: `net::ERR_EMPTY_RESPONSE`
- ❌ נתיב לא תואם: `/project/src/server/uploads` במקום `/opt/render/project/src/uploads`

---

## ✅ מה תוקן

### 1. תיקון נתיב ה־uploads
**קובץ:** [server/src/app.ts](server/src/app.ts#L122-L126)

```typescript
// Before (שגוי):
const uploadsPath = path.join(__dirname, '../uploads');

// After (תוקן):
const uploadsPath = path.resolve(process.cwd(), 'uploads');
```

**למה?** 
- `__dirname` מצביע על `/project/src/server/dist` (אחרי build)
- `process.cwd()` מצביע על `/project/src/server` (root של הפרויקט)
- עכשיו הקבצים נשמרים ב־`/project/src/server/uploads` ונגישים דרך `/uploads/...`

### 2. תיקון config.upload.dir
**קובץ:** [server/src/config/index.ts](server/src/config/index.ts#L68-L72)

```typescript
// Before:
dir: process.env.UPLOAD_DIR || './uploads',

// After:
dir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
```

**למה?** נתיבים יחסיים (`./uploads`) עלולים להשתנות בהתאם לתיקייה הנוכחית.

### 3. אימות middleware
✅ אין middleware של auth שחוסם גישה ל־`/uploads`
✅ performanceMonitor מדלג על `/uploads/` כדי לא להאט גישה לקבצים סטטיים

---

## ⚠️ הבעיה המרכזית: Ephemeral Storage

### מה קורה ב־Render?
1. משתמש מעלה תמונה → נשמרת ב־`uploads/`
2. Deploy חדש או restart → התיקייה `uploads/` נמחקת
3. התמונות נעלמות - אבל ה־URLs עדיין בדאטהבייס
4. בדפדפן: 404 או ERR_EMPTY_RESPONSE

### למה זה קורה?
Render (כמו רוב ספקי PaaS) משתמש ב־**containers** שמתחדשים כל deploy.
הכל שנמצא מחוץ לקוד המקור (כמו `uploads/`) **לא נשמר**.

---

## 🔧 פתרונות אפשריים

### אפשרות 1: Render Persistent Disk (מומלץ לטווח קצר) 💰
**עלות:** ~$1/GB לחודש
**יתרונות:**
- פשוט להגדרה
- ללא שינויים בקוד
- מתאים לכמות קבצים קטנה-בינונית

**איך להגדיר:**
1. Render Dashboard → Service → Settings
2. **Disks** → **Add Disk**
3. שם: `uploads-disk`
4. Mount Path: `/opt/render/project/src/server/uploads`
5. גודל: התחל עם 1GB

**חסרונות:**
- עלות גדלה ככל שמעלים יותר קבצים
- קשה לשתף קבצים בין instances
- גיבוי ידני

---

### אפשרות 2: AWS S3 / Cloudinary (מומלץ!) ☁️
**עלות:** AWS S3 Free Tier: 5GB, Cloudinary Free: 25GB
**יתרונות:**
- ✅ אחסון בענן מקצועי
- ✅ CDN מובנה (מהירות גבוהה)
- ✅ אופטימיזציה אוטומטית של תמונות
- ✅ גיבוי אוטומטי
- ✅ ללא הגבלה על מספר instances

**דוגמאות קוד:**

#### Cloudinary (קל יותר להתחלה):
```bash
npm install cloudinary multer-storage-cloudinary
```

```typescript
// server/src/middlewares/upload.cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'meyadleyad',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1920, quality: 'auto' }],
  } as any,
});

export const uploadToCloud = multer({ storage });
```

#### AWS S3:
```bash
npm install @aws-sdk/client-s3 multer-s3
```

```typescript
// server/src/middlewares/upload.s3.ts
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import multer from 'multer';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET!,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (_req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `uploads/${uniqueSuffix}-${file.originalname}`);
  },
});

export const uploadToS3 = multer({ storage });
```

**משתנים נדרשים ב־.env:**
```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3
AWS_REGION=us-east-1
AWS_BUCKET=meyadleyad-uploads
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

---

### אפשרות 3: Supabase Storage (חינמי!) 🆓
**עלות:** 1GB חינם, $0.021/GB אחר כך
**יתרונות:**
- ✅ דומה ל־S3 אבל יותר פשוט
- ✅ Free tier נדיב
- ✅ תמיכה ב־CDN

```bash
npm install @supabase/supabase-js
```

```typescript
// server/src/services/supabase-storage.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function uploadToSupabase(
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> {
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('meyadleyad')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('meyadleyad')
    .getPublicUrl(filePath);

  return publicUrl;
}
```

---

## 📊 השוואת פתרונות

| פתרון | עלות חודשית | קלות יישום | מהירות | גיבוי | מומלץ ל- |
|--------|-------------|------------|---------|-------|----------|
| **Render Disk** | $1-5 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ ידני | פיילוט / MVP |
| **Cloudinary** | $0-25 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ כן | תמונות (recommended!) |
| **AWS S3** | $0-5 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ כן | כל סוג קובץ |
| **Supabase** | $0-2 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ כן | all-in-one solution |

---

## 🎯 המליצה שלי

### לטווח הקצר (עכשיו):
✅ **הוסף Render Persistent Disk** - תוקן תוך 5 דקות, ללא שינויי קוד

### לטווח הארוך (בתוך שבוע-שבועיים):
✅ **עבור ל־Cloudinary** - אופטימלי לתמונות, free tier נדיב, CDN מהיר

---

## 🔍 בדיקת תקינות

אחרי שתתקן:

1. **בדוק נתיב uploads:**
```bash
# SSH ל־Render
ls -la /opt/render/project/src/server/uploads/
```

2. **בדוק שהשרת רואה את הנתיב:**
הוסף לוג ל־[server/src/app.ts](server/src/app.ts):
```typescript
console.log('📁 Serving static files from:', uploadsPath);
console.log('📁 Directory exists:', fs.existsSync(uploadsPath));
```

3. **העלה קובץ ובדוק ב־DB:**
```sql
SELECT "imageUrl", "floorPlanUrl", "images" 
FROM "Property" 
WHERE "imageUrl" IS NOT NULL 
LIMIT 5;
```

4. **נסה לגשת לקובץ:**
```
https://meyadleyad.onrender.com/uploads/1234567890-image.png
```

---

## 📞 זקוקה לעזרה?

אם משהו לא עובד אחרי התיקונים:
1. שלחי לי את הלוגים מ־Render
2. שלחי צילום מסך של הבעיה
3. נבדוק ביחד איזה פתרון הכי מתאים

---

**עודכן:** 29 ינואר 2026
**סטטוס:** ✅ נתיבים תוקנו | ⚠️ צריך להוסיף Persistent Disk או Cloud Storage
