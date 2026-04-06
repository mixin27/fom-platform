CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortcut" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "message_templates_shopId_title_key" ON "message_templates"("shopId", "title");
CREATE UNIQUE INDEX "message_templates_shopId_shortcut_key" ON "message_templates"("shopId", "shortcut");
CREATE INDEX "message_templates_shopId_isActive_updatedAt_idx" ON "message_templates"("shopId", "isActive", "updatedAt");

ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
