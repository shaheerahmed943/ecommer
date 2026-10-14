import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";
import { BundleConfig, DiscountType } from "../types";

const DEFAULT_COIL_COLLECTIONS = [
  "food-beverages-tobacco-tobacco-products-vaporizers-electronic-cigarettes-replacement-coils",
  "food-beverages-tobacco-tobacco-products-vaporizers-electronic-cigarettes-vaporizer-coils-pods",
];
const LEGACY_COIL_COLLECTION = "pods-coils";
import { OrderStatus, ProductType, SizeLabel } from "../types";
import { creditOrderRewards } from "./reward.service";

// -------------------------------------------------------------------------
// Categories
// -------------------------------------------------------------------------

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { children: true },
  });
}

export interface CategoryContentInput {
  name: string;
  slug?: string;
  description?: string;
  pageHeading?: string;
  breadcrumbLabel?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
}

export async function createCategory(input: string | CategoryContentInput, legacyParentId?: string) {
  const values = typeof input === "string" ? { name: input, parentId: legacyParentId } : input;
  const slug = slugify(values.slug || values.name);

  return prisma.category.create({
    data: {
      name: values.name,
      slug,
      description: values.description,
      pageHeading: values.pageHeading,
      breadcrumbLabel: values.breadcrumbLabel,
      imageUrl: values.imageUrl,
      parentId: values.parentId,
      isActive: values.isActive ?? true,
    },
  });
}

export async function updateCategory(categoryId: string, input: CategoryContentInput) {
  return prisma.category.update({
    where: { id: categoryId },
    data: {
      name: input.name,
      slug: slugify(input.slug || input.name),
      description: input.description,
      pageHeading: input.pageHeading,
      breadcrumbLabel: input.breadcrumbLabel,
      imageUrl: input.imageUrl,
      isActive: input.isActive ?? true,
    },
  });
}

export async function getCollectionContent(slug: string) {
  return prisma.category.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, description: true, pageHeading: true, breadcrumbLabel: true, imageUrl: true },
  });
}

// -------------------------------------------------------------------------
// Products (admin sees every status; storefront only sees ACTIVE)
// -------------------------------------------------------------------------

export interface AdminVariantInput {
  sku?: string;
  size: SizeLabel;
  color: string;
  fabricOption?: string;
  imageUrl?: string;
  variantPrice: number;
  stockQuantity: number;
}

export interface AdminImageInput {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export interface AdminProductInput {
  title: string;
  slug?: string;
  description: string;
  fabricDetails?: string;
  careInstructions?: string;
  basePrice: number;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";
  type: ProductType;
  isFeatured: boolean;
  fabricTags: string[];
  productKind?: string;
  nicotineStrength?: string;
  flavour?: string;
  deviceType?: string;
  capacity?: string;
  puffCount?: number;
  batteryCapacity?: string;
  coilResistance?: string;
  pgVgRatio?: string;
  isNicotineFree?: boolean;
  ageRestricted?: boolean;
  bundleEnabled?: boolean;
  bundleCollectionSlugs?: string[];
  relatedCollectionSlugs?: string[];
  pairedProductIds?: string[];
  relatedProductIds?: string[];
  categoryId: string;
  images: AdminImageInput[];
  variants: AdminVariantInput[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(input: AdminProductInput) {
  if (!input.variants?.length) {
    throw new Error("At least one variant (size, color, price, stock) is required.");
  }
  if (!input.images?.length) {
    throw new Error("At least one product image is required.");
  }

  const baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
  // Ensure slug uniqueness by appending a short suffix if it already exists.
  const existing = await prisma.product.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  const skuBase = baseSlug.toUpperCase().slice(0, 12);
  const pairedProductIds = [...new Set(input.pairedProductIds ?? [])].filter(
    (pairedProductId) => pairedProductId !== undefined,
  );
  const relatedProductIds = [...new Set(input.relatedProductIds ?? [])].filter(
    (relatedProductId) => relatedProductId !== undefined,
  );
  const recommendationProductIds = [...new Set([...pairedProductIds, ...relatedProductIds])];
  if (recommendationProductIds.length) {
    const validCount = await prisma.product.count({
      where: { id: { in: recommendationProductIds }, status: "ACTIVE" },
    });
    if (validCount !== recommendationProductIds.length) {
      throw new Error("One or more recommended products are unavailable.");
    }
  }

  const created = await prisma.product.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      fabricDetails: input.fabricDetails,
      careInstructions: input.careInstructions,
      basePrice: input.basePrice,
      status: input.status ?? "ACTIVE",
      type: input.type,
      isFeatured: input.isFeatured,
      fabricTags: input.fabricTags,
      productKind: input.productKind ?? "VAPE",
      nicotineStrength: input.nicotineStrength,
      flavour: input.flavour,
      deviceType: input.deviceType,
      capacity: input.capacity,
      puffCount: input.puffCount,
      batteryCapacity: input.batteryCapacity,
      coilResistance: input.coilResistance,
      pgVgRatio: input.pgVgRatio,
      isNicotineFree: input.isNicotineFree ?? false,
      ageRestricted: input.ageRestricted ?? true,
      bundleEnabled: input.bundleEnabled ?? false,
      bundleCollectionSlugs: input.bundleCollectionSlugs ?? [],
      relatedCollectionSlugs: input.relatedCollectionSlugs ?? [],
      categoryId: input.categoryId,
      pairedProducts: {
        create: pairedProductIds.map((pairedProductId) => ({ pairedProductId })),
      },
      relatedProducts: {
        create: relatedProductIds.map((relatedProductId) => ({ relatedProductId })),
      },
      images: {
        create: input.images.map((img, idx) => ({
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary ?? idx === 0,
          sortOrder: idx,
        })),
      },
      variants: {
        create: input.variants.map((v, idx) => ({
          sku: v.sku ?? `${skuBase}-${v.size}-${idx + 1}`,
          size: v.size,
          color: v.color,
          fabricOption: v.fabricOption,
          imageUrl: v.imageUrl,
          variantPrice: v.variantPrice,
          stockQuantity: v.stockQuantity,
        })),
      },
    },
    include: { images: true, variants: true },
  });
  if (input.relatedCollectionSlugs?.length) {
    const relatedProducts = await prisma.product.findMany({
      where: {
        category: { slug: { in: input.relatedCollectionSlugs } },
        status: "ACTIVE",
        id: { not: created.id },
      },
      select: { id: true },
    });
    if (relatedProducts.length) {
      await prisma.productRelated.createMany({
        data: relatedProducts.map(({ id }) => ({ productId: created.id, relatedProductId: id })),
        skipDuplicates: true,
      });
    }
  }
  return created;
}

export async function getProductByIdAdmin(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      pairedProducts: { include: { pairedProduct: { select: { id: true, title: true, slug: true, status: true } } } },
      relatedProducts: { include: { relatedProduct: { select: { id: true, title: true, slug: true, status: true } } } },
    },
  });
  if (!product) return null;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
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
    relatedCollectionSlugs: product.relatedCollectionSlugs,
    pairedProducts: product.pairedProducts.map(({ pairedProduct }) => pairedProduct),
    relatedProducts: product.relatedProducts.map(({ relatedProduct }) => relatedProduct),
    categoryId: product.categoryId,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      fabricOption: v.fabricOption,
      imageUrl: v.imageUrl,
      variantPrice: Number(v.variantPrice),
      stockQuantity: v.stockQuantity,
    })),
  };
}

/**
 * Full product edit: updates scalar fields, replaces the image set, and
 * reconciles variants (update existing by id, create new ones without an
 * id, delete ones present in DB but missing from the submitted list).
 */
export async function updateProduct(productId: string, input: Omit<AdminProductInput, "variants"> & {
  variants: (AdminVariantInput & { id?: string })[];
}) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        title: input.title,
        description: input.description,
        fabricDetails: input.fabricDetails,
        careInstructions: input.careInstructions,
        basePrice: input.basePrice,
        status: input.status ?? "ACTIVE",
        type: input.type,
        isFeatured: input.isFeatured,
        fabricTags: input.fabricTags,
        productKind: input.productKind ?? "VAPE",
        nicotineStrength: input.nicotineStrength,
        flavour: input.flavour,
        deviceType: input.deviceType,
        capacity: input.capacity,
        puffCount: input.puffCount,
        batteryCapacity: input.batteryCapacity,
        coilResistance: input.coilResistance,
        pgVgRatio: input.pgVgRatio,
        isNicotineFree: input.isNicotineFree ?? false,
        ageRestricted: input.ageRestricted ?? true,
        ...(input.bundleEnabled !== undefined ? { bundleEnabled: input.bundleEnabled } : {}),
        ...(input.bundleCollectionSlugs !== undefined ? { bundleCollectionSlugs: input.bundleCollectionSlugs } : {}),
        ...(input.relatedCollectionSlugs !== undefined ? { relatedCollectionSlugs: input.relatedCollectionSlugs } : {}),
        categoryId: input.categoryId,
      },
    });

    if (input.pairedProductIds !== undefined) {
      const pairedProductIds = [...new Set(input.pairedProductIds)].filter((id) => id !== productId);
      const validCount = await tx.product.count({
        where: { id: { in: pairedProductIds }, status: "ACTIVE" },
      });
      if (validCount !== pairedProductIds.length) throw new Error("One or more paired products are unavailable.");
      await tx.productPair.deleteMany({ where: { productId } });
      if (pairedProductIds.length) {
        await tx.productPair.createMany({
          data: pairedProductIds.map((pairedProductId) => ({ productId, pairedProductId })),
        });
      }

      if (input.relatedProductIds !== undefined || input.relatedCollectionSlugs !== undefined) {
        const collectionProductIds = input.relatedCollectionSlugs?.length
          ? await tx.product.findMany({
              where: { category: { slug: { in: input.relatedCollectionSlugs } }, status: "ACTIVE", id: { not: productId } },
              select: { id: true },
            })
          : [];
        const relatedProductIds = [...new Set(
          input.relatedCollectionSlugs !== undefined
            ? collectionProductIds.map(({ id }) => id)
            : input.relatedProductIds,
        )].filter((id) => id !== productId);
        const validCount = await tx.product.count({
          where: { id: { in: relatedProductIds }, status: "ACTIVE" },
        });
        if (validCount !== relatedProductIds.length) throw new Error("One or more related products are unavailable.");
        await tx.productRelated.deleteMany({ where: { productId } });
        if (relatedProductIds.length) {
          await tx.productRelated.createMany({
            data: relatedProductIds.map((relatedProductId) => ({ productId, relatedProductId })),
          });
        }
      }
    }

    // --- Images: simplest correct approach is replace-all ---------------
    await tx.productImage.deleteMany({ where: { productId } });
    await tx.productImage.createMany({
      data: input.images.map((img, idx) => ({
        productId,
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary ?? idx === 0,
        sortOrder: idx,
      })),
    });

    // --- Variants: reconcile by id --------------------------------------
    const existingVariants = await tx.productVariant.findMany({
      where: { productId },
      select: { id: true },
    });
    const existingIds = new Set(existingVariants.map((v) => v.id));
    const submittedIds = new Set(input.variants.filter((v) => v.id).map((v) => v.id));

    const toDelete = [...existingIds].filter((id) => !submittedIds.has(id));
    if (toDelete.length) {
      await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } });
    }

    const skuBase = updated.slug.toUpperCase().slice(0, 12);
    for (const [idx, v] of input.variants.entries()) {
      if (v.id && existingIds.has(v.id)) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: {
            size: v.size,
            color: v.color,
            fabricOption: v.fabricOption,
            imageUrl: v.imageUrl,
            variantPrice: v.variantPrice,
            stockQuantity: v.stockQuantity,
          },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId,
            sku: v.sku ?? `${skuBase}-${v.size}-${idx + 1}-${Date.now().toString(36).slice(-4)}`,
            size: v.size,
            color: v.color,
            fabricOption: v.fabricOption,
            imageUrl: v.imageUrl,
            variantPrice: v.variantPrice,
            stockQuantity: v.stockQuantity,
          },
        });
      }
    }

    return updated;
  });
}

