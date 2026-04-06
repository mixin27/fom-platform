CREATE TYPE "DeliveryStatus" AS ENUM ('scheduled', 'out_for_delivery', 'delivered');

CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverUserId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'scheduled',
    "deliveryFee" INTEGER,
    "addressSnapshot" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");
CREATE INDEX "deliveries_driverUserId_status_idx" ON "deliveries"("driverUserId", "status");
CREATE INDEX "deliveries_status_scheduledAt_idx" ON "deliveries"("status", "scheduledAt");

ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driverUserId_fkey" FOREIGN KEY ("driverUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
