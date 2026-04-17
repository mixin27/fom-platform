-- CreateTable
CREATE TABLE "messenger_connections" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT,
    "pageAccessTokenEncrypted" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastWebhookAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messenger_threads" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "customerPsid" TEXT NOT NULL,
    "customerName" TEXT,
    "customerLocale" TEXT,
    "lastMessageText" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messenger_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "senderPsid" TEXT,
    "recipientId" TEXT,
    "textBody" TEXT,
    "isEcho" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messenger_auto_reply_rules" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "matchType" TEXT NOT NULL DEFAULT 'contains',
    "pattern" TEXT NOT NULL,
    "replyText" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_auto_reply_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "messenger_connections_shopId_key" ON "messenger_connections"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_connections_pageId_key" ON "messenger_connections"("pageId");

-- CreateIndex
CREATE INDEX "messenger_connections_status_updatedAt_idx" ON "messenger_connections"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_threads_connectionId_customerPsid_key" ON "messenger_threads"("connectionId", "customerPsid");

-- CreateIndex
CREATE INDEX "messenger_threads_shopId_lastMessageAt_idx" ON "messenger_threads"("shopId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "messenger_threads_connectionId_lastMessageAt_idx" ON "messenger_threads"("connectionId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_messages_threadId_providerMessageId_key" ON "messenger_messages"("threadId", "providerMessageId");

-- CreateIndex
CREATE INDEX "messenger_messages_threadId_sentAt_idx" ON "messenger_messages"("threadId", "sentAt");

-- CreateIndex
CREATE INDEX "messenger_messages_direction_sentAt_idx" ON "messenger_messages"("direction", "sentAt");

-- CreateIndex
CREATE INDEX "messenger_auto_reply_rules_shopId_isActive_updatedAt_idx" ON "messenger_auto_reply_rules"("shopId", "isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "messenger_auto_reply_rules_shopId_matchType_idx" ON "messenger_auto_reply_rules"("shopId", "matchType");

-- AddForeignKey
ALTER TABLE "messenger_connections" ADD CONSTRAINT "messenger_connections_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_threads" ADD CONSTRAINT "messenger_threads_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_threads" ADD CONSTRAINT "messenger_threads_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "messenger_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_messages" ADD CONSTRAINT "messenger_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "messenger_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_auto_reply_rules" ADD CONSTRAINT "messenger_auto_reply_rules_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
