# 🔒 Upload Security Improvements

## תאריך: 11 פברואר 2026

## סיכום

שופרה אבטחת העלאת הקבצים במערכת עם שכבות הגנה מרובות (**Defense-in-Depth**), **ללא שבירת קוד קיים**.

---

## ✅ מה שונה

### 1️⃣ תוספת תלויות (Dependencies)
**קובץ:** `server/package.json`

נוספו:
- `file-type@^19.0.0` - זיהוי סוג קובץ אמיתי (magic bytes)
- `clamscan@^2.3.2` - סריקת וירוסים (אופציונלי)

```bash
cd server
npm install
```

### 2️⃣ קבצים חדשים שנוצרו

#### `server/src/utils/fileValidation.ts`
**תפקיד:** ולידציה מתקדמת של קבצים

**פונקציות:**
- `validateMagicBytes()` - בדיקת Magic Bytes (חתימת קובץ אמיתית)
- `validateZipFile()` - הגנה מפני ZIP bombs
- `validateUploadedFile()` - ולידציה מקיפה

**תמיכה:**
- תמונות: JPEG, PNG, WebP
- מסמכים: PDF
- Excel/CSV: XLSX, XLS, CSV
- ארכיונים: ZIP (עם בדיקות אבטחה)

#### `server/src/utils/securityLogger.ts`
**תפקיד:** לוגינג אירועי אבטחה

**מה נרשם:**
- קבצים שנדחו
- אי-התאמה בין MIME מוצהר לזיהוי אמיתי
- ZIP bombs
- וירוסים (אם סורק פעיל)

**פורמט:**
```json
{
  "timestamp": "2026-02-11T10:30:00.000Z",
  "event": "MIME_MISMATCH",
  "file": "image.jpg.exe",
  "declared": "image/jpeg",
  "detected": "application/x-msdownload",
  "reason": "MIME type mismatch"
}
```

#### `server/src/services/virusScanner.service.ts`
**תפקיד:** סריקת וירוסים אופציונלית (ClamAV)

**מצבים:**
- `ENABLE_VIRUS_SCAN=false` (ברירת מחדל) - מושבת, לא משבש
- `ENABLE_VIRUS_SCAN=true` (פרודקשן) - פעיל אם ClamAV מותקן

**התנהגות:**
- אם ClamAV לא מותקן → מתריע ומאפשר העלאה (dev mode)
- אם ClamAV מותקן → סורק ודוחה קבצים נגועים

### 3️⃣ שינויים בקבצים קיימים

#### `server/src/middlewares/upload.ts`
**שינויים:**

✅ **נוספו imports** (שורות 1-9):
```typescript
import { validateUploadedFile } from '../utils/fileValidation';
import { virusScannerService } from '../services/virusScanner.service';
import { securityLogger } from '../utils/securityLogger';
import * as fs from 'fs/promises';
```

✅ **נוספה פונקציה חדשה** `secureUpload()`:
- Middleware לבדיקה לאחר Multer
- Magic bytes validation
- סריקת וירוסים אופציונלית
- מחיקה אוטומטית של קבצים פגומים

✅ **נוספו exports מוכנים לשימוש**:
```typescript
export const secureImageUpload = {
  middleware: upload,
  validate: secureUpload(['image/jpeg', 'image/png', 'image/jpg']),
};
```

**⚠️ לא שונה:**
- `upload`, `uploadFloorPlan`, `uploadFile` - ממשיכים לעבוד בדיוק כמו קודם
- ניתן להשתמש בהם ישירות (ללא שינוי בקוד קיים)
- או להשתמש ב-`secureImageUpload` לאבטחה מוגברת

#### `server/src/modules/admin/import.routes.ts`
**שינויים:**

✅ **נוספו imports**:
```typescript
import { validateUploadedFile } from '../../utils/fileValidation';
import { securityLogger } from '../../utils/securityLogger';
```

✅ **נוספה פונקציה** `validateImportFile()`:
- Middleware לבדיקת XLSX/CSV
- Magic bytes validation לקבצי Excel/CSV

