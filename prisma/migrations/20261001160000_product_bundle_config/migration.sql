ALTER TABLE "Product"
ADD COLUMN "bundleEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "bundleCollectionSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "OrderItem"
ADD COLUMN "bundleGroupId" TEXT;