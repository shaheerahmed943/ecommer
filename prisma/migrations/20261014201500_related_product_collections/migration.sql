ALTER TABLE "Product" ADD COLUMN "relatedCollectionSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
