-- CreateTable
CREATE TABLE "order_import_batches" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "importedByUserId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "sourceRowCount" INTEGER NOT NULL,
    "importedOrderCount" INTEGER NOT NULL,
    "importedItemCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_import_batches_shopId_fileHash_key" ON "order_import_batches"("shopId", "fileHash");

-- CreateIndex
CREATE INDEX "order_import_batches_shopId_createdAt_idx" ON "order_import_batches"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "order_import_batches_importedByUserId_createdAt_idx" ON "order_import_batches"("importedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "order_import_batches" ADD CONSTRAINT "order_import_batches_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_import_batches" ADD CONSTRAINT "order_import_batches_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