export async function listProductsAdmin(page = 1, pageSize = 20, search = "") {
  const normalizedSearch = search.trim();
  const where = normalizedSearch
    ? {
        OR: [
          { title: { contains: normalizedSearch, mode: "insensitive" as const } },
          { slug: { contains: normalizedSearch, mode: "insensitive" as const } },
          { category: { name: { contains: normalizedSearch, mode: "insensitive" as const } } },
        ],
      }
    : undefined;
  const [totalItems, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        variants: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  return {
    data: products.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      basePrice: Number(p.basePrice),
      categoryName: p.category.name,
      bundleEnabled: p.bundleEnabled,
      bundleCollectionSlugs: p.bundleCollectionSlugs,
      imageUrl: p.images[0]?.url ?? null,
      totalStock: p.variants.reduce((sum, v) => sum + v.stockQuantity, 0),
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        variantPrice: Number(v.variantPrice),
        stockQuantity: v.stockQuantity,
      })),
    })),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function listBundleProductsAdmin() {
  const products = await prisma.product.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      type: true,
      bundleEnabled: true,
      bundleCollectionSlugs: true,
      bundleConfig: true,
      variants: {
        where: { isActive: true },
        select: { id: true, size: true, color: true, flavour: true, stockQuantity: true },
      },
    },
  });
  return products;
}

export async function updateProductBundleConfig(
  productId: string,
  bundleEnabled: boolean,
  collectionSlugs: string[],
  config?: Partial<BundleConfig>,
) {
  const uniqueSlugs = [...new Set(collectionSlugs)];
  if (bundleEnabled && !uniqueSlugs.length) {
    throw new Error("Select at least one collection before enabling this product bundle.");
  }
  if (uniqueSlugs.length) {
    const validCount = await prisma.category.count({
      where: { slug: { in: uniqueSlugs }, isActive: true },
    });
    if (validCount !== uniqueSlugs.length) throw new Error("One or more selected collections are unavailable.");
  }
  const freeProductCount = config?.freeProductCount ?? 2;
  if (!Number.isInteger(freeProductCount) || freeProductCount < 1 || freeProductCount > 10) {
    throw new Error("Free product quantity must be a whole number between 1 and 10.");
  }
  const discountType: DiscountType = config?.discountType === "FLAT" ? "FLAT" : "PERCENTAGE";
  const discountValue = Number(config?.discountValue ?? 0);
  if (!Number.isFinite(discountValue) || discountValue < 0) throw new Error("Discount must be a non-negative number.");
  if (discountType === "PERCENTAGE" && discountValue > 100) throw new Error("Percentage discount cannot exceed 100.");
  const bundlePrice = config?.bundlePrice == null ? null : Number(config.bundlePrice);
  if (bundlePrice !== null && (!Number.isFinite(bundlePrice) || bundlePrice < 0)) throw new Error("Bundle price must be a non-negative number.");
  const steps = Array.isArray(config?.steps) ? config!.steps!.map(String).map((step) => step.trim()).filter(Boolean).slice(0, 6) : [];
  if (!steps.length) throw new Error("Add at least one bundle step.");
  const componentProductIds = Array.isArray(config?.componentProductIds)
    ? [...new Set(config.componentProductIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];
  const coilProductIds = Array.isArray(config?.coilProductIds)
    ? [...new Set(config.coilProductIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];
  const flavourProductIds = Array.isArray(config?.flavourProductIds)
    ? [...new Set(config.flavourProductIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];
  const minFlavours = Number(config?.minFlavours ?? 2);
  const maxFlavours = Number(config?.maxFlavours ?? minFlavours);
  if (!Number.isInteger(minFlavours) || !Number.isInteger(maxFlavours) || minFlavours < 2 || maxFlavours < minFlavours || maxFlavours > 10) {
    throw new Error("Flavour quantity must be at least 2 and maximum must be greater than or equal to minimum.");
  }
  const coilCollections = (Array.isArray(config?.coilCollections)
    ? [...new Set(config.coilCollections.filter((slug): slug is string => typeof slug === "string" && slug.length > 0))]
    : DEFAULT_COIL_COLLECTIONS
  ).flatMap((slug) => slug === LEGACY_COIL_COLLECTION ? DEFAULT_COIL_COLLECTIONS : [slug]);
  const minCoils = Number(config?.minCoils ?? 1);
  const maxCoils = Number(config?.maxCoils ?? minCoils);
  if (!Number.isInteger(minCoils) || !Number.isInteger(maxCoils) || minCoils < 0 || maxCoils < minCoils || maxCoils > 10) {
    throw new Error("Coil quantity must be a whole number between 0 and 10, with maximum greater than or equal to minimum.");
  }
  if ((coilProductIds.length || coilCollections.length) && minCoils < 1) {
    throw new Error("Minimum coils must be at least 1 when compatible coils are configured.");
  }
  const configuredComponentIds = [...new Set([...componentProductIds, ...coilProductIds, ...flavourProductIds])];
  if (configuredComponentIds.length) {
    const activeProducts = await prisma.product.findMany({
      where: { id: { in: configuredComponentIds }, status: "ACTIVE" },
      select: { id: true },
    });
    const activeProductIds = new Set(activeProducts.map(({ id }) => id));
    componentProductIds.splice(0, componentProductIds.length, ...componentProductIds.filter((id) => activeProductIds.has(id)));
    coilProductIds.splice(0, coilProductIds.length, ...coilProductIds.filter((id) => activeProductIds.has(id)));
    flavourProductIds.splice(0, flavourProductIds.length, ...flavourProductIds.filter((id) => activeProductIds.has(id)));
  }
  const normalizedConfig: BundleConfig = {
    heading: String(config?.heading ?? "Build your bundle").trim() || "Build your bundle",
    description: String(config?.description ?? "").trim(),
    mainLabel: String(config?.mainLabel ?? "Select main product option").trim() || "Select main product option",
    freeProductLabel: String(config?.freeProductLabel ?? "Free product").trim() || "Free product",
    freeProductCount,
    componentCollections: uniqueSlugs,
    flavourCollections: Array.isArray(config?.flavourCollections)
      ? [...new Set(config.flavourCollections.filter((slug): slug is string => typeof slug === "string" && slug.length > 0))]
      : uniqueSlugs,
    coilCollections: coilCollections.length ? coilCollections : DEFAULT_COIL_COLLECTIONS,
    componentProductIds,
    coilProductIds,
    flavourProductIds,
    minCoils,
    maxCoils,
    minFlavours,
    maxFlavours,
    bundlePrice,
    discountType,
    discountValue,
    steps,
  };

  return prisma.product.update({
    where: { id: productId },
    data: { bundleEnabled, bundleCollectionSlugs: uniqueSlugs, bundleConfig: normalizedConfig as unknown as Prisma.InputJsonValue },
    select: { id: true, bundleEnabled: true, bundleCollectionSlugs: true, bundleConfig: true },
  });
}

export async function updateVariantStock(
  variantId: string,
  stockQuantity: number,
  variantPrice?: number,
) {
  return prisma.productVariant.update({
    where: { id: variantId },
    data: {
      stockQuantity,
      ...(variantPrice != null ? { variantPrice } : {}),
    },
  });
}

export async function deleteProduct(productId: string) {
  return prisma.product.delete({ where: { id: productId } });
}

// -------------------------------------------------------------------------
// Dashboard KPIs
// -------------------------------------------------------------------------

export async function getDashboardStats() {
  const [orderAgg, orderCount, statusBreakdown, lowStockVariants] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.productVariant.count({ where: { isActive: true, stockQuantity: { lte: 5 } } }),
  ]);

  const totalRevenue = Number(orderAgg._sum.totalAmount ?? 0);
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentOrders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" }, createdAt: { gte: thirtyDaysAgo } },
    select: { totalAmount: true },
  });

  return {
    totalRevenue,
    totalOrders: orderCount,
    averageOrderValue,
    revenueLast30Days: recentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    ordersLast30Days: recentOrders.length,
    lowStockVariants,
    statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count.status })),
  };
}

// -------------------------------------------------------------------------
// Orders
// -------------------------------------------------------------------------

export async function listOrdersAdmin(page = 1, pageSize = 20, status?: OrderStatus) {
  const where = status ? { status } : {};

  const [totalItems, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: true },
    }),
  ]);

  return {
    data: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      shippingCity: o.shippingCity,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    })),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: orderId } });
    if (!current) throw new Error("Order not found.");
    const order = await tx.order.update({ where: { id: orderId }, data: { status } });
    if (status === "DELIVERED" && current.status !== "DELIVERED" && current.userId) {
      await creditOrderRewards(
        tx,
        current.userId,
        order.id,
        Number(order.subtotal) - Number(order.discountAmount),
      );
    }
    return order;
  });
}

// -------------------------------------------------------------------------
// Shipping rate matrix
// -------------------------------------------------------------------------

export async function listShippingRates() {
  return prisma.shippingRate.findMany({ orderBy: { city: "asc" } });
}

export async function upsertShippingRate(city: string, fee: number, etaDays: number) {
  return prisma.shippingRate.upsert({
    where: { city },
    update: { fee, etaDays },
    create: { city, fee, etaDays },
  });
}

// -------------------------------------------------------------------------
// Homepage content (admin-managed hero slider, category tiles, promo banner)
// -------------------------------------------------------------------------

const HOMEPAGE_KEY = "homepage";

