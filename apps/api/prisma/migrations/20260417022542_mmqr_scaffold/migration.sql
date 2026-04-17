-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerTxnId" TEXT,
    "providerOrderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MMK',
    "qrPayload" TEXT,
    "qrImageUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "rawCreateResponse" JSONB,
    "rawWebhookPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_providerTxnId_key" ON "payment_transactions"("providerTxnId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_providerOrderId_key" ON "payment_transactions"("providerOrderId");

-- CreateIndex
CREATE INDEX "payment_transactions_paymentId_status_createdAt_idx" ON "payment_transactions"("paymentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "payment_transactions_provider_status_createdAt_idx" ON "payment_transactions"("provider", "status", "createdAt");

-- CreateIndex
CREATE INDEX "payment_webhook_events_provider_processed_createdAt_idx" ON "payment_webhook_events"("provider", "processed", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_eventId_key" ON "payment_webhook_events"("provider", "eventId");

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
