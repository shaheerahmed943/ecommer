import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import {
  BundleConfig,
  PaginatedResult,
  ProductDTO,
  ProductQueryFilters,
} from "../types";

const DEFAULT_COIL_COLLECTIONS = [
  "food-beverages-tobacco-tobacco-products-vaporizers-electronic-cigarettes-replacement-coils",
  "food-beverages-tobacco-tobacco-products-vaporizers-electronic-cigarettes-vaporizer-coils-pods",
];
const LEGACY_COIL_COLLECTION = "pods-coils";

export function defaultBundleConfig(collectionSlugs: string[] = []): BundleConfig {
  return {
    heading: "Build your bundle",
    description: "Choose your required options and free products.",
    mainLabel: "Select main product option",
    freeProductLabel: "Free product",
    freeProductCount: 2,
    componentCollections: collectionSlugs,
    flavourCollections: collectionSlugs,
    coilCollections: DEFAULT_COIL_COLLECTIONS,
    componentProductIds: [],
    coilProductIds: [],
    flavourProductIds: [],
    minCoils: 1,
    maxCoils: 1,
    minFlavours: 2,
    maxFlavours: 2,
    bundlePrice: null,
    discountType: "PERCENTAGE",
    discountValue: 0,
    steps: ["Select main product", "Select flavours", "Select coils", "Review bundle"],
  };
}

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

/**
 * Builds a Prisma `where` clause from the public-facing filter object.
 * Kept isolated from the controller so unit tests can exercise filter
 * logic without spinning up an HTTP layer.
 */
function buildWhereClause(filters: ProductQueryFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
  };

  if (filters.productIds?.length) {
    where.id = { in: filters.productIds };
  }

  if (filters.categorySlug) {
    where.category = {
      OR: [
        { slug: filters.categorySlug },
        { parent: { slug: filters.categorySlug } },
      ],
    };
  }

  if (filters.subcategorySlug) {
    where.category = { slug: filters.subcategorySlug };
  }

  if (filters.fabric?.length) {
    where.fabricTags = { hasSome: filters.fabric };
  }

  if (filters.type?.length) {
    where.type = { in: filters.type };
  }

  if (filters.size?.length) {
    where.variants = {
      some: { size: { in: filters.size }, isActive: true, stockQuantity: { gt: 0 } },
    };
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.basePrice = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { fabricTags: { hasSome: [filters.search] } },
    ];
  }

  return where;
}

