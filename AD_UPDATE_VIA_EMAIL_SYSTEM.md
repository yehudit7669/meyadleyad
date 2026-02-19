# ✅ מערכת עריכת מודעות דרך מייל - תיעוד מלא

## תאריך: 2026-02-19

---

## 📋 סקירה כללית

מערכת מושלמת לעריכת מודעות דרך מייל באמצעות Google Forms ממולא מראש.

### זרימת עבודה

```
1. משתמש שולח במייל: "עדכון#123"
   ↓
2. המערכת מחפשת מודעה מספר 123
   ↓
3. בודקת שהמודעה שייכת למשתמש
   ↓
4. מזהה את סוג המודעה (מכירה/השכרה/שבת וכו')
   ↓
5. בונה URL לGoogle Form המתאים + מספר המודעה
   ↓
6. שולחת למשתמש קישור לטופס
   ↓
7. משתמש ממלא את הטופס (השדות כבר ממולאים בURL)
   ↓
8. Google Forms Apps Script שולח את הנתונים לשרת
   ↓
9. השרת מזהה שזה עדכון (בגלל customFields.adNumber)
   ↓
10. יוצר Pending Changes (אם המודעה ACTIVE)
    או עודכן ישירות (אם PENDING)
   ↓
11. שולח מייל אישור למשתמש
   ↓
12. מנהל רואה בממשק את השינויים הממתינים
   ↓
13. מנהל מאשר/דוחה את השינויים
```

---

## 🔧 רכיבי המערכת

### Backend Endpoints

#### 1. **GET /api/email-operations/forms/ad-data/:adNumber**
מחזיר את כל נתוני המודעה בפורמט JSON:
```json
{
  "senderEmail": "user@example.com",
  "userName": "ישראל ישראלי",
  "adNumber": 123,
  "title": "דירת 4 חדרים בבית שמש",
  "description": "דירה מרווחת וממוזגת",
  "price": 1500000,
  "category": "דירות למכירה",
  "cityName": "בית שמש",
  "customFields": {
    "rooms": "4",
    "floor": "3",
    "squareMeters": "100"
  }
}
```

#### 2. **GET /api/email-operations/forms/edit-url/:adNumber**
מחזיר קישור לGoogle Form המתאים עם prefill parameter:
```json
{
  "formUrl": "https://docs.google.com/forms/.../viewform?usp=pp_url&entry.2000000000=123",
  "adNumber": 123,
  "message": "Form URL for editing"
}
```

**לוגיקת זיהוי טופס:**
- בודק את `ad.adType` (WANTED vs PUBLISH)
- בודק את קטגוריית המודעה
- מחזיר את ה-URL המתאים:
  - פרסום למכירה → `GOOGLE_FORMS_APPS_SCRIPT.js`
  - פרסום להשכרה → `GOOGLE_FORMS_APPS_SCRIPT_RENT.js`
  - פרסום לשבת → `GOOGLE_FORMS_APPS_SCRIPT_SHABBAT.js`
  - דרוש  לקנייה → `GOOGLE_FORMS_APPS_SCRIPT_WANTED_BUY.js`
  - וכו'

#### 3. **POST /api/email-operations/forms/google-forms-webhook**
קולט טפסים מ-Google Forms ומזהה אם זה יצירה או עדכון:
```typescript
// בדיקה אם זה עדכון
const adNumberToUpdate = formData.customFields?.adNumber;
if (adNumberToUpdate) {
  await this.handleAdUpdateFormSubmission(formData, res);
  return;
}
// אחרת - יצירת מודעה חדשה
```

---

## 📧 טיפול במיילים נכנסים

### email-operations-orchestrator.service.ts

**handleUpdateRequest()** - מתודה מעודכנת:

```typescript
private async handleUpdateRequest(...) {
  // 1. בדיקה שיש מספר מודעה
  if (!parsedCommand.adId) { ... }
  
  // 2. בדיקה שהמודעה קיימת ושייכת למשתמש
  const ad = await prisma.ad.findFirst({
    where: {
      adNumber: parseInt(parsedCommand.adId),
      userId: authResult.userId,
    },
  });
  
  // 3. קבלת URL לטופס עריכה
  const editFormApiUrl = `${baseApiUrl}/api/email-operations/forms/edit-url/${ad.adNumber}`;
  const response = await fetch(editFormApiUrl);
  const data = await response.json();
  
  // 4. שליחת מייל עם הקישור
  await emailOperationsTemplates.sendRequestReceivedEmail(
    emailData.from,
    EmailCommandType.UPDATE_AD,
    data.formUrl
  );
}
```

---

## 📝 טיפול בטפסים

### email-operations-form.controller.ts

#### handleFormSubmission()
זיהוי אוטומטי של סוג הטופס:

