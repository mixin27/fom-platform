ALTER TABLE "sessions"
ADD COLUMN "platform" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN "deviceId" TEXT,
ADD COLUMN "deviceName" TEXT;

CREATE INDEX "sessions_userId_platform_revokedAt_idx"
ON "sessions"("userId", "platform", "revokedAt");

CREATE INDEX "sessions_userId_platform_deviceId_revokedAt_idx"
ON "sessions"("userId", "platform", "deviceId", "revokedAt");
