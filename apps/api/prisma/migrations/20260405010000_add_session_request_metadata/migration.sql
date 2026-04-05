-- AlterTable
ALTER TABLE "sessions"
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "lastUsedIpAddress" TEXT,
ADD COLUMN     "lastUsedUserAgent" TEXT;
