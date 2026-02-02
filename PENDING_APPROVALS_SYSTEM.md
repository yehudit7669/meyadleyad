# מערכת ניהול בקשות משתמשים - תיעוד מלא

## סקירה כללית

מערכת מקיפה לניהול בקשות שדורשות אישור אדמין במערכת meyadleyad.

## תכונות שפותחו

### 1. מודל נתונים (Database Schema)

נוסף מודל **PendingApproval** למסד הנתונים:

```prisma
model PendingApproval {
  id              String                @id @default(cuid())
  userId          String
  type            PendingApprovalType
  status          ApprovalStatus        @default(PENDING)
  requestData     Json                  // המידע שמבקשים לאשר
  oldData         Json?                 // המידע הקודם (לעריכה)
  reason          String?               // סיבת הבקשה (אופציונלי)
  adminNotes      String?               // הערות אדמין
  reviewedById    String?               // מי בדק את הבקשה
  reviewedAt      DateTime?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  user            User                  @relation("UserApprovals", fields: [userId], references: [id])
  reviewer        User?                 @relation("ReviewedApprovals", fields: [reviewedById], references: [id])
}
```

### 2. סוגי בקשות נתמכים (PendingApprovalType)

- **OFFICE_ADDRESS_UPDATE** - עריכת כתובת משרד
- **ABOUT_UPDATE** - עריכת תיאור "אודות"
- **LOGO_UPLOAD** - הוספת לוגו
- **BUSINESS_DESCRIPTION** - שדה אודות העסק
- **IMPORT_PERMISSION** - אישור להעלאת נכסים מקובץ
- **ACCOUNT_DELETION** - בקשה להסרה מלאה
- **HIGHLIGHT_AD** - בקשה להבליט מודעה

### 3. API Endpoints (Backend)

#### עבור מנהלים (Admin Only):

- `GET /admin/pending-approvals` - קבלת כל הבקשות (עם פילטרים)
- `GET /admin/pending-approvals/stats` - סטטיסטיקות בקשות
- `GET /admin/pending-approvals/pending-count` - מספר בקשות ממתינות
- `GET /admin/pending-approvals/:id` - קבלת בקשה ספציפית
- `PATCH /admin/pending-approvals/:id/approve` - אישור בקשה
- `PATCH /admin/pending-approvals/:id/reject` - דחיית בקשה

#### עבור משתמשים רגילים:

- `POST /admin/pending-approvals` - יצירת בקשה חדשה
- `GET /admin/pending-approvals/my/approvals` - קבלת הבקשות שלי

### 4. קבצים שנוצרו בצד שרת

1. **server/src/modules/admin/pending-approvals.service.ts**
   - לוגיקה עסקית לניהול בקשות
   - אישור/דחייה אוטומטיים עם החלת שינויים

2. **server/src/modules/admin/pending-approvals.controller.ts**
   - Controllers לכל ה-endpoints
   - טיפול בשגיאות

3. **server/src/modules/admin/pending-approvals.routes.ts**
   - הגדרת routes עם אימות והרשאות

### 5. שירותים בצד לקוח

נוסף **pendingApprovalsService** ב-`client/src/services/api.ts`:

```typescript
export const pendingApprovalsService = {
  getAll: async (filters) => {...},
  getById: async (id) => {...},
  create: async (data) => {...},
  approve: async (id, adminNotes) => {...},
  reject: async (id, adminNotes) => {...},
  getMyApprovals: async () => {...},
  getStats: async () => {...},
  getPendingCount: async () => {...},
};
```

### 6. ממשק משתמש (UI Components)

#### א. עמוד ניהול משתמשים מחודש

**client/src/pages/UserManagement.tsx** - עודכן עם:
- שני טאבים: "משתמשים" ו"בקשות משתמשים"
- רכיב **PendingApprovalsTab** חדש המציג:
  - טבלה עם כל הבקשות
  - פילטרים לפי סטטוס (ממתין/אושר/נדחה)
  - מודל פרטים עם אפשרות אישור/דחייה
  - הצגת המידע המבוקש והמידע הקודם

#### ב. עריכת פרופיל מתווך/נותן שירות

1. **SPBrandingTab.tsx** - עודכן:
   - העלאת לוגו שולחת בקשה לאישור
   - עריכת "אודות" שולחת בקשה לאישור
   - הצגת סטטוס בקשות ממתינות

2. **SPPersonalDetailsTab.tsx** - עודכן:
   - עריכת כתובת משרד שולחת בקשה לאישור

