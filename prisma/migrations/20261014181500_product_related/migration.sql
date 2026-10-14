CREATE TABLE "ProductRelated" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductRelated_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductRelated_productId_relatedProductId_key" ON "ProductRelated"("productId", "relatedProductId");
CREATE INDEX "ProductRelated_productId_idx" ON "ProductRelated"("productId");
CREATE INDEX "ProductRelated_relatedProductId_idx" ON "ProductRelated"("relatedProductId");

ALTER TABLE "ProductRelated" ADD CONSTRAINT "ProductRelated_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductRelated" ADD CONSTRAINT "ProductRelated_relatedProductId_fkey"
FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
