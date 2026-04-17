-- CreateTable
CREATE TABLE "public_contact_submissions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "emailMessageId" TEXT,
    "emailStatus" TEXT NOT NULL DEFAULT 'queued',
    "ipFingerprint" TEXT,
    "userAgent" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "public_contact_submissions_emailMessageId_key" ON "public_contact_submissions"("emailMessageId");

-- CreateIndex
CREATE INDEX "public_contact_submissions_archived_createdAt_idx" ON "public_contact_submissions"("archived", "createdAt");

-- CreateIndex
CREATE INDEX "public_contact_submissions_createdAt_idx" ON "public_contact_submissions"("createdAt");

-- AddForeignKey
ALTER TABLE "public_contact_submissions" ADD CONSTRAINT "public_contact_submissions_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "email_outbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;