3. **SPAccountManagementTab.tsx** - עודכן:
   - בקשת הסרת חשבון שולחת בקשה לאישור מנהל

### 7. תהליך עבודה (Workflow)

#### משתמש רגיל:
1. משתמש מבקש לעדכן כתובת משרד/לוגו/אודות
2. המערכת שולחת בקשה לטבלת PendingApproval
3. המשתמש רואה הודעה: "הבקשה נשלחה ומחכה לאישור מנהל"
4. המשתמש יכול לראות את כל הבקשות שלו ב"הבקשות שלי"

#### מנהל:
1. מנהל נכנס ל"ניהול משתמשים" → טאב "בקשות משתמשים"
2. רואה רשימת כל הבקשות הממתינות
3. לוחץ על "פרטים" לראות את המידע המבוקש
4. יכול לאשר או לדחות עם הערות
5. לאחר אישור - השינויים מוחלים אוטומטית על המשתמש

### 8. לוגיקה אוטומטית לאחר אישור

כאשר מנהל מאשר בקשה, השרת מבצע:

- **OFFICE_ADDRESS_UPDATE**: עדכון `officeAddress` ו-`officeAddressStatus`
- **ABOUT_UPDATE**: עדכון `aboutBusiness` ו-`aboutBusinessStatus`
- **LOGO_UPLOAD**: עדכון `avatar`, `brokerLogoApproved`, `logoStatus`
- **ACCOUNT_DELETION**: עדכון סטטוס משתמש ל-DELETED
- **HIGHLIGHT_AD**: (ניתן להוסיף לוגיקה עתידית)

## קבצים שעודכנו

### Backend:
- `server/prisma/schema.prisma` - מודל PendingApproval
- `server/src/routes/index.ts` - הוספת route
- `server/src/modules/admin/pending-approvals.service.ts` (חדש)
- `server/src/modules/admin/pending-approvals.controller.ts` (חדש)
- `server/src/modules/admin/pending-approvals.routes.ts` (חדש)

### Frontend:
- `client/src/services/api.ts` - שירות חדש
- `client/src/pages/UserManagement.tsx` - טאב בקשות
- `client/src/components/service-provider/SPBrandingTab.tsx` - שימוש בבקשות
- `client/src/components/service-provider/SPPersonalDetailsTab.tsx` - שימוש בבקשות
- `client/src/components/service-provider/SPAccountManagementTab.tsx` - שימוש בבקשות

## איך להשתמש במערכת

### כמשתמש רגיל:
1. היכנס לפרופיל שלך
2. בטאב "מיתוג" או "פרטים אישיים" ערוך את הפרטים
3. לחץ "שמור" - תקבל הודעה שהבקשה נשלחה
4. המתן לאישור מנהל

### כמנהל:
1. היכנס ל-`/admin/users`
2. לחץ על טאב "בקשות משתמשים"
3. בחר סינון: "ממתין" לראות בקשות חדשות
4. לחץ "פרטים" על בקשה
5. בדוק את המידע, הוסף הערות (אופציונלי)
6. לחץ "אשר בקשה" או "דחה בקשה"

## סטטוסים אפשריים

- **PENDING** - ממתין לאישור
- **APPROVED** - אושר על ידי מנהל
- **REJECTED** - נדחה על ידי מנהל

## הערות חשובות

1. **אבטחה**: כל ה-endpoints מוגנים באימות והרשאות
2. **Audit Trail**: כל בקשה שומרת:
   - מי ביקש
   - מתי
   - מי אישר/דחה
   - מתי אושר/נדחה
   - הערות המנהל
3. **גמישות**: קל להוסיף סוגי בקשות נוספים
4. **שקיפות**: משתמשים רואים את הסטטוס של הבקשות שלהם

## פיתוחים עתידיים אפשריים

- [ ] התראות למנהלים על בקשות חדשות
- [ ] התראות למשתמשים כשבקשה אושרה/נדחתה
- [ ] היסטוריה מלאה של בקשות למשתמש
- [ ] אפשרות למשתמש לבטל בקשה ממתינה
- [ ] דשבורד סטטיסטיקות של בקשות
- [ ] אישור/דחייה מרובה (bulk actions)
- [ ] תמיכה בהעלאת קבצים (לוגו) דרך מערכת העלאה ייעודית

## בדיקות שבוצעו

✅ Build של Server הצליח  
✅ Build של Client הצליח  
✅ Migration של DB הצליח  
✅ כל הטאבים פועלים  
✅ כל ה-endpoints מוגדרים נכון  

המערכת מוכנה לשימוש!