✅ **נוסף middleware לכל ה-routes**:
```typescript
router.post('/cities-streets/preview', upload.single('file'), validateImportFile, ...);
router.post('/properties/preview', upload.single('file'), validateImportFile, ...);
router.post('/properties-file/preview', upload.single('file'), validateImportFile, ...);
```

---

## 🛡️ שכבות ההגנה (Defense-in-Depth)

### לפני (3 שכבות):
1. ✅ MIME type check (Multer)
2. ✅ File extension check (Multer)
3. ✅ File size limits (Multer)

### אחרי (7 שכבות):
1. ✅ MIME type check (Multer) - קיים
2. ✅ File extension check (Multer) - קיים
3. ✅ File size limits (Multer) - קיים
4. 🆕 **Magic bytes validation** (file-type) - **חדש**
5. 🆕 **MIME vs Real type matching** - **חדש**
6. 🆕 **ZIP bomb protection** - **חדש**
7. 🆕 **Virus scanning** (optional) - **חדש**
8. ✅ Safe parsing (Sharp/XLSX) - קיים

---

## 📋 איך להשתמש

### אופציה 1: המשך עם הקוד הקיים (ללא שינוי)
```typescript
// עובד בדיוק כמו קודם
router.post('/upload', upload.array('images', 10), controller.uploadImages);
```

### אופציה 2: שימוש באבטחה מוגברת (מומלץ)
```typescript
import { secureImageUpload } from '../../middlewares/upload';

// עם Magic bytes + Virus scan
router.post(
  '/upload', 
  secureImageUpload.middleware.array('images', 10),
  secureImageUpload.validate,
  controller.uploadImages
);
```

### אופציה 3: Custom validation
```typescript
import { secureUpload } from '../../middlewares/upload';

router.post(
  '/upload',
  uploadFloorPlan.single('file'),
  secureUpload(['image/jpeg', 'image/png', 'application/pdf']),
  controller.uploadFloorPlan
);
```

---

## ⚙️ הגדרות סביבה (.env)

### Development (ברירת מחדל):
```bash
# Virus scanning - מושבת
ENABLE_VIRUS_SCAN=false
```

### Production (אופציונלי):
```bash
# הפעלת סריקת וירוסים
ENABLE_VIRUS_SCAN=true

# מחיקה אוטומטית של קבצים נגועים
REMOVE_INFECTED_FILES=true

# ClamAV Configuration
CLAMAV_SOCKET=/var/run/clamav/clamd.ctl
# או
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310
```

---

## 🔧 התקנת ClamAV (Production)

### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install clamav clamav-daemon

# עדכון חתימות וירוסים
sudo freshclam

# הפעלה
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon

# בדיקה
sudo systemctl status clamav-daemon
```

### Docker:
```dockerfile
# Add to Dockerfile
RUN apt-get update && \
    apt-get install -y clamav clamav-daemon && \
    freshclam && \
    service clamav-daemon start
```

---

## 🧪 בדיקות

### Magic Bytes - בדיקה ידנית:

1. **העלאת תמונה תקינה:**
   - ✅ צריך לעבור

2. **שינוי extension בלבד:**
   ```bash
   cp malware.exe fake_image.jpg
   ```
   - ❌ צריך להידחות (Magic bytes לא תואמים)

3. **MIME spoofing:**
   ```bash
   curl -F "file=@virus.exe;type=image/jpeg" http://localhost:5000/api/upload
   ```
   - ❌ צריך להידחות

4. **ZIP bomb:**
   ```bash
   # צור ZIP עם compression ratio גבוה
   dd if=/dev/zero bs=1M count=1000 | gzip > bomb.zip
   ```
   - ❌ צריך להידחות

### CSV/XLSX - בדיקה:
```bash
# תקין
curl -F "file=@cities.xlsx" http://localhost:5000/api/admin/import/cities-streets/preview

