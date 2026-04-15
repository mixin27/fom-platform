ALTER TABLE "roles"
ADD COLUMN "shopId" TEXT;

CREATE INDEX "roles_shopId_scope_isSystem_idx"
ON "roles"("shopId", "scope", "isSystem");

ALTER TABLE "roles"
ADD CONSTRAINT "roles_shopId_fkey"
FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE TABLE "shop_audit_logs" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorNameSnapshot" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "shop_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shop_audit_logs_shopId_createdAt_idx"
ON "shop_audit_logs"("shopId", "createdAt");

CREATE INDEX "shop_audit_logs_shopId_action_createdAt_idx"
ON "shop_audit_logs"("shopId", "action", "createdAt");

ALTER TABLE "shop_audit_logs"
ADD CONSTRAINT "shop_audit_logs_shopId_fkey"
FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "shop_audit_logs"
ADD CONSTRAINT "shop_audit_logs_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
