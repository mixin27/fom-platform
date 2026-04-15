CREATE TABLE "plan_limits" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "value" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plan_limits_planId_sortOrder_idx" ON "plan_limits"("planId", "sortOrder");
CREATE UNIQUE INDEX "plan_limits_planId_code_key" ON "plan_limits"("planId", "code");

ALTER TABLE "plan_limits"
ADD CONSTRAINT "plan_limits_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
