# מודול Audit Log - לוג פעולות ניהול

## תיאור כללי
מודול קריטי ברמת אבטחה וציות למעקב אחר כל פעולות הניהול במערכת.
**זהו רכיב בקרה משפטי-מערכתי - לא טבלת CRUD רגילה.**

---

## מבנה הטבלה

### AdminAuditLog
נמצא ב-`server/prisma/schema.prisma`

```prisma
model AdminAuditLog {
  id         String   @id @default(cuid())
  adminId    String   // מזהה המנהל שביצע את הפעולה
  action     String   // סוג הפעולה
  targetId   String?  // מזהה הישות המושפעת
  entityType String?  // סוג הישות (user/listing/appointment/etc)
  meta       Json?    // מידע נוסף כ-JSON
  ip         String?  // כתובת IP
  createdAt  DateTime @default(now())

  @@index([adminId])
  @@index([action])
  @@index([createdAt])
  @@index([targetId])
  @@index([entityType])
}
```

---

## API Endpoints

### Backend Routes
נמצא ב-`server/src/modules/admin/audit-log.routes.ts`

#### 1. קבלת רשימת לוגים
```
GET /api/admin/audit-log
```
**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `action` - סינון לפי סוג פעולה
- `adminId` - סינון לפי מנהל
- `entityType` - סינון לפי סוג ישות
- `startDate` - מתאריך
- `endDate` - עד תאריך

**הרשאות:** Admin או SuperAdmin
**Response:**
```json
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### 2. קבלת לוג בודד
```
GET /api/admin/audit-log/:id
```
**הרשאות:** Admin או SuperAdmin

#### 3. סטטיסטיקות
```
GET /api/admin/audit-log/stats
```
**הרשאות:** Admin או SuperAdmin

#### 4. ייצוא לוגים
```
POST /api/admin/audit-log/export
```
**הרשאות:** **SuperAdmin בלבד**
**Body:**
```json
{
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "format": "csv", // or "json"
  "action": "",
  "entityType": ""
}
```

**חשוב:** פעולת הייצוא נרשמת אוטומטית בלוג עם `action: EXPORT_AUDIT_LOG`

---

## RBAC - הרשאות גישה

### Super Admin
- ✅ צפייה מלאה בכל הלוגים
- ✅ סינון וחיפוש
- ✅ צפייה בכתובות IP
- ✅ **ייצוא לוגים** (CSV/JSON)

### Admin
- ✅ צפייה בכל הלוגים
- ✅ סינון וחיפוש
- ✅ צפייה בכתובות IP
- ❌ **ללא ייצוא**

### Moderator
- ❌ **אין גישה כלל**
- הפריט לא מוצג בתפריט
- חסימה גם ב-API

---

## קומפוננטות Frontend

### AuditLogPage
נמצא ב-`client/src/pages/admin/AuditLogPage.tsx`

**תכונות:**
- טבלה Read-Only (אין עריכה/מחיקה)
- Pagination בצד שרת
- פילטרים: תאריכים, סוג פעולה, סוג ישות
- פרטי רשומה במודל
- כפתור ייצוא (SuperAdmin בלבד)

### Sidebar
ב-`client/src/components/admin/AdminLayout.tsx`

**הגדרה:**
```tsx
{
  id: 'audit',
  title: 'לוג פעולות ניהול',
  path: '/admin/audit',
  icon: <FileCheck />,
  requiredRoles: ['ADMIN', 'SUPER_ADMIN'] // ללא Moderator
}
```

### Route
ב-`client/src/App.tsx`

```tsx
<Route 
  path="/admin/audit" 
  element={
    <AdminRoute>
      <AdminLayout>
        <AuditLog />
      </AdminLayout>
    </AdminRoute>
  } 
/>
```

---

## שירות רישום פעולות

### AdminAuditService
נמצא ב-`server/src/modules/admin/admin-audit.service.ts`

**שימוש:**
```typescript
import { AdminAuditService } from './admin-audit.service';