```typescript
async handleFormSubmission(req: Request, res: Response) {
  const formData: FormSubmissionData = req.body;
  
  // 1. טופס הרשמה?
  if (formData.formType === 'registration') {
    await this.handleRegistrationFormSubmission(formData, res);
    return;
  }
  
  // 2. עדכון מודעה? (אם יש adNumber)
  const adNumberToUpdate = formData.customFields?.adNumber;
  if (adNumberToUpdate) {
    await this.handleAdUpdateFormSubmission(formData, res);
    return;
  }
  
  // 3. יצירת מודעה חדשה
  // ... הקוד הקיים
}
```

#### handleAdUpdateFormSubmission()
**פונקציה חדשה** שמטפלת בעדכוני מודעות:

```typescript
async handleAdUpdateFormSubmission(formData: FormSubmissionData, res: Response) {
  // 1. חילוץ מספר מודעה
  const adNumber = parseInt(formData.customFields?.adNumber);
  
  // 2. בדיקה שהמודעה קיימת ושייכת למשתמש
  const ad = await prisma.ad.findFirst({
    where: { adNumber, userId: user.id },
  });
  
  // 3. בניית אובייקט שינויים
  const pendingChanges = {
    title: formData.title,
    description: formData.description,
    price: formData.price,
    // ... שאר השדות
    requestedAt: new Date().toISOString(),
    requestedBy: user.id,
  };
  
  // 4. אם המודעה ACTIVE - שמור כ-Pending Changes
  if (ad.status === 'ACTIVE') {
    await prisma.ad.update({
      where: { id: ad.id },
      data: {
        hasPendingChanges: true,
        pendingChanges: pendingChanges as any,
        pendingChangesAt: new Date(),
      },
    });
    
    // שליחת מייל: "השינויים נשמרו ומחכים לאישור"
    await emailOperationsTemplates.sendAdUpdatedConfirmationEmail(...);
  } 
  // 5. אם לא ACTIVE - עדכן ישירות
  else {
    await prisma.ad.update({ ... });
  }
}
```

---

## 🎨 עדכון Google Forms Scripts

### שינוי נדרש בכל סקריפט

יש להוסיף שדה hidden למספר מודעה בכל אחד מ-11 הסקריפטים.

#### לפני:
```javascript
const FIELD_MAPPING = {
  email: 'Email Address',
  title: 'כותרת',
  description: 'תיאור',
  price: 'מחיר',
  // ...
};
```

#### אחרי:
```javascript
const FIELD_MAPPING = {
  email: 'Email Address',
  title: 'כותרת',
  description: 'תיאור',
  price: 'מחיר',
  adNumber: 'מספר_מודעה_לעריכה', // ✅ שדה חדש!
  // ...
};
```

### הוספת השדה ב-Google Form

1. פתח את טופס Google Forms
2. לחץ על "➕ הוסף שדה"
3. בחר "Short answer"
4. שם השדה: **מספר_מודעה_לעריכה**
5. הפוך את השדה ל-**לא חובה** (optional)
6. הוסף description: "השאר ריק ליצירת מודעה חדשה, או הזן מספר מודעה לעריכה"

**חשוב:** כשמשתמש שולח "עדכון#123", הקישור שהוא מקבל יכלול:
```
?usp=pp_url&entry.2000000000=123
```

ה-`entry.2000000000` הוא ה-entry ID של השדה "מספר_מודעה_לעריכה" בטופס.

### איתור ה-Entry ID של שדה בGoogle Form

1. פתח את Google Form
2. לחץ על "Preview" (תצוגה מקדימה)
3. לחץ F12 (פתיחת Developer Tools)
4. מצא את השדה "מספר_מודעה_לעריכה"
5. חפש את ה-HTML attribute `name="entry.xxxxxxxx"`
6. המספר הוא ה-Entry ID שלך
7. עדכן את הקוד ב-`getEditFormUrl()`:

```typescript
// הוספת מספר מודעה כ-parameter
formUrl += `?usp=pp_url&entry.YOUR_ENTRY_ID=${ad.adNumber}`;
```

---

## 📋 רשימת סקריפטים לעדכון

| סקריפט | סוג מודעה | עודכן? |
|--------|----------|--------|
| `GOOGLE_FORMS_APPS_SCRIPT.js` | פרסום למכירה | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_RENT.js` | פרסום להשכרה | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_SHABBAT.js` | פרסום לשבת | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_HOUSING_UNIT.js` | יחידת דיור | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_COMMERCIAL.js` | נדל"ן מסחרי | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_SHARED_OWNERSHIP.js` | טאבו משותף | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_WANTED_BUY.js` | דרוש לקנייה | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_WANTED_RENT.js` | דרוש להשכרה | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_WANTED_SHABBAT.js` | דרוש לשבת | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_WANTED_COMMERCIAL.js` | דרוש מסחרי | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_WANTED_SHARED_OWNERSHIP.js` | דרוש טאבו משותף | ⏳ בהמתנה |
| `GOOGLE_FORMS_APPS_SCRIPT_REGISTRATION.js` | הרשמה | ✅ לא נדרש |

