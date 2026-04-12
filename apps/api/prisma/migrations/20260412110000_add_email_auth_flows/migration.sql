CREATE TABLE "email_action_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "requestedIpAddress" TEXT,
    "requestedUserAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_action_tokens_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "email_outbox"
ADD COLUMN "templateKey" TEXT,
ADD COLUMN "fromEmail" TEXT,
ADD COLUMN "fromName" TEXT,
ADD COLUMN "replyToEmail" TEXT,
ADD COLUMN "replyToName" TEXT,
ADD COLUMN "htmlBody" TEXT,
ADD COLUMN "providerMessageId" TEXT,
ADD COLUMN "sentAt" TIMESTAMP(3),
ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "metadata" JSONB;

ALTER TABLE "email_outbox" RENAME COLUMN "deliveryMode" TO "providerKey";

CREATE UNIQUE INDEX "email_action_tokens_tokenHash_key" ON "email_action_tokens"("tokenHash");
CREATE INDEX "email_action_tokens_userId_purpose_expiresAt_idx" ON "email_action_tokens"("userId", "purpose", "expiresAt");
CREATE INDEX "email_action_tokens_email_purpose_expiresAt_idx" ON "email_action_tokens"("email", "purpose", "expiresAt");
CREATE INDEX "email_outbox_category_queuedAt_idx" ON "email_outbox"("category", "queuedAt");

ALTER TABLE "email_action_tokens"
ADD CONSTRAINT "email_action_tokens_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
