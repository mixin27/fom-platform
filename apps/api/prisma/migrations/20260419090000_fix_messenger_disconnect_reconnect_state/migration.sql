-- Preserve the last active Facebook Page identity even after a shop disconnects
-- so thread history stays readable while the active page mapping can be cleared.
ALTER TABLE "messenger_connections"
ADD COLUMN "lastConnectedPageId" TEXT,
ADD COLUMN "lastConnectedPageName" TEXT;

DROP INDEX "messenger_connections_shopId_key";

UPDATE "messenger_connections"
SET
  "lastConnectedPageId" = "pageId",
  "lastConnectedPageName" = COALESCE("pageName", "pageId")
WHERE "lastConnectedPageId" IS NULL;

ALTER TABLE "messenger_connections"
ALTER COLUMN "pageId" DROP NOT NULL;

CREATE INDEX "messenger_connections_shopId_status_updatedAt_idx"
ON "messenger_connections"("shopId", "status", "updatedAt");
