CREATE TABLE "ProductPair" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pairedProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPair_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductPair_productId_pairedProductId_key" ON "ProductPair"("productId", "pairedProductId");
CREATE INDEX "ProductPair_productId_idx" ON "ProductPair"("productId");
CREATE INDEX "ProductPair_pairedProductId_idx" ON "ProductPair"("pairedProductId");

ALTER TABLE "ProductPair" ADD CONSTRAINT "ProductPair_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPair" ADD CONSTRAINT "ProductPair_pairedProductId_fkey"
  FOREIGN KEY ("pairedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
