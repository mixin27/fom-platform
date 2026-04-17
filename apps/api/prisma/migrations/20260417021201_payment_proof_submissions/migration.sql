-- CreateTable
CREATE TABLE "payment_proof_submissions" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceNoSnapshot" TEXT NOT NULL,
    "amountClaimed" INTEGER NOT NULL,
    "currencyClaimed" TEXT NOT NULL DEFAULT 'MMK',
    "paymentChannel" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "senderName" TEXT,
    "senderPhone" TEXT,
    "transactionRef" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "adminNote" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_proof_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_proof_submissions_shopId_createdAt_idx" ON "payment_proof_submissions"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_proof_submissions_paymentId_status_createdAt_idx" ON "payment_proof_submissions"("paymentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "payment_proof_submissions_status_createdAt_idx" ON "payment_proof_submissions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payment_proof_submissions_transactionRef_idx" ON "payment_proof_submissions"("transactionRef");

-- AddForeignKey
ALTER TABLE "payment_proof_submissions" ADD CONSTRAINT "payment_proof_submissions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proof_submissions" ADD CONSTRAINT "payment_proof_submissions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proof_submissions" ADD CONSTRAINT "payment_proof_submissions_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
