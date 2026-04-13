ALTER TABLE "plan_items"
ADD COLUMN "code" TEXT;

WITH normalized AS (
  SELECT
    source.id,
    source."planId",
    CASE
      WHEN source.base_code = '' THEN 'item'
      ELSE source.base_code
    END AS base_code,
    ROW_NUMBER() OVER (
      PARTITION BY source."planId",
      CASE
        WHEN source.base_code = '' THEN 'item'
        ELSE source.base_code
      END
      ORDER BY source."sortOrder" ASC, source."createdAt" ASC, source.id ASC
    ) AS sequence_number
  FROM (
    SELECT
      id,
      "planId",
      "sortOrder",
      "createdAt",
      trim(
        BOTH '.'
        FROM regexp_replace(lower(coalesce(label, '')), '[^a-z0-9]+', '.', 'g')
      ) AS base_code
    FROM "plan_items"
  ) AS source
)
UPDATE "plan_items" AS items
SET "code" = CASE
  WHEN normalized.sequence_number = 1 THEN normalized.base_code
  ELSE normalized.base_code || '.' || normalized.sequence_number::text
END
FROM normalized
WHERE items.id = normalized.id;

ALTER TABLE "plan_items"
ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "plan_items_planId_code_key" ON "plan_items"("planId", "code");
