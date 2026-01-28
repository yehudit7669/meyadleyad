-- Email Operations System Tables
-- מערכת דיוור דרך אימייל - טבלאות וספציפיקציות מלאות

-- Email Inbound Messages: שמירת כל הודעות האימייל הנכנסות כפי שהתקבלו
CREATE TABLE "EmailInboundMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,         -- Message-ID header
    "from" TEXT NOT NULL,               -- כתובת השולח
    "to" TEXT NOT NULL,                 -- כתובת היעד
    "subject" TEXT NOT NULL,            -- שורת הנושא
    "bodyText" TEXT,                    -- גוף ההודעה (text/plain)
    "bodyHtml" TEXT,                    -- גוף ההודעה (text/html)
    "headers" JSONB,                    -- כל ה-headers (Message-ID, In-Reply-To, References, וכו')
    "attachments" JSONB,                -- מטא-דאטה על קבצים מצורפים
    "inReplyTo" TEXT,                   -- In-Reply-To header
    "references" TEXT,                  -- References header
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailInboundMessage_pkey" PRIMARY KEY ("id")
);

-- Email Requests: פעולות/בקשות שנוצרו מאימיילים נכנסים
CREATE TABLE "EmailRequest" (
    "id" TEXT NOT NULL,
    "inboundMessageId" TEXT NOT NULL,   -- קישור להודעה המקורית
    "senderEmail" TEXT NOT NULL,        -- כתובת השולח
    "commandType" TEXT NOT NULL,        -- סוג הפקודה: PUBLISH_SALE, PUBLISH_RENT, UPDATE, REMOVE, וכו'
    "adId" TEXT,                        -- מזהה מודעה (לעדכון/הסרה)
    "status" TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    "payload" JSONB,                    -- נתונים נוספים (פרטי הבקשה)
    "failReason" TEXT,                  -- סיבת כשל (פנימית)
    "publicFailMessage" TEXT,           -- הודעת שגיאה כללית למשתמש
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailRequest_pkey" PRIMARY KEY ("id")
);

-- Pending Intents: שמירת כוונות משתמשים לא רשומים
-- כשמשתמש לא רשום שולח בקשה, נשמור את הכוונה עד שישלים הרשמה
CREATE TABLE "PendingIntent" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,              -- כתובת האימייל
    "commandType" TEXT NOT NULL,        -- סוג הבקשה המקורית
    "inboundMessageId" TEXT NOT NULL,   -- הודעה מקורית
    "payload" JSONB,                    -- נתוני הבקשה
    "status" TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, EXPIRED, COMPLETED
    "registrationSent" BOOLEAN NOT NULL DEFAULT false,
    "registrationSentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingIntent_pkey" PRIMARY KEY ("id")
);

-- Email Operations Mailing List: רשימת תפוצה עבור "קובץ הדירות השבועי"
-- שים לב: טבלה זו שונה מ-MailingListSubscriber הקיימת (שמשמשת לפעולות אחרות)
CREATE TABLE "EmailOperationsMailingList" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, REMOVED
    "source" TEXT NOT NULL DEFAULT 'email',   -- email, web, admin
    "subscriptionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribeToken" TEXT UNIQUE,
    "removedAt" TIMESTAMP(3),
    "lastCommandAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOperationsMailingList_pkey" PRIMARY KEY ("id")
);

-- Email Rate Limit: ניטור ו-rate limiting לפי כתובת
CREATE TABLE "EmailRateLimit" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRequestAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inCooldown" BOOLEAN NOT NULL DEFAULT false,
    "cooldownUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailRateLimit_pkey" PRIMARY KEY ("id")
);

-- Email Audit Trail: תיעוד כל פעולה/ניסיון פעולה דרך אימייל
CREATE TABLE "EmailAuditLog" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "action" TEXT NOT NULL,              -- הפעולה שביקש
    "commandType" TEXT NOT NULL,
    "adId" TEXT,
    "success" BOOLEAN NOT NULL,
    "failReason" TEXT,                   -- סיבת כשל פנימית
    "publicMessage" TEXT,                -- הודעה שנשלחה למשתמש
    "metadata" JSONB,                    -- מטא-דאטה נוסף
    "ip" TEXT,
    "userAgent" TEXT,
    "inboundMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAuditLog_pkey" PRIMARY KEY ("id")
);

-- Indexes for performance
CREATE INDEX "EmailInboundMessage_messageId_idx" ON "EmailInboundMessage"("messageId");
CREATE INDEX "EmailInboundMessage_from_idx" ON "EmailInboundMessage"("from");
CREATE INDEX "EmailInboundMessage_subject_idx" ON "EmailInboundMessage"("subject");
CREATE INDEX "EmailInboundMessage_processed_idx" ON "EmailInboundMessage"("processed");
CREATE INDEX "EmailInboundMessage_receivedAt_idx" ON "EmailInboundMessage"("receivedAt");

CREATE INDEX "EmailRequest_senderEmail_idx" ON "EmailRequest"("senderEmail");
CREATE INDEX "EmailRequest_commandType_idx" ON "EmailRequest"("commandType");
CREATE INDEX "EmailRequest_status_idx" ON "EmailRequest"("status");
CREATE INDEX "EmailRequest_adId_idx" ON "EmailRequest"("adId");
CREATE INDEX "EmailRequest_createdAt_idx" ON "EmailRequest"("createdAt");

CREATE INDEX "PendingIntent_email_idx" ON "PendingIntent"("email");
CREATE INDEX "PendingIntent_status_idx" ON "PendingIntent"("status");
CREATE INDEX "PendingIntent_expiresAt_idx" ON "PendingIntent"("expiresAt");

CREATE INDEX "EmailOperationsMailingList_email_idx" ON "EmailOperationsMailingList"("email");
CREATE INDEX "EmailOperationsMailingList_status_idx" ON "EmailOperationsMailingList"("status");

CREATE UNIQUE INDEX "EmailRateLimit_email_key" ON "EmailRateLimit"("email");
CREATE INDEX "EmailRateLimit_inCooldown_idx" ON "EmailRateLimit"("inCooldown");
CREATE INDEX "EmailRateLimit_windowStartedAt_idx" ON "EmailRateLimit"("windowStartedAt");

CREATE INDEX "EmailAuditLog_email_idx" ON "EmailAuditLog"("email");
CREATE INDEX "EmailAuditLog_action_idx" ON "EmailAuditLog"("action");
CREATE INDEX "EmailAuditLog_commandType_idx" ON "EmailAuditLog"("commandType");
CREATE INDEX "EmailAuditLog_adId_idx" ON "EmailAuditLog"("adId");
CREATE INDEX "EmailAuditLog_createdAt_idx" ON "EmailAuditLog"("createdAt");
CREATE INDEX "EmailAuditLog_success_idx" ON "EmailAuditLog"("success");

-- Foreign Keys
ALTER TABLE "EmailRequest" ADD CONSTRAINT "EmailRequest_inboundMessageId_fkey" FOREIGN KEY ("inboundMessageId") REFERENCES "EmailInboundMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PendingIntent" ADD CONSTRAINT "PendingIntent_inboundMessageId_fkey" FOREIGN KEY ("inboundMessageId") REFERENCES "EmailInboundMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailAuditLog" ADD CONSTRAINT "EmailAuditLog_inboundMessageId_fkey" FOREIGN KEY ("inboundMessageId") REFERENCES "EmailInboundMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
