-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('USER', 'ADMIN', 'GUEST');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "SupportNotificationType" AS ENUM ('ADMIN_REPLY', 'NEW_MESSAGE');

-- DropIndex
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "EmailAuditLog" ALTER COLUMN "commandType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmailRequest" ALTER COLUMN "commandType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PendingIntent" ALTER COLUMN "commandType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestEmail" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" TEXT,
    "adminLastReadAt" TIMESTAMP(3),
    "userLastReadAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "senderUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredToEmailAt" TIMESTAMP(3),
    "emailDeliveryStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "type" "SupportNotificationType" NOT NULL DEFAULT 'ADMIN_REPLY',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_guestEmail_idx" ON "Conversation"("guestEmail");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_emailDeliveryStatus_idx" ON "Message"("emailDeliveryStatus");

-- CreateIndex
CREATE INDEX "SupportNotification_userId_idx" ON "SupportNotification"("userId");

-- CreateIndex
CREATE INDEX "SupportNotification_conversationId_idx" ON "SupportNotification"("conversationId");

-- CreateIndex
CREATE INDEX "SupportNotification_isRead_idx" ON "SupportNotification"("isRead");

-- CreateIndex
CREATE INDEX "SupportNotification_createdAt_idx" ON "SupportNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportNotification" ADD CONSTRAINT "SupportNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportNotification" ADD CONSTRAINT "SupportNotification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