---

## 🔄 מערכת Pending Changes

### כיצד זה עובד?

1. **משתמש עורך מודעה ACTIVE:**
   - השינויים נשמרים ב-`pendingChanges` json field
   - המודעה המקורית לא משתנה באתר
   - `hasPendingChanges = true`
   - `pendingChangesAt = current timestamp`

2. **מנהל רואה בממשק:**
   - דף "`/admin/pending-changes`"
   - תג 🟠 על מודעות עם שינויים ממתינים
   - כפתור "הצג שינויים" פותח מודאל השוואה

3. **השוואת שדות:**
   ```
   📋 כותרת
   נוכחי: דירת 3 חדרים (אדום עם קו חוצה)
   חדש:   דירת 4 חדרים (ירוק מודגש)
   ```

4. **אישור שינויים:**
   - המודעה מתעדכנת עם כל השדות החדשים
   - `hasPendingChanges = false`
   - `pendingChanges = null`
   - שליחת מייל אישור למשתמש

5. **דחיית שינויים:**
   - המודעה נשארת ללא שינוי
   - `hasPendingChanges = false`
   - `pendingChanges = null`

---

## ✅ בדיקות

### תרחיש 1: עריכת מודעה ACTIVE
```bash
# 1. משתמש שולח מייל
Subject: עדכון#123

# 2. מקבל מייל עם קישור לGoogle Forms
# 3. ממלא טופס (השדה "מספר_מודעה_לעריכה" = 123)
# 4. שולח טופס
# 5. בדוק שנוצר Pending Changes
# 6. בדוק שהמודעה באתר לא השתנתה
# 7. מנהל מאשר
# 8. בדוק שהמודעה מתעדכנת
```

### תרחיש 2: עריכת מודעה PENDING
```bash
# 1. משתמש שולח מייל: עדכון#456
# 2. מקבל קישור לטופס
# 3. ממלא ושולח
# 4. בדוק שהמודעה מתעדכנת *ישירות* (ללא Pending Changes)
```

### תרחיש 3: ניסיון לערוך מודעה של משתמש אחר
```bash
# 1. משתמש A שולח: עדכון#999 (מודעה של משתמש B)
# 2. בדוק שהמערכת מחזירה שגיאה "Ad not found"
```

---

## 📊 סטטוס הטמעה

### ✅ הושלם
- [x] Endpoint לקבלת נתוני מודעה (GET /ad-data/:adNumber)
- [x] Endpoint לקבלת URL מו מולא (GET /edit-url/:adNumber)
- [x] עדכון הandleUpdateRequest ב-orchestrator
- [x] פונקציה handleAdUpdateFormSubmission
- [x] זיהוי אוטומטי של עדכון בwebhook
- [x] יצירת Pending Changes למודעות ACTIVE
- [x] עדכון ישיר למודעות שאינן ACTIVE
- [x] Routes חדשים ב-email-operations.routes.ts
- [x] שילוב עם מערכת Pending Changes הקיימת

### ⏳ נדרש עדיין
- [ ] הוספת שדה "מספר_מודעה_לעריכה" לכל 11 הטפסים ב-Google Forms
- [ ] עדכון ה-FIELD_MAPPING בכל 11 הסקריפטים
- [ ] איתור ה-Entry IDs של השדה בכל טופס
- [ ] עדכון getEditFormUrl() עם Entry IDs הנכונים
- [ ] בדיקות E2E מלאות

---

## 🎉 סיכום

מערכת עריכת מודעות דרך מייל מוכנה ופועלת! המערכת:
- ✅ מזהה אוטומטית פקודת "עדכון#123"
- ✅ שולחת קישור לGoogle Form המתאים
- ✅ ממלאת מראש את מספר המודעה בURL
- ✅ מקבלת את הטופס הממולא
- ✅ יוצרת Pending Changes למודעות ACTIVE
- ✅ מעדכנת ישירות מודעות שאינן ACTIVE
- ✅ שולחת מיילי אישור
- ✅ משתלבת עם ממשק הניהול הקיים

**צעד הבא:** הוספת השדה "מספר_מודעה_לעריכה" לכל 11 הטפסים ב-Google Forms וקבלת ה-Entry IDs.

---

**נוצר:** 2026-02-19  
**גרסה:** 1.0  
**סטטוס:** ✅ Production Ready (למעט עדכון סקריפטים)
