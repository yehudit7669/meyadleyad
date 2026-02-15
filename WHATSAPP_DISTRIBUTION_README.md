# מערכת הפצת WhatsApp - תיעוד מלא

## 📋 תוכן עניינים
- [סקירה כללית](#סקירה-כללית)
- [ארכיטקטורה](#ארכיטקטורה)
- [התקנה והגדרה](#התקנה-והגדרה)
- [API Endpoints](#api-endpoints)
- [מדריך שימוש](#מדריך-שימוש)
- [הרשאות (RBAC)](#הרשאות-rbac)
- [בדיקות](#בדיקות)

---

## 🎯 סקירה כללית

מערכת הפצת WhatsApp היא מודול מקיף לניהול הפצת מודעות לקבוצות WhatsApp בצורה ידנית ומבוקרת.

### עקרונות יסוד
- ✅ **ללא אוטומציה אסורה**: השליחה בפועל נעשית ידנית על ידי מנהל
- ✅ **Backward Compatible**: לא משנה התנהגות קיימת
- ✅ **Production-ready**: מיגרציות בטוחות, לוגים, הרשאות, ובדיקות
- ✅ **Audit Trail**: כל פעולה מתועדת במערכת הלוגים

### תכונות עיקריות
1. **אישור + שליחה**: אישור מודעה ויצירה אוטומטית של פריטי הפצה
2. **Routing Engine**: התאמה חכמה של מודעות לקבוצות לפי עיר/קטגוריה
3. **תור הפצה**: ניהול מרוכז של כל הפריטים הממתינים
4. **Digest**: איחוד מספר מודעות לפוסט אחד
5. **מכסות יומיות**: שליטה על מספר ההפצות לכל קבוצה
6. **Dashboard + דוחות**: מדדים וסטטיסטיקות בזמן אמת

---

## 🏗️ ארכיטקטורה

### מבנה קבצים
```
server/src/modules/whatsapp/
├── distribution/
│   ├── message-builder.service.ts    # בניית הודעות
│   ├── routing-engine.service.ts     # התאמה לקבוצות
│   ├── distribution.service.ts       # לוגיקה עיקרית
│   └── audit.service.ts              # תיעוד פעולות
├── whatsapp-rbac.middleware.ts       # הרשאות
├── whatsapp-distribution.controller.ts
├── whatsapp-groups.controller.ts
└── whatsapp.routes.ts
```

### מודלים (Prisma Schema)

#### WhatsAppGroup
קבוצת WhatsApp במערכת (לא קבוצה פיזית).
```prisma
model WhatsAppGroup {
  id               String
  name             String
  internalCode     String @unique
  status           WhatsAppGroupStatus  // ACTIVE, PAUSED, ARCHIVED
  cityScopes       Json?                // אילו ערים
  regionScopes     Json?                // אילו אזורים
  categoryScopes   Json?                // אילו קטגוריות
  dailyQuota       Int                  // מכסה יומית
  allowDigest      Boolean
  inviteLink       String?
  ...
}
```

#### DistributionItem
פריט הפצה - מודעה שצריכה להישלח לקבוצה.
```prisma
model DistributionItem {
  id               String
  adId             String
  groupId          String?
  status           DistributionItemStatus  // PENDING, IN_PROGRESS, SENT, DEFERRED, FAILED
  priority         Int
  payloadSnapshot  Json?                   // התוכן המוכן
  sentAt           DateTime?
  sentBy           String?
  ...
}
```

#### DistributionDigest
פוסט מרוכז של מספר מודעות.

#### WhatsAppAuditLog
תיעוד כל הפעולות.

---

## ⚙️ התקנה והגדרה

### 1. הרצת מיגרציות
המיגרציות כבר הורצו אוטומטית:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 2. הגדרות סביבה (.env)
הוסף את המשתנים הבאים:
```env
# WhatsApp Module
WHATSAPP_MODULE_ENABLED=true
WHATSAPP_DIGEST_ENABLED=true

# Frontend URL (for links)
FRONTEND_URL=https://meyadleyad.com
```

### 3. יצירת קבוצות ראשוניות
```bash
# דרך API או Prisma Studio
```

---

## 🔌 API Endpoints

### אישור ושליחה
```http
POST /api/admin/ads/:id/approve-and-whatsapp
Authorization: Bearer <token>
```
אישור מודעה + יצירת distribution items.

**Response:**
```json
{
  "status": "success",
  "message": "המודעה אושרה ונוצרו פריטי הפצה",
  "data": {
    "ad": { ...ad object },
    "distribution": {
      "created": 2,
      "skipped": 0,
      "items": [...]
    }
  }
}
```

### תור הפצה
```http
GET /api/admin/whatsapp/queue
  ?groupId=<groupId>
  &status=PENDING,IN_PROGRESS
  &cityId=<cityId>
  &limit=50
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "total": 25
  }
}
```

### התחלת שליחה
```http
POST /api/admin/whatsapp/queue/:itemId/start
```
מעביר פריט ל-IN_PROGRESS ומחזיר את ה-payload + deep links.

**Response:**
```json
{
  "status": "success",
  "data": {
    "itemId": "...",
    "payload": {
      "messageText": "🏠 *דירה למכירה*...",
      "imageUrl": "...",
      "listingUrl": "..."
    },
    "whatsappWebLink": "https://wa.me/?text=...",
    "whatsappAppLink": "whatsapp://send?text=...",
    "clipboardText": "..."
  }
}
```

### סימון כנשלח
```http
POST /api/admin/whatsapp/queue/:itemId/mark-sent
```

### יצירת Digest
```http
POST /api/admin/whatsapp/groups/:groupId/create-digest
Content-Type: application/json

{
  "itemIds": ["item1", "item2", "item3"]
}
```

### Dashboard
```http
GET /api/admin/whatsapp/dashboard
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "sentToday": 45,
    "pendingCount": 12,
    "activeGroups": 8,
    "quotaReachedGroups": 2,
    "overrideCount": 1,
    "digestCount": 3
  }
}
```

### דוח יומי
```http
GET /api/admin/whatsapp/reports/daily
```

### ניהול קבוצות
```http
GET    /api/admin/whatsapp/groups
POST   /api/admin/whatsapp/groups          (Super Admin only)
PATCH  /api/admin/whatsapp/groups/:id      (Super Admin only)
PATCH  /api/admin/whatsapp/groups/:id/status
```

### הצעות קבוצות
```http
POST   /api/admin/whatsapp/groups/suggest  (Content Manager)
GET    /api/admin/whatsapp/groups/suggestions
POST   /api/admin/whatsapp/groups/suggestions/:id/approve  (Super Admin)
POST   /api/admin/whatsapp/groups/suggestions/:id/reject   (Super Admin)
```

---

## 📖 מדריך שימוש

### Flow בסיסי

#### 1. אישור מודעה עם הפצה
```
אדמין → Admin Panel → Pending Ads → בחירת מודעה
→ לחיצה על "אשר ושלח ל-WhatsApp"
→ המודעה עוברת ל-ACTIVE
→ נוצרים פריטי הפצה לקבוצות רלוונטיות
```

#### 2. שליחה ידנית מהתור
```
אדמין → WhatsApp Queue
→ בחירת פריט PENDING
→ "התחל שליחה"
→ העתקת טקסט (clipboard)
→ פתיחת WhatsApp (deep link)
→ הדבקת הטקסט בקבוצה ושליחה ידנית
→ חזרה למערכת: "אישרתי שנשלח"
```

#### 3. יצירת Digest
```
אדמין → WhatsApp Queue → פילטר לפי קבוצה
→ בחירת 5-10 פריטים PENDING
→ "צור Digest"
→ ה-Digest נוצר עם הודעה מרוכזת
→ שליחה ידנית כמו פריט רגיל
```

### Routing Logic
המערכת בוחרת קבוצות לפי:
1. **City Scopes**: האם העיר של המודעה נמצאת בהגדרות הקבוצה
2. **Category Scopes**: האם הקטגוריה מתאימה
3. **Region Scopes** (fallback): אם לא הוגדרו ערים
4. **Daily Quota**: האם נשאר מקום במכסה היומית
5. **Priority**: עדיפות (גבוהה יותר = נשלח קודם)

### Message Builder
ההודעה הסופית מכילה:
- 🏠 **כותרת** (עם אייקון לפי קטגוריה)
- 📍 **מיקום** (עיר + רחוב/שכונה)
- 💰 **מחיר** (בפורמט עברי)
- 🛏️ **פרטים** (חדרים, מ"ר, קומה)
- 📝 **תיאור** (עד 200 תווים)
- 🔗 **קישור** (canonical URL)

**דוגמה:**
```
🏘️ *דירה 4 חדרים למכירה ברמת גן*

📂 דירות למכירה | 📍 רמת גן, רחוב ביאליק | 💰 ₪2,500,000
🛏️ 4 חדרים | 📐 110 מ"ר | 🏢 קומה 3

דירה מרווחת ומשופצת ברמה גבוהה, מעלית, חניה, מיקום מעולה...

🔗 *לצפייה מלאה:* https://meyadleyad.com/listing/xyz/...
📞 מודעה מספר: *12345*
```

---

## 🔐 הרשאות (RBAC)

### תפקידים

#### 1. מנהל ראשי (SUPER_ADMIN)
**יכול:**
- כל מה שמנהל תוכן יכול
- Override resend (שליחה חוזרת למרות שכבר נשלח)
- שינוי מכסות
- יצירה/עריכה של קבוצות
- אישור/דחיית הצעות קבוצות

#### 2. מנהל תוכן (ADMIN, MODERATOR)
**יכול:**
- אישור מודעות + שליחה
- צפייה בתור ההפצה
- שליחה ידנית
- יצירת Digest
- הצעת קבוצות חדשות
- צפייה בדוחות

**לא יכול:**
- Override resend
- שינוי מכסות
- אישור קבוצות

#### 3. משתמש רגיל (USER)
**אין גישה** למודול WhatsApp כלל.

### Rate Limiting
- **אישור+שליחה**: 20 לדקה
- **start/mark-sent**: 50 לדקה
- **create digest**: 10 לדקה
- **suggest group**: 5 לשעה

---

## 🧪 בדיקות

### Unit Tests
```bash
npm test -- message-builder.service
npm test -- routing-engine.service
npm test -- distribution.service
```

### Integration Tests
```bash
npm test -- whatsapp-integration
```

### E2E Test Flow
1. אישור מודעה → בדיקה שנוצרו items
2. start → בדיקה של payload
3. mark-sent → בדיקה שהסטטוס השתנה
4. create digest → בדיקה שנוצר digest

---

## 📊 Observability

### Logs
כל פעולה כותבת ל:
- **Console**: `console.log` עם אייקונים
- **Audit Log**: טבלת `WhatsAppAuditLog`

**דוגמאות:**
```
📨 Received ad approval request
✅ Created 3 distribution items for ad abc123
📲 Marked item xyz as SENT
🔄 Override resend by admin@example.com: "customer request"
```

### Metrics (בעתיד)
- Counter: `whatsapp_items_sent_total`
- Gauge: `whatsapp_pending_items`
- Histogram: `whatsapp_send_duration_seconds`

---

## 🚀 Deployment

### Production Checklist
- ✅ `WHATSAPP_MODULE_ENABLED=true` ב-production .env
- ✅ מיגרציות הורצו
- ✅ אינדקסים ב-DB עבור queries מהירים
- ✅ Backup policy
- ✅ Monitoring (logs, errors)
- ✅ Feature flag בשביל disable במצב חירום

### Rollback Plan
אם צריך לבטל:
1. `WHATSAPP_MODULE_ENABLED=false`
2. המערכת תמשיך לעבוד רגיל ללא WhatsApp

---

## 🛠️ Troubleshooting

### בעיה: לא נוצרים distribution items
**פתרון:**
- בדוק שיש קבוצות ACTIVE
- בדוק שהקבוצות מתאימות לעיר/קטגוריה
- בדוק logs: `grep "matching groups" server.log`

### בעיה: הגעתי למכסה
**פתרון:**
- מנהל ראשי יכול להעלות את `dailyQuota`
- לחלופין, להמתין ליום הבא (reset אוטומטי ב-00:00)

### בעיה: טקסט עם שגיאות encoding
**פתרון:**
- Message Builder עושה sanitization אוטומטי
- אם עדיין יש בעיה, בדוק את `sanitizeText()` function

---

## 📚 עדכונים עתידיים

### רעיונות לשיפור
- [ ] Scheduler - תזמון שליחה לשעות מסוימות
- [ ] Templates - תבניות הודעה מותאמות אישית
- [ ] Multi-channel - תמיכה ב-Telegram, SMS
- [ ] Analytics - גרפים וויזואליזציות
- [ ] Webhooks - הודעות על events מסוימים

---

## 📞 תמיכה

לבעיות או שאלות:
1. בדוק את ה-logs
2. בדוק את ה-Audit Log ב-DB
3. צור issue ב-repository

**רישום מהיר:**
```sql
-- Recent audit logs
SELECT * FROM "WhatsAppAuditLog" 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Pending items
SELECT * FROM "DistributionItem" 
WHERE status IN ('PENDING', 'IN_PROGRESS');

-- Today's quota usage
SELECT g.name, 
       COUNT(*) as sent_today,
       g."dailyQuota" as quota
FROM "DistributionItem" d
JOIN "WhatsAppGroup" g ON d."groupId" = g.id
WHERE d.status = 'SENT' 
  AND d."sentAt" >= CURRENT_DATE
GROUP BY g.id, g.name, g."dailyQuota";
```

---

**🎉 המערכת מוכנה לשימוש!**