export interface HeroSlide {
  imageUrl: string;
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface FabricTile {
  name: string;
  imageUrl: string;
  link: string;
}

export interface HomepageWidgetCard {
  heading: string;
  imageUrl: string;
  link: string;
}

export interface HomepageWidgetTab {
  label: string;
  type: "cards" | "collection";
  collectionSlug?: string;
  cards?: HomepageWidgetCard[];
}

export interface HomepageWidget {
  id: string;
  title: string;
  tabs: HomepageWidgetTab[];
}

export interface WelcomeSection {
  heading: string;
  paragraphs: string[];
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
}

export interface AboutSection {
  heading: string;
  paragraphs: string[];
  commitmentHeading: string;
  commitmentParagraphs: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

export interface TrendArticle {
  title: string;
  summary: string;
  href: string;
  date: string;
  displayDate: string;
  readTime: string;
  coverText: string;
  imagePosition: string;
  coverClass: string;
  overlayClass: string;
  imageUrl?: string;
}

export interface TrendsSection {
  title: string;
  ctaText: string;
  ctaLink: string;
  articles: TrendArticle[];
}

export interface HomepageContent {
  heroSlides: HeroSlide[];
  fabricTiles: FabricTile[];
  homeWidgets?: HomepageWidget[];
  promoBanner?: { text: string; link?: string; isActive: boolean };
  featuredCollectionTitle?: string;
  featuredCollectionSlug?: string;
  collectionSpotlight?: {
    collectionSlug: string;
    heading: string;
    subheading: string;
    description: string;
    ctaText: string;
  };
  welcomeSection?: WelcomeSection;
  aboutSection?: AboutSection;
  faqSection?: FaqSection;
  trendsSection?: TrendsSection;
}

const DEFAULT_WELCOME_SECTION: WelcomeSection = {
  heading: "Welcome to EcoSmok Your Go To Vape Online Store in the UK",
  paragraphs: [
    "At EcoSmok, we offer a wide range of vape kits, vape pens, pod systems, prefilled kits, coils, tanks, and more from trusted brands across the UK.",
    "Explore premium e-liquids, new flavours, exclusive deals, bundle offers, and multi-buy discounts, all in one place.",
    "With fast UK delivery and reliable customer service, EcoSmok is your destination for quality vaping products. For adults aged 18 and over.",
  ],
  ctaText: "Shop now",
  ctaLink: "/collections/all",
  imageUrl: "/Welcome_to_Ecosmok_Banner_02_540x.webp",
};

const DEFAULT_ABOUT_SECTION: AboutSection = {
  heading: "EcoSmok Your Local Feel Vape Store, Online",
  paragraphs: [
    "Searching for a vape store near you? Welcome to EcoSmok, bringing the high-street vape shop experience to your door. Whether you are new to vaping or an experienced user, find products for your setup in one place.",
    "<strong>Premium UK e-liquids:</strong> Explore nic salts, shortfills and classic 10ml bottles in a wide range of flavours.",
    "<strong>Vape kits and mods:</strong> Shop devices from brands including Voopoo, Vaporesso, OXVA and Uwell.",
    "<strong>Prefilled kits:</strong> Find ready-to-use options from brands such as Lost Mary, Hayati and Vaporesso.",
    "<strong>Genuine coils, pods and tanks:</strong> Choose compatible replacements from trusted UK distributors.",
  ],
  commitmentHeading: "Our Commitment to You",
  commitmentParagraphs: [
    "We are committed to offering quality products, clear product information and helpful customer service. Our range includes e-liquids, vape kits, prefilled kits, pods and coils from recognised brands.",
    "Explore the collection to compare products, check compatibility and find the right option for your needs. We are here to support adult customers at every stage of their shopping experience.",
  ],
};

const DEFAULT_FAQ_SECTION: FaqSection = {
  title: "FAQ",
  items: [
    {
      question: "Why swap cigarettes for a vape?",
      answer: "For adults who smoke, switching completely to vaping can reduce exposure to many harmful chemicals found in cigarette smoke. Vaping is not risk-free and is intended for adult smokers, not non-smokers.",
    },
    {
      question: "Which prefilled pod systems are crowd-favourites?",
      answer: "Popular options include compact prefilled pod kits from brands such as Lost Mary, Hayati and Vaporesso. Check the product listing for pod compatibility and current availability.",
    },
    {
      question: "How do I pick an e-liquid that suits my vape?",
      answer: "Match the liquid to your device. Lower-powered pod kits usually suit higher-PG liquids or nic salts, while more powerful devices are designed for different VG/PG ratios. Always follow the device maker's guidance.",
    },
    {
      question: "Which style of kit matches my needs?",
      answer: "Prefilled pod kits are simple to use, refillable pod systems offer more liquid choice, and larger mod kits provide more adjustment. Choose a device designed for your experience level and read its instructions.",
    },
    {
      question: "How much nicotine should I vape?",
      answer: "Nicotine needs vary. Adult smokers who switch should choose a strength that helps manage cravings and follow the product label. If you do not smoke, do not start vaping or using nicotine.",
    },
    {
      question: "Any tips for choosing a flavour I'll actually like?",
      answer: "Start with flavour profiles you already enjoy, such as fruit, mint or tobacco-inspired blends. Check the flavour description and bottle size before ordering.",
    },
    {
      question: "How do I know which coil or pod my device takes?",
      answer: "Check your device model and its manual, then compare the exact compatible pod or coil name on the product listing. If you are unsure, contact customer support before ordering.",
    },
    {
      question: "What is a box mod, and is it right for me?",
      answer: "A box mod is a larger vape device with adjustable settings, usually paired with a separate tank. It may suit experienced users, but a simpler pod kit can be easier for beginners.",
    },
  ],
};

const DEFAULT_TRENDS_SECTION: TrendsSection = {
  title: "Vaping Trends You Need to Know This Year",
  ctaText: "View More",
  ctaLink: "/blogs/news",
  articles: [
    {
      date: "2026-09-29",
      displayDate: "September 29, 2026",
      readTime: "4 min read",
      coverText: "UK VAPE\nLAW BY\nNATION",
      imagePosition: "72% center",
      coverClass: "bg-gradient-to-r from-sky-500 to-emerald-500",
      overlayClass: "bg-gradient-to-r from-sky-600/65 via-sky-500/15 to-transparent",
      title: "UK Vape Law by Nation: How England, Scotland, Wales and Northern Ireland Differ",
      summary: "A clear guide to vaping rules across the four nations of the United Kingdom.",
      href: "/blogs/news",
      imageUrl: "/Welcome_to_Ecosmok_Banner_02_540x.webp",
    },
    {
      date: "2026-09-29",
      displayDate: "September 29, 2026",
      readTime: "6 min read",
      coverText: "FLYING WITH\nVAPES IN\n2026",
      imagePosition: "52% center",
      coverClass: "bg-gradient-to-r from-orange-500 to-amber-400",
      overlayClass: "bg-gradient-to-r from-orange-600/65 via-orange-500/15 to-transparent",
      title: "Flying With Vapes in 2026: UK Airport and Airline Rules Explained",
      summary: "What to check before travelling with a vape, batteries, pods or e-liquid.",
      href: "/blogs/news",
      imageUrl: "/Welcome_to_Ecosmok_Banner_02_540x.webp",
    },
    {
      date: "2026-09-25",
      displayDate: "September 25, 2026",
      readTime: "5 min read",
      coverText: "UK VAPE\nADVERTISING\nBAN",
      imagePosition: "88% center",
      coverClass: "bg-gradient-to-r from-rose-500 to-pink-500",
      overlayClass: "bg-gradient-to-r from-rose-600/65 via-rose-500/15 to-transparent",
      title: "UK Vape Advertising and Sponsorship Ban: What Changes From 1 June 2027",
      summary: "A practical overview of the upcoming restrictions and what they cover.",
      href: "/blogs/news",
      imageUrl: "/Welcome_to_Ecosmok_Banner_02_540x.webp",
    },
  ],
};

const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroSlides: [
    {
      imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1600",
      heading: "Vape Kits & Pod Systems",
      subheading: "Trusted devices from Vaporesso, OXVA, Uwell and more.",
      ctaText: "Shop Vape Kits",
      ctaLink: "/collections/vaping-kits",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1600",
      heading: "Prefilled Kits & Big Puffs",
      subheading: "Easy, satisfying vaping from leading UK brands.",
      ctaText: "Shop Prefilled Kits",
      ctaLink: "/collections/disposable-vape-alternatives",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1519666213639-7e4a7a4a1b11?w=1600",
      heading: "Premium E-Liquids",
      subheading: "Nic salts, shortfills and 50/50 blends in every flavour.",
      ctaText: "Shop E-Liquids",
      ctaLink: "/collections/e-liquids",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=1600",
      heading: "Bundle Deals",
      subheading: "More value with curated vape kits, pods and e-liquid bundles.",
      ctaText: "View Vape Deals",
      ctaLink: "/vape-deals",
    },
  ],
  fabricTiles: [
    { name: "Nic Salts", imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600", link: "/collections/nic-salts" },
    { name: "Prefilled Kits", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600", link: "/collections/prefilled-pods" },
    { name: "Vape Kits", imageUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=600", link: "/collections/vaping-kits" },
    { name: "Pods & Coils", imageUrl: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600", link: "/collections/pods-coils" },
  ],
  homeWidgets: [
    {
      id: "featured-brands",
      title: "Featured Brands",
      tabs: [
        {
          label: "Brands",
          type: "cards",
          cards: [
            { heading: "Hayati", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600", link: "/collections/all?search=Hayati" },
            { heading: "Vaporesso", imageUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=600", link: "/collections/all?search=Vaporesso" },
            { heading: "Elfliq", imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600", link: "/collections/all?search=Elfliq" },
            { heading: "Lost Mary", imageUrl: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600", link: "/collections/all?search=Lost%20Mary" },
          ],
        },
        { label: "Best Sellers", type: "collection", collectionSlug: "all" },
        { label: "New Arrivals", type: "collection", collectionSlug: "all" },
      ],
    },
  ],
  promoBanner: { text: "Free UK delivery available | Subscribe and get 10% off your first order", link: "/vape-deals", isActive: true },
  featuredCollectionTitle: "Vape Kit Bundles",
  featuredCollectionSlug: "vaping-kits",
  collectionSpotlight: {
    collectionSlug: "vape-kit-bundles",
    heading: "Vape Kit Bundles",
    subheading: "Everything You Need in One Pack",
    description: "Enhance your vaping setup with our Vape Kit Bundles, designed for convenience and value. Each bundle brings together a vape kit and useful essentials, so you can get started with everything in one pack.",
    ctaText: "Shop Vape Kit Bundles",
  },
  welcomeSection: DEFAULT_WELCOME_SECTION,
  aboutSection: DEFAULT_ABOUT_SECTION,
  faqSection: DEFAULT_FAQ_SECTION,
  trendsSection: DEFAULT_TRENDS_SECTION,
};

async function getContentByKey<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteContent.findUnique({ where: { key } });
  return (row?.data as unknown as T) ?? fallback;
}

async function updateContentByKey<T>(key: string, data: T): Promise<T> {
  const row = await prisma.siteContent.upsert({
    where: { key },
    update: { data: data as object },
    create: { key, data: data as object },
  });
  return row.data as unknown as T;
}

export interface GenericPageSection {
  heading: string;
  body: string;
}

export interface FaqCategory {
  label: string;
  anchor: string;
  faqs?: SupportFaqContent[];
}

export interface BrandPageItem {
  name: string;
  logoUrl?: string;
  linkUrl?: string;
  filters?: string[];
  sortOrder?: number;
}

export interface SitemapGroup {
  title: string;
  links: { label: string; href: string }[];
}

export interface GenericPageContent {
  slug: string;
  title: string;
  intro: string;
  articles?: BlogArticle[];
  categories?: FaqCategory[];
  brands?: BrandPageItem[];
  sitemapGroups?: SitemapGroup[];
  sections: GenericPageSection[];
}

export interface BlogArticle {
  title: string;
  summary: string;
  content?: string;
  imageUrl: string;
  category: string;
  date: string;
  readTime: string;
  href: string;
  visibility?: string;
  author?: string;
  tags?: string;
  collection?: string;
  overviewList?: string;
  seoTitle?: string;
  seoDescription?: string;
  template?: string;
}

export interface SupportFaqContent {
  question: string;
  answer: string;
}

export interface SupportGroupContent {
  id: string;
  title: string;
  description: string;
  faqs: SupportFaqContent[];
}

export interface CustomerSupportContent extends GenericPageContent {
  email: string;
  emailText: string;
  phone: string;
  phoneText: string;
  categories: { label: string; anchor: string }[];
  groups: SupportGroupContent[];
}

const CUSTOMER_SUPPORT_DEFAULT: CustomerSupportContent = {
  slug: "customer-support",
  title: "Frequently Asked Questions",
  intro: "At EcoSmoke, we know that exploring the vaping world can sometimes seem confusing, especially for beginners. That's why we've designed this detailed FAQ page to answer your most important questions and concerns. Whether you're interested in our products, need guidance with your order, or want to discover more about vaping, you'll find the details you need right here.",
  email: "hello@ecosmok.co.uk",
  emailText: "Reach out to us anytime — we're here day or night.",
  phone: "+447443176197",
  phoneText: "Speak directly with our friendly support team.",
  categories: [
    { label: "Ordering", anchor: "ordering" },
    { label: "Payments", anchor: "payments" },
    { label: "Returns", anchor: "returns" },
    { label: "Shipping", anchor: "shipping" },
    { label: "Support", anchor: "support" },
  ],
  sections: [],
  groups: [
    { id: "ordering", title: "Ordering and Account Questions", description: "Everything you need to know about creating an account, placing orders, tracking deliveries, and managing all your purchases with EcoSmoke.", faqs: [
      { question: "How do I create an account?", answer: "To create an account at EcoSmoke, simply click on the \"Sign Up\" button on our homepage. Enter your details, including your name, email address, and password, then submit the form." },
      { question: "How do I place an order?", answer: "Browse our products, add the items you want to your basket, and continue to checkout. Enter your delivery and payment details, then confirm your order." },
      { question: "Can I modify my order after it has been placed?", answer: "Contact our support team as soon as possible. We can only make changes before the order has been dispatched." },
      { question: "How can I track my order?", answer: "Use our Track Order page with your order number and email address. We will also send tracking updates by email." },
      { question: "What should I do if I received the wrong item?", answer: "Please contact us with your order number and a photo of the item received so we can resolve this quickly." },
    ] },
    { id: "payments", title: "Payment and Pricing Questions", description: "Learn about our accepted payment methods, shipping fees, special offers, and how we securely process all transactions to ensure a safe and smooth shopping experience.", faqs: [
      { question: "What payment methods do you accept?", answer: "At EcoSmoke.co.uk, we accept a variety of payment methods, including major credit and debit cards. Payment options available to you are shown securely at checkout." },
      { question: "Are there any additional fees for shipping?", answer: "Any delivery charge is shown clearly at checkout before you place your order." },
      { question: "Do you offer discounts or promotions?", answer: "Our latest promotions are shown on the website. Follow our offers and newsletter updates so you do not miss a deal." },
    ] },
    { id: "shipping", title: "Shipping Questions", description: "Find details about delivery times, available shipping carriers, international orders, and how to track your EcoSmoke package efficiently.", faqs: [
      { question: "Do you offer international shipping?", answer: "Yes, EcoSmoke provides international shipping to selected countries. For details on destinations and restrictions, please see our shipping policy page." },
      { question: "Do you offer free shipping?", answer: "Free delivery eligibility and any applicable order threshold are shown during checkout." },
      { question: "What shipping carriers do you use?", answer: "We use trusted delivery partners selected according to the destination and delivery service chosen." },
      { question: "Can I choose my delivery method?", answer: "Available delivery methods are displayed at checkout for your address." },
      { question: "What should I do if my order hasn't arrived?", answer: "Check your tracking link first, then contact our support team with your order number if the delivery is delayed." },
    ] },
    { id: "returns", title: "Returns and Exchanges", description: "Learn about EcoSmoke's return policy, exchange process, and the steps to follow if you need to send an item back.", faqs: [
      { question: "What is your return policy?", answer: "EcoSmoke accepts returns on unopened items within 14 days of delivery. If you receive a defective or wrong item, contact us for return instructions." },
      { question: "How do I initiate a return or exchange?", answer: "Contact customer support with your order number and reason for return. We will explain the next steps and provide the appropriate return instructions." },
      { question: "Can I return an opened e-liquid?", answer: "For health and safety reasons, opened e-liquid cannot be returned." },
    ] },
    { id: "support", title: "Customer Support", description: "Get assistance with product selection, technical guidance, and ways to reach EcoSmoke's customer service team for support.", faqs: [
      { question: "How can I reach EcoSmoke's customer service?", answer: "You can contact us by calling our customer service number. If you prefer WhatsApp, our support number supports this service." },
      { question: "What's the best way to email EcoSmoke?", answer: "Send your enquiry to hello@ecosmok.co.uk and include your order number where relevant." },
      { question: "Where is EcoSmoke located?", answer: "EcoSmoke is a UK-based online vape retailer serving customers across the United Kingdom." },
      { question: "What are your customer service hours?", answer: "Our team aims to respond to enquiries during normal UK business hours." },
      { question: "Do you have a warranty on your products?", answer: "Warranty support depends on the product and issue. Contact us with your order details for help." },
    ] },
  ],
};

const GENERIC_PAGE_DEFAULTS: Record<string, GenericPageContent> = {
  "blogs/news": {
    slug: "blogs/news",
    title: "Vaping news and product guides",
    intro: "Practical, plain-English guidance for choosing devices, e-liquids, pods and accessories in the UK.",
    articles: [
      { title: "Bringing Vapes Into the UK: The New 50ml Travel Allowance Explained", summary: "What adult travellers need to know about bringing vape products into the UK.", imageUrl: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=900", category: "News", date: "Oct 04, 2026", readTime: "5 min read", href: "/blogs/news" },
      { title: "Why Vape E-Liquid Bottles and Pod Kits Are Shrinking Across the UK", summary: "A plain-English guide to changing product sizes and what they mean for shoppers.", imageUrl: "https://images.unsplash.com/photo-1499145484967-3f2e1c8f4a5b?w=900", category: "Guides", date: "Oct 02, 2026", readTime: "4 min read", href: "/blogs/news" },
      { title: "Faulty or Fake Vape? What UK Law Says and How to Report It", summary: "Learn how to spot product problems and what steps to take next.", imageUrl: "https://images.unsplash.com/photo-1534885320675-b08aa131cc5e?w=900", category: "Reviews", date: "Oct 01, 2026", readTime: "6 min read", href: "/blogs/news" },
      { title: "UK Vape Shop Licensing: What's Coming and Why It's Delayed Until 2027", summary: "A quick overview of proposed licensing changes for vape retailers.", imageUrl: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=900", category: "News", date: "Oct 01, 2026", readTime: "4 min read", href: "/blogs/news" },
      { title: "Vaping at Work: What UK Law Actually Says", summary: "Can you vape at work in the UK? Here is what employers and staff should know.", imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900", category: "Guides", date: "Oct 01, 2026", readTime: "3 min read", href: "/blogs/news" },
      { title: "When to Change Your Vape Coil: A UK Guide to Spotting the Warning Signs", summary: "Know when a coil needs replacing and how to keep your device performing well.", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900", category: "Guides", date: "Oct 01, 2026", readTime: "5 min read", href: "/blogs/news" },
    ],
    sections: [
      { heading: "Choosing your first kit", body: "Compare simple prefilled pods, refillable pod systems and compact vape kits by battery life, draw style and running cost." },
      { heading: "Flavour and nicotine basics", body: "Learn the difference between nic salts, freebase liquids and shortfills before choosing your next bottle." },
      { heading: "Product comparisons", body: "Our editorial team breaks down new releases, replacement pods, coils and popular UK brands." },
    ],
  },
  "age-verification": {
    slug: "age-verification",
    title: "Age Restriction and Verification Policy",
    intro: "It is illegal to sell electronic cigarette products to individuals under 18.",
    sections: [
      {
        heading: "Primary Verification with OneID",
        body: "For age-restricted products or services, you consent to us sharing your information with OneID and third-party identity data providers to facilitate age verification. This consent is required for OneID to verify that you meet the minimum age and identity standards set by UK legislation. OneID may retain necessary data for future verifications, and they apply rigorous security measures, regularly reviewing retained data to ensure it is held only as long as needed. For details on how OneID manages data, please visit their website: www.oneid.co.uk.",
      },
      {
        heading: "Additional Verification",
        body: "If the age verification process is unsuccessful, we may request additional proof, such as passport or driving licence details, to manually verify your age against the relevant database. If you prefer not to provide this information, we can cancel and refund your order.",
      },
      {
        heading: "Verification Process Instructions",
        body: "- You will receive an email from OneID with a verification link. Please check your junk folder if you do not see it.\n- You may verify your age using options like Mobile Phone, Credit or Debit Card, UK Driving Licence, CitizenCard, National Database, or Electoral Roll.\n- Verifying with your mobile phone number is usually the fastest method. Alternatively, follow prompts to complete verification with your chosen method.\n- Once verified, your order will be processed and dispatched. Future orders will not require re-verification if you log into your account and your information remains unchanged.",
      },
      {
        heading: "Data Protection",
        body: "For details on how we handle your data, please see the data protection section in our Terms and Conditions.",
      },
      {
        heading: "Important Note",
        body: "Failing age verification may delay your order. For assistance, please contact our customer service at 0161 459 7517 - Mon-Fri 10am till 6pm or info@ecosmok.com.",
      },
    ],
  },
  guides: { slug: "guides", title: "Guides", intro: "Helpful guides for choosing and using your products.", sections: [{ heading: "Explore our guides", body: "Find practical advice on choosing devices, e-liquids and accessories." }] },
  "vaping-faqs": {
    slug: "vaping-faqs",
    title: "Vaping FAQs",
    intro: "Answers to common questions about vaping, products and responsible use.",
    categories: [
      { label: "Vaping FAQs", anchor: "faq-0-what-is-vaping" },
      { label: "Vaping Health & Usage", anchor: "faq-3-is-vaping-safer-than-smoking" },
      { label: "Nicotine Salt (Nic Salt) FAQs", anchor: "faq-5-what-is-in-vape-liquid" },
      { label: "Nic Salt Usage & Safety", anchor: "faq-7-is-vaping-addictive" },
      { label: "Vape Coil FAQs", anchor: "faq-9-why-does-my-vape-taste-burnt" },
      { label: "Coil Problems & Fixes", anchor: "faq-9-why-does-my-vape-taste-burnt" },
      { label: "UK Laws & Regulations", anchor: "faq-1-is-vaping-legal-in-the-uk" },
      { label: "Disposable Vapes", anchor: "faq-0-what-is-vaping" },
      { label: "Vape Mods & Advanced Devices", anchor: "faq-0-what-is-vaping" },
      { label: "Pod Systems", anchor: "faq-0-what-is-vaping" },
      { label: "Tanks & Atomizers", anchor: "faq-9-why-does-my-vape-taste-burnt" },
      { label: "Batteries & Charging", anchor: "faq-0-what-is-vaping" },
      { label: "Flavours & Tastes", anchor: "faq-5-what-is-in-vape-liquid" },
      { label: "Health & Safety", anchor: "faq-3-is-vaping-safer-than-smoking" },
      { label: "Smoking Cessation & NHS Support", anchor: "faq-4-can-vaping-help-you-quit-smoking" },
      { label: "Youth & Underage Concerns", anchor: "faq-2-how-old-do-you-have-to-be-to-vape-in-the-uk" },
      { label: "Workplace & Public Etiquette", anchor: "faq-1-is-vaping-legal-in-the-uk" },
      { label: "Travel & Airports", anchor: "faq-1-is-vaping-legal-in-the-uk" },
      { label: "Environmental Impact", anchor: "faq-0-what-is-vaping" },
    ],
    sections: [
      { heading: "What is vaping?", body: "Vaping is the use of an electronic device to heat e-liquid and produce an aerosol for inhalation. It does not involve burning tobacco." },
      { heading: "Is vaping legal in the UK?", body: "Vaping products can be legally sold to adults aged 18 and over in the UK. Age verification may be required when you place an order." },
      { heading: "How old do you have to be to vape in the UK?", body: "You must be at least 18 years old to purchase vaping and nicotine products in the UK." },
      { heading: "Is vaping safer than smoking?", body: "Vaping is generally considered less harmful than smoking, but it is not risk-free. Adults who do not smoke should not start vaping." },
      { heading: "Can vaping help you quit smoking?", body: "Some adult smokers use vaping as part of a plan to stop smoking. If you need support, speak to a qualified healthcare professional or an NHS stop smoking service." },
      { heading: "What is in vape liquid?", body: "Most e-liquids contain a base of propylene glycol and vegetable glycerin, flavourings and, where selected, nicotine." },
      { heading: "Does vaping contain tobacco?", body: "Vape liquid does not contain tobacco. Nicotine e-liquid may contain nicotine, which is the addictive substance also found in tobacco products." },
      { heading: "Is vaping addictive?", body: "Nicotine is addictive. Choose nicotine strength carefully and seek professional advice if you want help reducing your nicotine use." },
      { heading: "How long does a vape last?", body: "How long a vape lasts depends on the device, battery, e-liquid capacity and how frequently it is used." },
      { heading: "Why does my vape taste burnt?", body: "A burnt taste can be caused by a dry or worn coil, insufficient e-liquid, or taking repeated puffs without allowing the coil to re-saturate. Replace the coil or pod when necessary." },
    ],
  },
  "vaping-knowledge": {
    slug: "vaping-knowledge",
    title: "The Eco Smok Guide to Vape Kits, Coils and E-Liquid",
    intro: "This guide explains how vape kits work, how to choose between pod kits, tanks and mods, what the numbers on coils and e-liquid bottles mean, and how to fix the most common problems. It is written for adults who already vape. Vaping products contain nicotine, which is addictive, and they are only sold to people aged 18 and over.",
    sections: [
      { heading: "1. UK rules every vaper should know", body: "Vape kits and e-liquids sold in the UK must follow the Tobacco and Related Products Regulations (TRPR), often called the TPD rules. In practice this means:\n\n- Tanks and pods can hold a maximum of 2ml of nicotine e-liquid.\n- Nicotine e-liquid bottles can hold a maximum of 10ml.\n- Nicotine strength is capped at 20mg/ml.\n- Single-use vapes have been banned across the UK since 1 June 2025. Only rechargeable devices that use refillable pods or tanks, or replaceable prefilled pods, can now be sold.\n- Age limit: it is illegal to sell vaping products to anyone under 18, and all Eco Smok orders go through age verification.\n\nIf you ever spot a listing on our site that doesn't match these rules, please [let us know](/contact)." },
      { heading: "2. The main types of vape kit", body: "Pod kits\nPod kits are small, light devices with a built-in battery and a clip-in pod. Most are draw activated, so there is no button to press. They are designed for mouth to lung (MTL) vaping and usually work best with nic salt e-liquid. Popular examples include the Vaporesso XROS and SMOK Novo ranges. [Browse pod kits](/collections/pod-kits).\n\nRefillable pods and prefilled pods\nRefillable pods are filled from a 10ml bottle of your chosen e-liquid. Prefilled pod systems use sealed pods that arrive already filled; when one is empty you replace it and keep the rechargeable battery. [Replacement pods](/collections/vape-pods) and [prefilled pods](/collections/pre-filled-pod) are sold separately.\n\nStarter kits with a tank\nPen style and compact kits pair a battery with a 2ml tank that takes replaceable coils. They give a little more control over airflow and coil choice than a pod kit. The Innokin Endura range is a well known example. [Browse vape kits](/collections/vaping-kits).\n\nMod kits\nMods are larger devices with a screen and adjustable wattage, often with removable batteries. They are aimed at experienced vapers and are usually used for direct to lung (DTL) vaping with sub-ohm coils and higher VG e-liquids. [Browse advanced kits](/collections/advance-kits)." },
      { heading: "3. How a vape works", body: "Every kit has the same three working parts:\n\n- Battery: powers the device. Capacity is measured in milliamp hours (mAh); a 1000mAh battery will normally last longer between charges than a 500mAh one.\n- Coil (atomiser): a small heating element wrapped in cotton wick. The wick soaks up e-liquid and the coil heats it into vapour.\n- Tank or pod: holds the e-liquid (up to 2ml) and feeds it to the coil.\n\nDraw activated devices switch on when you inhale; button activated devices fire when you press the button." },
      { heading: "4. Coils and resistance (ohms)", body: "A coil's resistance is measured in ohms (Ω). As a general guide:\n\n- 1.0 ohm and above: mouth to lung vaping, a tighter draw and lower power. Pairs well with nic salts and 50/50 e-liquids.\n- Below 1.0 ohm (sub-ohm): direct to lung vaping, more vapour and higher power. Pairs with 70/30 VG/PG shortfills and lower nicotine strengths.\n\nAlways use the coil or pod made for your device and stay within the wattage printed on it. [Replacement coils](/collections/replacement-coils-1) and [pods and coils](/collections/pods-coils) are listed by device.\n\nPriming a new coil\nBefore first use, drip a few drops of e-liquid onto the exposed cotton, fill the tank or pod, and leave it for five to ten minutes so the wick is fully soaked. Firing a dry coil burns the cotton and ruins it straight away.\n\nWhen to change a coil\nChange the coil or pod when you notice a burnt or muted taste, less vapour, or gurgling that doesn't clear. How long a coil lasts depends on how often you vape and on the e-liquid; sweeter liquids tend to wear coils out faster." },
      { heading: "5. Understanding e-liquid", body: "PG and VG\nE-liquid is mostly propylene glycol (PG) and vegetable glycerine (VG), plus flavouring and, in most cases, nicotine. PG is thinner and carries flavour; VG is thicker and produces more vapour. Bottles show the ratio, for example 50/50 or 70/30 (VG/PG).\n\n- 50/50: suits most pod kits and MTL tanks.\n- 70/30 or higher VG: suits sub-ohm tanks and mods. It is too thick for many small pods.\n\nNic salts, freebase and shortfills\n- Nic salt e-liquid comes in 10ml bottles, usually at 10mg or 20mg, and is made for low power pod kits. [Shop nic salts](/collections/nic-salts).\n- Freebase e-liquid is the traditional form of nicotine e-liquid, also sold in 10ml bottles.\n- Shortfills are larger bottles (such as 50ml or 100ml) of nicotine free e-liquid with space left to add a 10ml nicotine shot. For example, one 18mg shot added to a 50ml shortfill makes 60ml at about 3mg. [Shop 100ml shortfills](/collections/100ml-e-liquid).\n\nAll e-liquids sold in the UK must list their ingredients and carry nicotine warnings on the label." },
      { heading: "6. Troubleshooting", body: "No vapour\nCheck the pod or tank has e-liquid in it and is seated properly. Clean the contacts on the pod and the device with a dry tissue or cotton bud, and make sure the battery is charged. If it still does not fire, try a new coil or pod.\n\nLeaking or gurgling\nLeaks usually come from overfilling, a worn or loose coil, a cracked tank, or e-liquid that is too thin for the coil. Wipe the pod and contacts dry, check the seals, and don't take very hard draws on an MTL device. Storing the device upright helps.\n\nBurnt taste\nA burnt taste normally means the wick is dry or the coil is worn out. Make sure the tank is full, let the coil soak, lower the wattage if your device allows, and replace the coil if the taste stays.\n\nBattery won't charge\nUse the cable supplied with the device, check the charging port is clean and dry, and try another USB plug. Some devices turn off after five quick presses of the button, so check it is switched on." },
      { heading: "7. Battery and e-liquid safety", body: "- Charge with the cable supplied and a standard USB plug, on a hard surface, and don't leave a device charging unattended or overnight.\n- Don't leave devices in hot places such as a car in summer, and replace any battery or device that is damaged, swollen or gets hot.\n- If your mod uses removable batteries, carry spares in a battery case, never loose in a pocket with keys or coins.\n- Keep e-liquid and devices out of the reach of children and pets. Nicotine e-liquid is toxic if swallowed; if this happens, get medical help straight away by calling NHS 111 or 999 in an emergency.\n- Wash e-liquid off your skin with soap and water if you spill it." },
      { heading: "8. Recycling your old vape", body: "Vape kits contain lithium batteries, so never put them in household bins. Take old devices, batteries and used pods to an electrical recycling point or a retailer take back scheme." },
      { heading: "Need help choosing?", body: "Our team is happy to help you pick a kit, coil or e-liquid. Read our [vaping FAQs](/faq), browse our [guides](/blogs/news), or [contact us](/contact)." },
    ],
  },
  "black-friday": {
    slug: "black-friday",
    title: "Snag Your Black Friday Offers",
    intro: "Subscribe to our newsletter for Black Friday offers, product news and limited-time savings.",
    sections: [
      { heading: "Unmissable Black Friday 2026 Vape Offers at ECOSMOK", body: "Black Friday brings big savings across returns to ECOSMOK in November 2026, including unbeatable deals on your favourite vape products. Get ready to stock up on must-have 10ml e-liquids, nic salts, top-tier vape kits, prefilled pod kits, and a wide range of tanks, coils, and accessories — all at incredible prices." },
      { heading: "Top Black Friday Prefilled Pod Kit Bargains at ECOSMOK", body: "The prefilled pod kit trend is slowing down — and this November is your chance to get in on it with ECOSMOK. Enjoy incredible savings on the hottest pod systems and flavours, including Hayati Rubik, 7000, Lost Mary BM6000, Pixi 8000, and the innovative Juicy Pod Novamax 10K." },
      { heading: "ECOSMOK's Black Friday Vape Deals Collection", body: "Explore our Black Friday collection for seasonal offers across vape kits, pods, e-liquids and accessories. Promotions are subject to availability and offer terms." },
      { heading: "Black Friday's Top 10ml E-Liquid Deals at ECOSMOK", body: "Discover special prices on popular 10ml e-liquids, nic salts and flavours from trusted brands. Check back regularly as new offers are added." },
      { heading: "What's the Hype Around Black Friday?", body: "Black Friday is a great time to compare products and save on the vaping essentials you already use. Sign up to hear when the best offers go live." },
      { heading: "Best Black Friday Coil Savings at ECOSMOK", body: "Stock up on compatible replacement coils and pods during our seasonal sale. Always check compatibility with your device before ordering." },
      { heading: "Best Black Friday Shortfill Steals at ECOSMOK", body: "Look out for limited-time savings across selected shortfills and nicotine shots, subject to stock and offer conditions." },
    ],
  },
  brands: {
    slug: "brands",
    title: "Vape Brands",
    intro: "See our extensive collection of vaping products from the industry's most trusted manufacturers.",
    brands: [
      { name: "SKE Crystal", filters: ["All Brands", "Disposables"], sortOrder: 1 },
      { name: "HYOLA", filters: ["All Brands", "Disposables"], sortOrder: 2 },
      { name: "FEOba", filters: ["All Brands", "Disposables"], sortOrder: 3 },
      { name: "Titan", filters: ["All Brands", "Vape Kits"], sortOrder: 4 },
      { name: "A-Steam", filters: ["All Brands", "E-Liquid"], sortOrder: 5 },
      { name: "Hangsen", filters: ["All Brands", "E-Liquid"], sortOrder: 6 },
      { name: "Hayati", filters: ["All Brands", "Disposables"], sortOrder: 7 },
      { name: "R and M", filters: ["All Brands", "Disposables"], sortOrder: 8 },
      { name: "Pod Salt", filters: ["All Brands", "Nic Salt"], sortOrder: 9 },
      { name: "Nasty Juice", filters: ["All Brands", "E-Liquid"], sortOrder: 10 },
      { name: "Elfliq by Elf Bar", filters: ["All Brands", "Nic Salt"], sortOrder: 11 },
      { name: "IVG", filters: ["All Brands", "E-Liquid"], sortOrder: 12 },
      { name: "Elux Legend", filters: ["All Brands", "Disposables"], sortOrder: 13 },
      { name: "Voopoo", filters: ["All Brands", "Vape Kits"], sortOrder: 14 },
      { name: "Vaporesso", filters: ["All Brands", "Vape Kits"], sortOrder: 15 },
      { name: "Uwell", filters: ["All Brands", "Vape Kits"], sortOrder: 16 },
      { name: "Smok", filters: ["All Brands", "Vape Kits"], sortOrder: 17 },
      { name: "OXVA", filters: ["All Brands", "Vape Kits"], sortOrder: 18 },
      { name: "Innokin", filters: ["All Brands", "Vape Kits"], sortOrder: 19 },
      { name: "Geekvape", filters: ["All Brands", "Vape Kits"], sortOrder: 20 },
      { name: "Aspire", filters: ["All Brands", "Vape Kits"], sortOrder: 21 },
      { name: "Bloody Bar", filters: ["All Brands", "Disposables"], sortOrder: 22 },
      { name: "Lost Mary", filters: ["All Brands", "Disposables"], sortOrder: 23 },
      { name: "Doozy Vape Co", filters: ["All Brands", "E-Liquid"], sortOrder: 24 },
      { name: "Bar Juice 5000", filters: ["All Brands", "E-Liquid"], sortOrder: 25 },
    ],
    sections: [{ heading: "Our brands", body: "Browse the collection to discover products from leading brands." }],
  },
  "eco-smok-wholesale": {
    slug: "eco-smok-wholesale",
    title: "Eco Smok Wholesale",
    intro: "Partner with a trusted and respected leader in the vaping industry!",
    sections: [
      { heading: "Email us at info@ecosmok.com with your wholesale inquiry, and we’ll get back to you promptly.", body: "" },
      { heading: "We look forward to connecting with you!", body: "" },
    ],
  },
  sitemap: {
    slug: "sitemap",
    title: "ECOSMOK Sitemap",
    intro: "Here you'll find a comprehensive list of all our products, collections and important pages. Use this page to quickly navigate to any section of our website.",
    sections: [],
    sitemapGroups: [
      { title: "Products", links: [{ label: "0.2ohm Mesh Coil Vaporesso GTX Coils (5-Pack)", href: "/collections/replacement-coils-1" }, { label: "0.3ohm Mesh Coil Vaporesso GTX Coils (5-Pack)", href: "/collections/replacement-coils-1" }, { label: "0.4ohm Mesh Coil Vaporesso GTX Coils (5-Pack)", href: "/collections/replacement-coils-1" }, { label: "0.6ohm Mesh Coil Vaporesso GTX Coils (5-Pack)", href: "/collections/replacement-coils-1" }, { label: "0.8ohm Mesh Coil Vaporesso GTX Coils (5-Pack)", href: "/collections/replacement-coils-1" }, { label: "1.2ohm Mesh Coil Vaporesso GTX Coils (5-Pack)", href: "/collections/replacement-coils-1" }, { label: "1.2ohm Regular Coil Vaporesso GTX Coils (5-Pack)", href: "/collections/replacement-coils-1" }, { label: "100% Genuine Uwell Caliburn KoKo Replacement Pods", href: "/collections/vape-pods" }, { label: "100% Original SMOK Stick M17 Core Coils", href: "/collections/replacement-coils-1" }, { label: "10x Berries Burst OXVA Ox Passion Nic Salt 10ml", href: "/collections/nic-salts" }, { label: "Aspire Replacement Coils", href: "/collections/replacement-coils-1" }, { label: "Vaporesso Replacement Pods", href: "/collections/vape-pods" }] },
      { title: "Collections", links: [{ label: "0mg Disposable", href: "/collections/disposables" }, { label: "0mg E-Liquid", href: "/collections/e-liquids" }, { label: "10000 Puff Kits", href: "/collections/vaping-kits" }, { label: "10000 Puff Prefilled Pods", href: "/collections/pre-filled-pod" }, { label: "100ml E-Liquid", href: "/collections/100ml-e-liquid" }, { label: "100ml Shortfill E Liquids", href: "/collections/100ml-e-liquid" }, { label: "10mg Disposable", href: "/collections/disposables" }, { label: "10ml E-Liquid", href: "/collections/10ml-e-liquid" }, { label: "13 Squid", href: "/collections/e-liquids" }, { label: "150ml Shortfill E Liquids", href: "/collections/100ml-e-liquid" }, { label: "Advance Kits", href: "/collections/advance-kits" }, { label: "Nic Salts", href: "/collections/nic-salts" }] },
      { title: "Pages", links: [{ label: "About Us", href: "/about" }, { label: "Age Verification", href: "/age-verification" }, { label: "Batteries & Charging", href: "/vaping-knowledge" }, { label: "Best Vape Deals on E-Liquids, Prefilled Pods & Kits", href: "/vape-deals" }, { label: "Black Friday", href: "/pages/black-friday" }, { label: "Brands", href: "/pages/brands" }, { label: "Coil Problems & Fixes", href: "/vaping-knowledge" }, { label: "Mix and Match", href: "/collections/all" }, { label: "Contact Us", href: "/contact" }, { label: "Privacy Policy", href: "/privacy" }, { label: "Vaping Knowledge", href: "/vaping-knowledge" }, { label: "Eco Smok Wholesale", href: "/pages/eco-smok-wholesale" }] },
    ],
  },
};

export const getGenericPageSlugs = () => Object.keys(GENERIC_PAGE_DEFAULTS);
export async function getGenericPageContent(slug: string) {
  if (slug === "customer-support") {
    const stored = await getContentByKey<Partial<CustomerSupportContent>>(`page:${slug}`, {});
    return {
      ...CUSTOMER_SUPPORT_DEFAULT,
      ...stored,
      categories: stored.categories?.length ? stored.categories : CUSTOMER_SUPPORT_DEFAULT.categories,
      groups: stored.groups?.length ? stored.groups : CUSTOMER_SUPPORT_DEFAULT.groups,
    };
  }
  const fallback = GENERIC_PAGE_DEFAULTS[slug];
  if (!fallback) return null;
  const stored = await getContentByKey<Partial<GenericPageContent>>(`page:${slug}`, {});
  const categories = stored.categories?.length ? stored.categories : fallback.categories;
  const sections = stored.sections?.length ? stored.sections : fallback.sections;
  const hydratedCategories = categories?.map((category) => ({
    ...category,
    faqs: category.faqs?.length
      ? category.faqs
      : sections
        .filter((section, index) => `faq-${index}-${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` === category.anchor)
        .map((section) => ({ question: section.heading, answer: section.body })),
  }));
  return {
    ...fallback,
    ...stored,
    categories: hydratedCategories,
    sections,
    articles: stored.articles?.length ? stored.articles : fallback.articles,
  };
}
export async function updateGenericPageContent(slug: string, content: GenericPageContent) {
  if (slug !== "customer-support" && !GENERIC_PAGE_DEFAULTS[slug]) throw new Error("Unknown page slug.");
  return updateContentByKey(`page:${slug}`, { ...content, slug });
}

export async function getHomepageContent(): Promise<HomepageContent> {
  const stored = await getContentByKey<Partial<HomepageContent>>(HOMEPAGE_KEY, {});
  return {
    ...DEFAULT_HOMEPAGE_CONTENT,
    ...stored,
    heroSlides: stored.heroSlides?.length ? stored.heroSlides : DEFAULT_HOMEPAGE_CONTENT.heroSlides,
    fabricTiles: stored.fabricTiles?.length ? stored.fabricTiles : DEFAULT_HOMEPAGE_CONTENT.fabricTiles,
    homeWidgets: stored.homeWidgets?.length ? stored.homeWidgets : DEFAULT_HOMEPAGE_CONTENT.homeWidgets,
    welcomeSection: stored.welcomeSection ?? DEFAULT_HOMEPAGE_CONTENT.welcomeSection,
    aboutSection: stored.aboutSection ?? DEFAULT_HOMEPAGE_CONTENT.aboutSection,
    faqSection: stored.faqSection ?? DEFAULT_HOMEPAGE_CONTENT.faqSection,
    trendsSection: stored.trendsSection ?? DEFAULT_HOMEPAGE_CONTENT.trendsSection,
  };
}

export async function updateHomepageContent(content: HomepageContent) {
  return updateContentByKey(HOMEPAGE_KEY, content);
}

// -------------------------------------------------------------------------
// About page content (admin-managed)
// -------------------------------------------------------------------------

export interface AboutValue {
  title: string;
  description: string;
}

export interface AboutFeatureSection {
  imageUrl: string;
  heading: string;
  body: string;
  points: AboutValue[];
  buttonLabel: string;
  buttonHref: string;
  imagePosition: "left" | "right";
}

export interface AboutContent {
  heroImageUrl: string;
  heroSubheading: string;
  heading: string;
  paragraphs: string[];
  storyImageUrl: string;
  values: AboutValue[];
  galleryImages: string[];
  whyShopSection?: AboutFeatureSection;
  additionalSections?: AboutFeatureSection[];
}

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  heroImageUrl: "https://images.unsplash.com/photo-1753162657535-0710ef1888df?w=1800",
  heroSubheading: "Elevated stitched & unstitched apparel, made with intention.",
  heading: "About Us",
  paragraphs: [
    "We curate boutique stitched and unstitched apparel, working with skilled artisans and fine fabrics — Lawn, Chiffon, Organza, and Velvet — to bring you considered, elevated pieces for everyday wear and special occasions.",
    "Every order is quality-checked before dispatch, and our styling desk (say hello to Aanya, our AI stylist, in the bottom-right corner) is always on hand to help you find the right piece.",
  ],
  storyImageUrl: "https://images.unsplash.com/photo-1753164597544-a2736833357e?w=1200",
  values: [
    {
      title: "Handpicked Fabrics",
      description: "Every bolt of Lawn, Chiffon, Organza, and Velvet is sourced and inspected before it reaches the cutting table.",
    },
    {
      title: "Artisan Craftsmanship",
      description: "Hand-embroidery and finishing work is done by skilled karigars we've worked with for years.",
    },
    {
      title: "Quality Checked",
      description: "Every piece is inspected for stitching, fit, and finish before it's packed for dispatch.",
    },
    {
      title: "Nationwide Delivery",
      description: "From Karachi to every corner of the country, tracked and on time.",
    },
  ],
  galleryImages: [
    "https://images.unsplash.com/photo-1622461962346-a4d6c6ffade5?w=800",
    "https://images.unsplash.com/photo-1753162658216-13e9cb395982?w=800",
    "https://images.unsplash.com/photo-1753162658596-2ccba5e4246a?w=800",
    "https://images.unsplash.com/photo-1761090617068-f1b3257d27ad?w=800",
  ],
  whyShopSection: {
    imageUrl: "https://images.unsplash.com/photo-1527137342181-19aab11a8ee8?w=1200",
    heading: "Why Shop with Eco-Smok?",
    body: "At Eco-Smok, we’re more than a retailer—we’re your vaping partner.",
    points: [
      { title: "Expert Advice", description: "Our team is here to help you make the right choices for your needs." },
      { title: "Quality & Compliance", description: "We only stock thoroughly tested products you can trust." },
      { title: "Eco-Conscious", description: "We promote eco-friendly vaping by reducing waste and offering reusable options." },
      { title: "Customer-First Approach", description: "We’re committed to fast delivery, reliable service, and real human support." },
      { title: "Community Driven", description: "Join our vape family for tips, discounts, and future events." },
    ],
    buttonLabel: "Shop now",
    buttonHref: "/collections/all",
    imagePosition: "left",
  },
};

export async function getAboutContent() {
  const stored = await getContentByKey<Partial<AboutContent>>("about", {});
  const sections = stored.additionalSections ?? [];
  return {
    ...DEFAULT_ABOUT_CONTENT,
    ...stored,
    whyShopSection: {
      ...DEFAULT_ABOUT_CONTENT.whyShopSection,
      ...(stored.whyShopSection ?? {}),
      points: stored.whyShopSection?.points ?? DEFAULT_ABOUT_CONTENT.whyShopSection?.points ?? [],
    },
    additionalSections: sections.map((section) => ({
      ...section,
      points: section.points ?? [],
    })),
  };
}
export const updateAboutContent = (content: AboutContent) => updateContentByKey("about", content);

// -------------------------------------------------------------------------
// Contact page content (admin-managed)
// -------------------------------------------------------------------------

export interface ContactContent {
  heading: string;
  intro: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  imageUrl: string;
}

const DEFAULT_CONTACT_CONTENT: ContactContent = {
  heading: "Need help choosing a vape?",
  intro:
    "Our UK support team can help with orders, device compatibility, flavours and getting started.",
  phone: "+44 7443 176197",
  email: "hello@ecosmok.co.uk",
  address: "United Kingdom",
  hours: "Mon – Fri, 9am – 5pm",
  imageUrl: "https://images.unsplash.com/photo-1759893362613-8bb8bb057af1?w=1200",
};

export const getContactContent = () => getContentByKey("contact", DEFAULT_CONTACT_CONTENT);
export const updateContactContent = (content: ContactContent) => updateContentByKey("contact", content);

// -------------------------------------------------------------------------
// Footer content (admin-managed)
// -------------------------------------------------------------------------

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterContent {
  tagline: string;
  phone: string;
  email: string;
  address: string;
  instagramUrl?: string;
  facebookUrl?: string;
  columns: FooterColumn[];
  copyrightText: string;
}

const DEFAULT_FOOTER_CONTENT: FooterContent = {
  tagline:
    "Your local-feel UK vape store online: kits, e-liquids, pods, coils, accessories and value bundles.",
  phone: "+44 7443 176197",
  email: "hello@ecosmok.co.uk",
  address: "United Kingdom",
  instagramUrl: "",
  facebookUrl: "",
  columns: [
    {
      title: "Shop",
      links: [
        { label: "Nic Salts", href: "/collections/nic-salts" },
        { label: "Prefilled Kits", href: "/collections/disposable-vape-alternatives" },
        { label: "Prefilled Pods", href: "/collections/prefilled-pods" },
        { label: "Vape Kits", href: "/collections/vaping-kits" },
        { label: "E-Liquids", href: "/collections/e-liquids" },
        { label: "Pods & Coils", href: "/collections/pods-coils" },
        { label: "Accessories", href: "/collections/accessories" },
      ],
    },
    {
      title: "Customer Care",
      links: [
        { label: "Track Order", href: "/track-order" },
        { label: "Customer Support", href: "/contact" },
        { label: "Age Verification", href: "/age-verification" },
        { label: "Returns & Exchanges", href: "/returns" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Blogs", href: "/blogs/news" },
        { label: "Vaping FAQs", href: "/faq" },
        { label: "Vaping Knowledge", href: "/vaping-knowledge" },
        { label: "Brands", href: "/brands" },
        { label: "About Us", href: "/about" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ],
  copyrightText: "EcoSmok. All rights reserved. 18+ only. Vape responsibly.",
};

export async function getFooterContent(): Promise<FooterContent> {
  const stored = await getContentByKey<Partial<FooterContent>>("footer", {});
  const columns = stored.columns?.length ? stored.columns : DEFAULT_FOOTER_CONTENT.columns;
  const requiredColumns: FooterColumn[] = [
    {
      title: "Online Help",
      links: [
        { label: "Customer Support", href: "/contact" },
        { label: "Contact Us", href: "/contact" },
        { label: "Age Verification", href: "/age-verification" },
        { label: "Terms And Condition", href: "/terms" },
      ],
    },
    {
      title: "About Us",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact Us", href: "/contact" },
        { label: "Blogs", href: "/blogs/news" },
        { label: "Guides", href: "/pages/guides" },
        { label: "Vaping FAQs", href: "/faq" },
        { label: "Vaping Knowledge", href: "/vaping-knowledge" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Black Friday", href: "/pages/black-friday" },
        { label: "Brands", href: "/pages/brands" },
        { label: "Eco Smok Wholesale", href: "/pages/eco-smok-wholesale" },
        { label: "Sitemap", href: "/pages/sitemap" },
      ],
    },
    {
      title: "Shop",
      links: [
        { label: "Nic Salts", href: "/collections/nic-salts" },
        { label: "Prefilled Kits", href: "/collections/disposable-vape-alternatives" },
        { label: "Prefilled Pods", href: "/collections/prefilled-pods" },
        { label: "Vaping Kits", href: "/collections/vaping-kits" },
        { label: "E Liquids", href: "/collections/e-liquids" },
        { label: "Pods and Coils", href: "/collections/pods-coils" },
        { label: "Nicotine Pouches", href: "/collections/nicotine-pouches" },
        { label: "Accessories", href: "/collections/accessories" },
        { label: "Vape Deals", href: "/vape-deals" },
        { label: "Refurbished Kits", href: "/collections/refurbished-kits" },
      ],
    },
  ];
  const aliases: Record<string, string> = {
    "/brands": "/pages/brands",
    "/guides": "/pages/guides",
    "/black-friday": "/pages/black-friday",
    "/eco-smok-wholesale": "/pages/eco-smok-wholesale",
    "/sitemap": "/pages/sitemap",
    "/pages/vape-deals": "/vape-deals",
  };
  const existingByTitle = new Map(columns.map((column) => [column.title.toLowerCase(), column]));
  const mergedColumns = requiredColumns.map((required) => {
    const existing = existingByTitle.get(required.title.toLowerCase());
    const existingByLabel = new Map((existing?.links ?? []).map((link) => [link.label.toLowerCase(), link]));
    return {
      title: existing?.title || required.title,
      links: required.links.map((link) => {
        const saved = existingByLabel.get(link.label.toLowerCase());
        const href = saved?.href ? aliases[saved.href] || saved.href : link.href;
        return { label: saved?.label || link.label, href };
      }),
    };
  });
  return {
    ...DEFAULT_FOOTER_CONTENT,
    ...stored,
    columns: mergedColumns,
  };
}
export const updateFooterContent = (content: FooterContent) => updateContentByKey("footer", content);

// -------------------------------------------------------------------------
// Header nav content (admin-managed)
// -------------------------------------------------------------------------

export interface HeaderNavLink {
  label: string;
  href: string;
  megaMenu?: HeaderMegaMenuColumn[];
  hasMegaMenu?: boolean;
}

export interface HeaderMegaMenuColumn {
  title: string;
  links: HeaderNavLink[];
}

export interface HeaderContent {
  navLinks: HeaderNavLink[];
  megaMenu: HeaderMegaMenuColumn[];
}

const DEFAULT_HEADER_CONTENT: HeaderContent = {
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/collections/all" },
    { label: "Vape Kits", href: "/collections/vaping-kits" },
    { label: "E-Liquids", href: "/collections/e-liquids" },
    { label: "Prefilled Kits", href: "/collections/disposable-vape-alternatives" },
    { label: "Deals", href: "/vape-deals" },
    { label: "Blogs", href: "/blogs/news" },
    { label: "Track Order", href: "/track-order" },
  ],
  megaMenu: [
    {
      title: "Shop by Brand",
      links: [
        { label: "Elfliq by Elf Bar", href: "/collections/all?search=Elfliq%20by%20Elf%20Bar" },
        { label: "Bar Juice 5000", href: "/collections/all?search=Bar%20Juice%205000" },
        { label: "Elux Liquid", href: "/collections/all?search=Elux%20Liquid" },
        { label: "SKE Crystal", href: "/collections/all?search=SKE%20Crystal" },
        { label: "Hayati", href: "/collections/all?search=Hayati" },
        { label: "IVG", href: "/collections/all?search=IVG" },
        { label: "Lost Mary", href: "/collections/all?search=Lost%20Mary" },
        { label: "Hangsen", href: "/collections/all?search=Hangsen" },
        { label: "A-Steam", href: "/collections/all?search=A-Steam" },
        { label: "Nasty Juice", href: "/collections/all?search=Nasty%20Juice" },
      ],
    },
    {
      title: "Shop By Bestsellers",
      links: [
        { label: "Elux Legend", href: "/collections/all?search=Elux%20Legend" },
        { label: "Hayati", href: "/collections/all?search=Hayati" },
        { label: "Elfliq", href: "/collections/all?search=Elfliq" },
        { label: "IVG Salt", href: "/collections/all?search=IVG%20Salt" },
        { label: "Bar Juice 5000", href: "/collections/all?search=Bar%20Juice%205000" },
        { label: "SKE Crystal", href: "/collections/all?search=SKE%20Crystal" },
        { label: "Fruity Vapes", href: "/collections/all?search=Fruity%20Vapes" },
        { label: "Nasty Salt", href: "/collections/all?search=Nasty%20Salt" },
      ],
    },
    {
      title: "Shop By Flavour",
      links: [
        { label: "Blueberry", href: "/collections/all?search=Blueberry" },
        { label: "Grape", href: "/collections/all?search=Grape" },
        { label: "Gummy Bear", href: "/collections/all?search=Gummy%20Bear" },
        { label: "Lemon & Lime", href: "/collections/all?search=Lemon%20%26%20Lime" },
        { label: "Lemonade", href: "/collections/all?search=Lemonade" },
        { label: "Mango", href: "/collections/all?search=Mango" },
        { label: "Menthol", href: "/collections/all?search=Menthol" },
        { label: "Pineapple", href: "/collections/all?search=Pineapple" },
        { label: "Strawberry", href: "/collections/all?search=Strawberry" },
        { label: "Watermelon", href: "/collections/all?search=Watermelon" },
      ],
    },
    {
      title: "Shop By Offers",
      links: [
        { label: "Bundle Deal: 3 Free", href: "/vape-deals" },
        { label: "Best Sellers", href: "/collections/all?sortBy=best_selling" },
      ],
    },
  ],
};

export async function getHeaderContent(): Promise<HeaderContent> {
  const content = await getContentByKey<HeaderContent>("header", DEFAULT_HEADER_CONTENT);
  const normalizeLink = (link: HeaderNavLink): HeaderNavLink => ({
    ...link,
    href: link.href === "/pages/vape-deals" ? "/vape-deals" : link.href,
    megaMenu: link.megaMenu?.map((column) => ({ ...column, links: column.links.map(normalizeLink) })),
  });
  return {
    ...content,
    navLinks: content.navLinks.map(normalizeLink),
    megaMenu: content.megaMenu?.map((column) => ({ ...column, links: column.links.map(normalizeLink) })),
  };
}
export const updateHeaderContent = (content: HeaderContent) => updateContentByKey("header", content);

// -------------------------------------------------------------------------
// Policy pages (admin-managed): Privacy Policy, Terms of Service,
// Returns & Exchanges — all share the same heading/intro/sections shape.
// -------------------------------------------------------------------------

export interface PolicySection {
  heading: string;
  body: string;
}

export interface PolicyContent {
  heading: string;
  intro: string;
  sections: PolicySection[];
}

const DEFAULT_PRIVACY_CONTENT: PolicyContent = {
  heading: "Privacy Policy for Eco Smok",
  intro: "Last Updated: 27-10-2024\n\nEcoSmok.co.uk is committed to respecting and protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your information when you visit our website, www.ecosmok.co.uk (the \"Website\"). By using our Website, you consent to the practices described in this Privacy Policy.",
  sections: [
    {
      heading: "1. Information We Collect",
      body: "We may collect both personal and non-personal information to provide and improve our services:\n\nPersonal Information: When you make a purchase, create an account, or contact us, we may collect information such as your name, email address, phone number, mailing address, and payment information.\n\nUsage Information: We may collect data about how you use the Website, including IP address, browser type, device information, pages visited, and other usage data.",
    },
    {
      heading: "How We Use Your Information",
      body: "We may use your information for the following purposes:\n\n- To process and fulfill orders\n- To improve our products, services, and customer support\n- To send updates, promotions, and marketing communications, with your consent where required\n- To analyze usage trends and improve our Website\n- To comply with legal requirements and protect our rights",
    },
    {
      heading: "Sharing Your Information",
      body: "We do not sell, trade, or otherwise transfer your personal information to third parties except:\n\nService Providers: We may share information with trusted third-party service providers to help us operate the Website, fulfill orders, and process payments.\n\nLegal Compliance: We may disclose your information to comply with legal obligations, respond to requests from public authorities, and protect our rights and safety.",
    },
    {
      heading: "Cookies and Tracking Technologies",
      body: "We use cookies and similar tracking technologies to improve user experience, track usage, and analyze trends. You can adjust your browser settings to refuse cookies; however, this may affect the functionality of our Website.",
    },
    {
      heading: "Your Rights",
      body: "Depending on your location, you may have the following rights regarding your personal information:\n\n- Access to your information\n- Correction or deletion of your information\n- Objecting to or restricting the processing of your information\n- Data portability\n- Withdrawal of consent where processing is based on consent\n\nTo exercise any of these rights, please contact us at [Insert Contact Email](mailto:info@ecosmok.com).",
    },
    {
      heading: "Data Security",
      body: "We take reasonable precautions to secure your information. However, please note that no data transmission over the internet or electronic storage is 100% secure. We cannot guarantee the absolute security of your information.",
    },
    {
      heading: "Children's Privacy",
      body: "Our Website is not intended for individuals under the age of 18, and we do not knowingly collect information from children. If you believe we have collected personal information from a child, please contact us to have it removed.",
    },
    {
      heading: "Changes to This Privacy Policy",
      body: "We may update this Privacy Policy periodically. We encourage you to review this policy regularly for any changes. Continued use of our Website constitutes acceptance of any updated terms.",
    },
    {
      heading: "Contact Us",
      body: "If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:\n\nEcoSmok.co.uk\nEmail: [info@ecosmok.com](mailto:info@ecosmok.com)\nAddress: Eco Smok Store, 23 Lockett Street, Manchester, M8 8EE\n\nCompany number: 10366027\n\nMake sure to insert the relevant contact information and check for compliance with your region's data protection regulations.",
    },
  ],
};

const DEFAULT_TERMS_CONTENT: PolicyContent = {
  heading: "EcoSmok Terms & Conditions",
  intro:
    "Please be advised that any information provided on this website, including but not limited to product descriptions, may not be entirely current or accurate at all times. We strive to keep all details reasonably up to date; however, you should not consider the information on this website as fully factual or reliable.",
  sections: [
    {
      heading: "Medical Disclaimer",
      body: "Any knowledge or guidance obtained from our website is not intended for medical purposes. If you have any concerns about the medical suitability of any of our products, we strongly recommend consulting a qualified healthcare professional, such as your GP, before use. EcoSmok.co.uk cannot be held liable for any health-related issues that may result from using our products. EcoSmok has not conducted medical research on the products and is, therefore, not in a position to advise on medical suitability for individual use.",
    },
    {
      heading: "Product Information",
      body: "As a re-seller, EcoSmok.co.uk offers products manufactured outside our control, and you assume full responsibility for their use and any resulting outcomes. This disclaimer does not affect your statutory rights. Please note that product images may vary from the actual product descriptions.",
    },
    {
      heading: "Warranty & Returns",
      body: "Products like atomisers, cartomisers, and clearomisers come with a \"dead on arrival\" warranty due to their semi-disposable nature. If you receive a defective item, please inform us within 3 working days to arrange a replacement. Refunds are only available if the product is returned unused with the original seal intact.\n\nFor other items, such as batteries, cases, and chargers, heavy damage or neglect may void the warranty. To initiate a return, email us at info@ecosmok.com with all relevant details to expedite processing.\n\nReturns are processed weekly upon receipt and approval, and we aim to complete each return within 7 days. Refunds not covered by this policy adhere to statutory consumer rights.",
    },
    {
      heading: "Age Restriction and Verification",
      body: "It is against the law to sell electronic cigarette products to individuals under 18.\n\nWhen purchasing age-restricted items, your information may be shared with age verification providers to ensure you meet the legal age requirements.",
    },
    {
      heading: "OneID Age Verification",
      body: "OneID provides a secure, reliable solution for verifying customer age online, especially for age-restricted products like those sold at EcoSmok.co.uk. Using digital identification, OneID verifies age by cross-referencing data directly with trusted sources, ensuring accurate, real-time confirmation without storing sensitive information. This streamlined process not only protects the customer’s privacy but also meets legal compliance standards, making it easier for customers to make purchases confidently and for businesses to prevent underage sales. With OneID, EcoSmok.co.uk ensures that all customers meet the legal age requirement, creating a safer shopping environment for everyone.",
    },
    {
      heading: "1. Interpretation",
      body: "The following words have these meanings throughout the Conditions:\n\n\"Conditions\" means the terms and conditions set out in this document.\n\n\"Consumer\" means an individual acting for purposes which are wholly or mainly outside their trade, business, craft or profession.\n\n\"Contract\" means the legally-binding agreement between you and us for the sale and purchase of Goods which incorporates these Conditions.\n\n\"Delivery Location\" means the location where the Goods are to be delivered, as set out in the Order.\n\n\"Goods\" means any goods that we supply to you, of the number and description and any relating documentation as set out in your Order.\n\n\"Order\" means your order for the Goods from us, as set out in your order form.\n\n\"Specification\" means the description or specification of the Goods set out on our Website.",
    },
    {
      heading: "2. Application of these Terms and Contract Formation",
      body: "2.1 Any estimate provided by us for the supply of Goods prior to your submission of an Order does not constitute a binding offer to provide those Goods.\n\n2.2 When you place an Order for Goods, you are submitting a binding offer to purchase those Goods in accordance with these Terms and Conditions.\n\n2.3 Once you place an Order, we may send you an email to acknowledge receipt of your Order. However, this does not imply that we have accepted your Order.\n\n2.4 We reserve the right to reject any Order for any reason. If we do so, we will aim to inform you promptly, with reasons which may include stock shortages, pricing or description errors, payment issues, age verification problems, or other legitimate reasons.\n\n2.5 A Contract for the ordered Goods will only be established once we email you to confirm acceptance of your Order, or, if earlier, when we deliver the Goods to you.\n\n2.6 We will provide you with a copy of the signed Contract or confirmation containing all relevant information, in a legible format, within a reasonable period after the Contract is established, and no later than at the delivery of any Goods under the Contract.\n\n2.7 No modification of the Contract, whether related to the Goods’ description, price, or otherwise, is allowed after formation unless both parties mutually agree.\n\n2.8 These Terms are intended to apply only to Contracts where you are a Consumer. If you are not acting as a Consumer, please inform us so that we may provide you with a different contract that includes terms more suited to business transactions, potentially offering additional rights as a business customer.\n\n2.9 In forming the Contract, we act solely on our behalf, and should you have any complaints, our contact address is Eco Smok Store, 23 Lockett Street, Manchester, M8 8EE.",
    },
    {
      heading: "Contact Us",
      body: "If you have any questions or concerns about these Terms & Conditions or our data practices, please contact us at:\n\nEcoSmok.co.uk\nEmail: info@ecosmok.com\nAddress: Eco Smok Store, 23 Lockett Street, Manchester, M8 8EE\n\nCompany number: 10366027",
    },
  ],
};

const DEFAULT_RETURNS_CONTENT: PolicyContent = {
  heading: "Returns & Exchanges",
  intro:
    "We want you to love what you ordered. If something isn't right, here's how returns and exchanges work.",
  sections: [
    {
      heading: "Return Window",
      body: "Unworn, unwashed items with tags attached can be returned within 7 days of delivery for store credit or exchange.",
    },
    {
      heading: "Non-Returnable Items",
      body: "Unstitched fabric that has been cut, and made-to-order or boutique-exclusive pieces, cannot be returned unless the item arrived damaged or defective.",
    },
    {
      heading: "How to Start a Return",
      body: "Contact us via the Contact page with your order number and reason for return. Our team will confirm pickup or drop-off details.",
    },
    {
      heading: "Refunds",
      body: "Approved returns are processed as store credit within 5-7 business days. Cash refunds are only issued for orders paid online, minus any shipping fees already incurred.",
    },
  ],
};

export const getPrivacyContent = () => getContentByKey("privacy", DEFAULT_PRIVACY_CONTENT);
export const updatePrivacyContent = (content: PolicyContent) => updateContentByKey("privacy", content);

export async function getTermsContent(): Promise<PolicyContent> {
  const stored = await getContentByKey<Partial<PolicyContent>>("terms", {});
  const hasLegacyTerms =
    stored.heading === "Terms & Conditions" ||
    stored.sections?.some((section) => section.heading === "Orders & Payment");

  return hasLegacyTerms
    ? DEFAULT_TERMS_CONTENT
    : { ...DEFAULT_TERMS_CONTENT, ...stored, sections: stored.sections ?? DEFAULT_TERMS_CONTENT.sections };
}
export const updateTermsContent = (content: PolicyContent) => updateContentByKey("terms", content);

export const getReturnsContent = () => getContentByKey("returns", DEFAULT_RETURNS_CONTENT);
export const updateReturnsContent = (content: PolicyContent) => updateContentByKey("returns", content);

// -------------------------------------------------------------------------
// Size Guide (admin-managed): intro/sections plus a measurement chart.
// -------------------------------------------------------------------------

export interface SizeChartRow {
  size: string;
  chest: string;
  waist: string;
  hips: string;
  length: string;
}

export interface SizeGuideContent {
  heading: string;
  intro: string;
  sizeChart: SizeChartRow[];
  sections: PolicySection[];
}

const DEFAULT_SIZE_GUIDE_CONTENT: SizeGuideContent = {
  heading: "Size Guide",
  intro: "All measurements are in inches. If you're between sizes, we recommend sizing up for a relaxed fit.",
  sizeChart: [
    { size: "S", chest: "36", waist: "30", hips: "38", length: "40" },
    { size: "M", chest: "38", waist: "32", hips: "40", length: "41" },
    { size: "L", chest: "40", waist: "34", hips: "42", length: "42" },
    { size: "XL", chest: "42", waist: "36", hips: "44", length: "43" },
  ],
  sections: [
    {
      heading: "How to Measure",
      body: "Chest: measure around the fullest part of your chest. Waist: measure around your natural waistline. Hips: measure around the fullest part of your hips. Length: measure from shoulder to hem.",
    },
    {
      heading: "Custom Sizing",
      body: "Ordering an unstitched suit and want it tailored to your exact measurements? Mention it in your order notes at checkout or reach out via our Contact page.",
    },
  ],
};

export const getSizeGuideContent = () => getContentByKey("size-guide", DEFAULT_SIZE_GUIDE_CONTENT);
export const updateSizeGuideContent = (content: SizeGuideContent) =>
  updateContentByKey("size-guide", content);
