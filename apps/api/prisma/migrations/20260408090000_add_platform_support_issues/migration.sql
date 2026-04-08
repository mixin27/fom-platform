-- CreateTable
CREATE TABLE "platform_support_issues" (
    "id" TEXT NOT NULL,
    "issueKey" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "shopId" TEXT,
    "shopNameSnapshot" TEXT,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedToUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdByUserId" TEXT,
    "lastDetectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_support_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_support_issues_issueKey_key" ON "platform_support_issues"("issueKey");

-- CreateIndex
CREATE INDEX "platform_support_issues_status_severity_occurredAt_idx" ON "platform_support_issues"("status", "severity", "occurredAt");

-- CreateIndex
CREATE INDEX "platform_support_issues_source_isActive_lastDetectedAt_idx" ON "platform_support_issues"("source", "isActive", "lastDetectedAt");

-- CreateIndex
CREATE INDEX "platform_support_issues_shopId_status_idx" ON "platform_support_issues"("shopId", "status");

-- AddForeignKey
ALTER TABLE "platform_support_issues" ADD CONSTRAINT "platform_support_issues_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_support_issues" ADD CONSTRAINT "platform_support_issues_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_support_issues" ADD CONSTRAINT "platform_support_issues_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