// רישום פעולה
await AdminAuditService.log({
  adminId: req.user.id,
  action: 'approve_ad',
  targetId: adId,
  entityType: 'listing',
  meta: {
    oldStatus: 'pending',
    newStatus: 'approved'
  },
  ip: req.ip
});
```

**פעולות נפוצות שנרשמות:**
- `approve` - אישור מודעה
- `reject` - דחיית מודעה
- `block` - חסימת משתמש
- `export` - ייצוא נתונים
- `role_change` - שינוי תפקיד
- `system_change` - שינוי הגדרות מערכת
- `EXPORT_AUDIT_LOG` - ייצוא לוגים

---

## עקרונות חובה

### 🔒 Read-Only
- **אסור** לערוך רשומות לוג
- **אסור** למחוק רשומות לוג
- **אסור** להסתיר רשומות לוג
- אין כפתורי פעולה בטבלה

### 🔐 אבטחה
- כל ייצוא נרשם אוטומטית
- Signed tokens עם TTL מוגבל (15 דקות)
- כתובות IP נשמרות למנהלים בלבד
- RBAC מלא גם ב-UI וגם ב-API

### ⚡ ביצועים
- Pagination חובה (Server Side)
- אינדקסים על כל השדות החשובים
- הגבלת ייצוא ל-10,000 רשומות
- אין טעינה מלאה של הטבלה

### 💾 שרידות
- אין מחיקה אוטומטית
- לא מושפע מניקוי נתונים רגיל
- נכלל בגיבויי מערכת

---

## בדיקות שבוצעו

### ✅ Backend
- [x] API GET /admin/audit-log עם pagination
- [x] API GET /admin/audit-log/:id
- [x] API POST /admin/audit-log/export (SuperAdmin)
- [x] RBAC middleware (requireAdminOrSuper)
- [x] AdminAuditService.log() פועל
- [x] רישום אוטומטי של ייצוא

### ✅ Frontend
- [x] קומפוננטת AuditLogPage
- [x] טבלה עם pagination
- [x] פילטרים (תאריכים, פעולה, ישות)
- [x] מודל פרטי רשומה
- [x] כפתור ייצוא (SuperAdmin בלבד)
- [x] התראת Read-Only
- [x] הסתרה מ-Moderator בתפריט

### ✅ Database
- [x] טבלת AdminAuditLog קיימת
- [x] אינדקסים על created_at, adminId, action, entityType
- [x] Schema מעודכן

---

## קבצים שנוצרו/עודכנו

### Backend
- `server/src/modules/admin/audit-log.routes.ts` - **עודכן**
- `server/src/modules/admin/admin-audit.service.ts` - קיים
- `server/src/middleware/rbac.middleware.ts` - **עודכן** (הסרת audit:read מ-Moderator)

### Frontend
- `client/src/pages/admin/AuditLogPage.tsx` - **נוצר חדש**
- `client/src/pages/admin/AuditLog.tsx` - **עודכן** (redirect)
- `client/src/components/admin/AdminLayout.tsx` - **עודכן** (RBAC)

### Database
- `server/prisma/schema.prisma` - קיים (AdminAuditLog)

---

## דוגמת שימוש

### 1. רישום פעולה בשרת
```typescript
// בכל controller שמבצע פעולת ניהול
await AdminAuditService.log({
  adminId: req.user.id,
  action: 'approve_ad',
  targetId: '123456',
  entityType: 'listing',
  meta: {
    oldStatus: 'pending',
    newStatus: 'approved',
    reason: 'הכל תקין'
  },
  ip: req.ip
});
```

### 2. צפייה בלוגים (Admin)
1. כניסה ל-`/admin/audit`
2. סינון לפי תאריך/פעולה
3. לחיצה על שורה לצפייה בפרטים
4. ❌ אין אפשרות ייצוא

### 3. ייצוא לוגים (SuperAdmin)
1. כניסה ל-`/admin/audit`
2. לחיצה על "ייצוא לוגים"
3. בחירת טווח תאריכים (חובה)
4. בחירת פורמט (CSV/JSON)
5. הורדת הקובץ
6. ✅ הפעולה נרשמת אוטומטית

---

## תחזוקה עתידית

### מומלץ
- [ ] הוספת retention policy (שמירה למשך X שנים)
- [ ] דחיסה אוטומטית של לוגים ישנים
- [ ] התראות על פעולות חשודות
- [ ] דשבורד אנליטיקס

### אסור
- ❌ הוספת עריכה/מחיקה
- ❌ הסתרת רשומות
- ❌ שינוי היסטורי
- ❌ מחיקה בתוך האפליקציה

---

## סיכום

מודול Audit Log מיושם במלואו עם:
- ✅ API מאובטח עם RBAC
- ✅ UI מלא עם פילטרים
- ✅ ייצוא לוגים (SuperAdmin)
- ✅ Read-Only מלא
- ✅ רישום אוטומטי של פעולות
- ✅ Pagination ו-Performance
- ✅ אינדקסים בסיסי נתונים

**המערכת מוכנה לשימוש בסביבת ייצור.**