function buildOrderBy(
  sortBy: ProductQueryFilters["sortBy"],
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sortBy) {
    case "price_asc":
      return [{ basePrice: "asc" }];
    case "price_desc":
      return [{ basePrice: "desc" }];
    case "featured":
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
    case "best_selling":
      // Proxy for best-selling: highest order-item count. A dedicated
      // materialized view (`product_sales_stats`) is recommended at scale.
      return [{ orderItems: { _count: "desc" } }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

function toProductDTO(
  product: Prisma.ProductGetPayload<{
    include: {
      images: true;
      variants: true;
      reviews: { select: { rating: true } };
      pairedProducts: { include: { pairedProduct: { include: { images: true, variants: true } } } };
      relatedProducts: { include: { relatedProduct: { include: { images: true, variants: true } } } };
    };
  }>,
): ProductDTO {
  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : undefined;

  const bundleConfig = product.bundleConfig
    ? {
        ...defaultBundleConfig(product.bundleCollectionSlugs),
        ...(product.bundleConfig as object),
      } as BundleConfig
    : defaultBundleConfig(product.bundleCollectionSlugs);

  if (product.bundleEnabled && !bundleConfig.coilCollections.length && !bundleConfig.coilProductIds.length) {
    bundleConfig.coilCollections = DEFAULT_COIL_COLLECTIONS;
    bundleConfig.minCoils = 1;
    bundleConfig.maxCoils = 1;
  }
  if (bundleConfig.coilCollections.includes(LEGACY_COIL_COLLECTION)) {
    bundleConfig.coilCollections = [
      ...bundleConfig.coilCollections.filter((slug) => slug !== LEGACY_COIL_COLLECTION),
      ...DEFAULT_COIL_COLLECTIONS,
    ];
  }

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    brand: product.brand,
    description: product.description,
    fabricDetails: product.fabricDetails,
    careInstructions: product.careInstructions,
    basePrice: Number(product.basePrice),
    status: product.status,
    type: product.type,
    isFeatured: product.isFeatured,
    fabricTags: product.fabricTags,
    productKind: product.productKind,
    nicotineStrength: product.nicotineStrength,
    flavour: product.flavour,
    deviceType: product.deviceType,
    capacity: product.capacity,
    puffCount: product.puffCount,
    batteryCapacity: product.batteryCapacity,
    coilResistance: product.coilResistance,
    pgVgRatio: product.pgVgRatio,
    isNicotineFree: product.isNicotineFree,
    ageRestricted: product.ageRestricted,
    bundleEnabled: product.bundleEnabled,
    bundleCollectionSlugs: product.bundleCollectionSlugs,
    bundleConfig,
    categoryId: product.categoryId,
    pairedProducts: product.pairedProducts.map(({ pairedProduct }) => ({
      id: pairedProduct.id,
      title: pairedProduct.title,
      slug: pairedProduct.slug,
      imageUrl: pairedProduct.images.find((image) => image.isPrimary)?.url ?? pairedProduct.images[0]?.url ?? null,
      basePrice: Number(pairedProduct.basePrice),
      variants: pairedProduct.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        fabricOption: variant.fabricOption,
        flavour: variant.flavour,
        nicotineStrength: variant.nicotineStrength,
        imageUrl: variant.imageUrl,
        variantPrice: Number(variant.variantPrice),
        stockQuantity: variant.stockQuantity,
        isActive: variant.isActive,
      })),
    })),
    relatedProducts: product.relatedProducts.map(({ relatedProduct }) => ({
      id: relatedProduct.id,
      title: relatedProduct.title,
      slug: relatedProduct.slug,
      imageUrl: relatedProduct.images.find((image) => image.isPrimary)?.url ?? relatedProduct.images[0]?.url ?? null,
      basePrice: Number(relatedProduct.basePrice),
      variants: relatedProduct.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        fabricOption: variant.fabricOption,
        flavour: variant.flavour,
        nicotineStrength: variant.nicotineStrength,
        imageUrl: variant.imageUrl,
        variantPrice: Number(variant.variantPrice),
        stockQuantity: variant.stockQuantity,
        isActive: variant.isActive,
      })),
    })),
    images: product.images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      fabricOption: v.fabricOption,
      flavour: v.flavour,
      nicotineStrength: v.nicotineStrength,
      imageUrl: v.imageUrl,
      variantPrice: Number(v.variantPrice),
      stockQuantity: v.stockQuantity,
      isActive: v.isActive,
    })),
    averageRating,
    reviewCount,
  };
}

export async function queryProducts(
  filters: ProductQueryFilters,
): Promise<PaginatedResult<ProductDTO>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, filters.pageSize ?? DEFAULT_PAGE_SIZE);

  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sortBy);

  const [totalItems, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: true,
        variants: true,
        reviews: { select: { rating: true } },
        pairedProducts: { include: { pairedProduct: { include: { images: true, variants: true } } } },
        relatedProducts: { include: { relatedProduct: { include: { images: true, variants: true } } } },
      },
    }),
  ]);

  return {
    data: products.map(toProductDTO),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: true,
      variants: true,
      reviews: { select: { rating: true } },
      pairedProducts: { include: { pairedProduct: { include: { images: true, variants: true } } } },
      relatedProducts: { include: { relatedProduct: { include: { images: true, variants: true } } } },
    },
  });

  return product ? toProductDTO(product) : null;
}

/**
 * Returns live stock + resolved price for a specific variant selection.
 * Used by the PDP variant selector to instantly reflect availability.
 */
export async function getVariantAvailability(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant || !variant.isActive) {
    return { available: false, stockQuantity: 0, price: null };
  }

  return {
    available: variant.stockQuantity > 0,
    stockQuantity: variant.stockQuantity,
    price: Number(variant.variantPrice),
  };
}