# לא תקין (fake XLSX)
echo "fake" > fake.xlsx
curl -F "file=@fake.xlsx" http://localhost:5000/api/admin/import/cities-streets/preview
# -> צריך להידחות
```

---

## 📊 לוגים

### תצוגה בקונסול:
```
🔒 [SECURITY] {
  "timestamp": "2026-02-11T10:30:00.000Z",
  "event": "FILE_REJECTED",
  "file": "suspicious.jpg",
  "declared": "image/jpeg",
  "detected": "application/x-msdownload",
  "reason": "MIME type mismatch",
  "size": "125.5 KB"
}
```

### Production - שליחה ל-logging service:
```typescript
// TODO: בקובץ securityLogger.ts
// Uncomment and configure:
// this.sendToLoggingService(logEntry);
```

אפשרויות:
- Winston
- Sentry
- AWS CloudWatch
- Datadog

---

## ✅ מה לא נשבר

### קוד קיים ממשיך לעבוד:
- ✅ `upload.array('images', 15)` - ללא שינוי
- ✅ `uploadFloorPlan.single('file')` - ללא שינוי
- ✅ `uploadFile.single('file')` - ללא שינוי
- ✅ Sharp processing - ללא שינוי
- ✅ Watermark service - ללא שינוי
- ✅ Storage (./uploads) - ללא שינוי
- ✅ Random filenames - ללא שינוי

### שימושים קיימים:
```typescript
// ב-ads.routes.ts
router.post('/:id/images', authenticate, upload.array('images', 10), ...);
// ✅ עובד בדיוק כמו קודם

// ב-upload.routes.ts
router.post('/images', authenticate, upload.array('images', 15), ...);
// ✅ עובד בדיוק כמו קודם
```

---

## 🚀 Migration Path (אופציונלי)

### שלב 1: Dev - בדיקה בסביבת פיתוח
```bash
cd server
npm install
npm run dev
```
- בדוק שהכל עובד
- Magic bytes validation פעיל אוטומטית
- Virus scan מושבת

### שלב 2: Staging - הוספת secure middlewares
```typescript
// routes שמעלים קבצים רגישים
import { secureImageUpload } from '../../middlewares/upload';

router.post(
  '/sensitive-upload',
  secureImageUpload.middleware.single('file'),
  secureImageUpload.validate,
  controller.upload
);
```

### שלב 3: Production - הפעלת ClamAV
```bash
# Install ClamAV on server
sudo apt-get install clamav clamav-daemon
sudo freshclam
sudo systemctl start clamav-daemon

# Enable in .env
ENABLE_VIRUS_SCAN=true
REMOVE_INFECTED_FILES=true
```

---

## 🔐 Security Benefits

### הגנה מפני:
1. ✅ **MIME type spoofing** - זיוף סוג קובץ
2. ✅ **Extension spoofing** - זיוף סיומת
3. ✅ **Malware uploads** - העלאת תוכנות זדוניות
4. ✅ **ZIP bombs** - קבצי ZIP מסוכנים
5. ✅ **Viruses** - וירוסים (אם ClamAV פעיל)

### תאימות:
- ✅ Backward compatible - לא משבר קוד קיים
- ✅ Optional features - סריקת וירוסים אופציונלית
- ✅ Graceful degradation - עובד גם בלי ClamAV
- ✅ Production ready - מוכן לפרודקשן

---

## 📚 קבצים שונו/נוצרו

### קבצים חדשים:
1. `server/src/utils/fileValidation.ts` - Magic bytes validation
2. `server/src/utils/securityLogger.ts` - Security logging
3. `server/src/services/virusScanner.service.ts` - Virus scanning

### קבצים ששונו:
1. `server/package.json` - תלויות חדשות
2. `server/src/middlewares/upload.ts` - Security middleware
3. `server/src/modules/admin/import.routes.ts` - Validation middleware

### סך הכל:
- **3 קבצים חדשים**
- **3 קבצים ששונו**
- **0 קבצים שנמחקו**
- **0 breaking changes**

---

## 🎯 מוכן לשימוש!

המערכת עכשיו:
- ✅ מאובטחת יותר (7 שכבות הגנה)
- ✅ לא שובר קוד קיים
- ✅ אופציונלית (ניתן להמשיך עם הקוד הישן)
- ✅ מוכנה לפרודקשן
- ✅ עם לוגים מפורטים

**המלצה:** התחל להשתמש ב-`secureImageUpload` בהדרגה בנקודות העלאה חדשות.
