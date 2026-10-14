import { prisma } from "../config/db";
import { calculateShipping } from "./shipping.service";
import { CheckoutRequest, CheckoutResponse } from "../types";
import { Prisma } from "@prisma/client";
import { getRewardSettings, maxRedeemablePoints } from "./reward.service";

type CheckoutVariant = Prisma.ProductVariantGetPayload<{
  include: { product: { include: { category: { include: { parent: true } } } } };
}>;

export class CheckoutError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
    this.name = "CheckoutError";
  }
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `BQ-${year}-${random}`;
}

/**
 * Validates line items against live stock, applies an optional coupon,
 * calculates city-based shipping, and persists the order + order items
 * inside a single transaction so stock and totals never drift.
 */
export async function processCodCheckout(
  payload: CheckoutRequest,
  userId?: string,
): Promise<CheckoutResponse> {
  if (!payload.items.length) {
    throw new CheckoutError("Cart is empty.");
  }

  return prisma.$transaction(async (tx) => {
    let subtotal = 0;
    const resolvedItems: {
      productId: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
      bundleGroupId?: string;
    }[] = [];
    const validatedItems: { item: CheckoutRequest["items"][number]; variant: CheckoutVariant }[] = [];
    const requestedStock = new Map<string, number>();

    for (const item of payload.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        throw new CheckoutError("Each item quantity must be a whole number between 1 and 100.");
      }

      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: { include: { category: { include: { parent: true } } } } },
      });

      if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
        throw new CheckoutError(`Variant ${item.variantId} is not available.`);
      }
      if (variant.productId !== item.productId) {
        throw new CheckoutError("Cart contains an invalid product variant.");
      }
      const totalRequested = (requestedStock.get(item.variantId) ?? 0) + item.quantity;
      requestedStock.set(item.variantId, totalRequested);
      if (variant.stockQuantity < totalRequested) {
        throw new CheckoutError(
          `Insufficient stock for "${variant.product.title}" (${variant.color}, ${variant.size}). Only ${variant.stockQuantity} left for the requested quantity.`,
        );
      }

      validatedItems.push({ item, variant });
    }

    const bundleGroups = new Map<string, typeof validatedItems>();
    for (const entry of validatedItems) {
      const { bundleGroupId, bundleRole } = entry.item;
      if (bundleRole !== undefined && bundleRole !== "MAIN" && bundleRole !== "FREEBIE") {
        throw new CheckoutError("Cart contains an invalid bundle role.");
      }
      if (!bundleGroupId && bundleRole) throw new CheckoutError("Bundle items must belong to a bundle group.");
      if (bundleGroupId && !bundleRole) throw new CheckoutError("Bundle items are missing their role.");
      if (!bundleGroupId) continue;
      const group = bundleGroups.get(bundleGroupId) ?? [];
      group.push(entry);
      bundleGroups.set(bundleGroupId, group);
    }

    for (const group of bundleGroups.values()) {
      const mainItems = group.filter(({ item }) => item.bundleRole === "MAIN");
      const freeItems = group.filter(({ item }) => item.bundleRole === "FREEBIE");
      const rawConfig = mainItems[0]?.variant.product.bundleConfig;
      const configuredFreeCount =
        rawConfig && typeof rawConfig === "object" && "freeProductCount" in rawConfig
          ? Number((rawConfig as { freeProductCount?: unknown }).freeProductCount)
          : 2;
      const configuredMinFlavours = rawConfig && typeof rawConfig === "object" && "minFlavours" in rawConfig
        ? Number((rawConfig as { minFlavours?: unknown }).minFlavours)
        : configuredFreeCount;
      const configuredMaxFlavours = rawConfig && typeof rawConfig === "object" && "maxFlavours" in rawConfig
        ? Number((rawConfig as { maxFlavours?: unknown }).maxFlavours)
        : configuredFreeCount;
      const configuredMinCoils = rawConfig && typeof rawConfig === "object" && "minCoils" in rawConfig
        ? Math.max(1, Number((rawConfig as { minCoils?: unknown }).minCoils))
        : 1;
      const configuredMaxCoils = rawConfig && typeof rawConfig === "object" && "maxCoils" in rawConfig
        ? Math.max(configuredMinCoils, Number((rawConfig as { maxCoils?: unknown }).maxCoils))
        : configuredMinCoils;
      if (mainItems.length !== 1 || freeItems.length < configuredMinFlavours + configuredMinCoils || freeItems.length > configuredMaxFlavours + configuredMaxCoils) {
        throw new CheckoutError(`This bundle requires ${configuredMinCoils}-${configuredMaxCoils} coils and ${configuredMinFlavours}-${configuredMaxFlavours} flavours.`);
      }

      const main = mainItems[0];
      const allowedCollections =
        rawConfig && typeof rawConfig === "object" && Array.isArray((rawConfig as { componentCollections?: unknown }).componentCollections)
          ? (rawConfig as { componentCollections: unknown[] }).componentCollections.filter((slug): slug is string => typeof slug === "string")
          : main.variant.product.bundleCollectionSlugs;
      const allowedProductIds =
        rawConfig && typeof rawConfig === "object" && Array.isArray((rawConfig as { componentProductIds?: unknown }).componentProductIds)
          ? (rawConfig as { componentProductIds: unknown[] }).componentProductIds.filter((id): id is string => typeof id === "string")
          : [];
      const allowedFlavourIds = rawConfig && typeof rawConfig === "object" && Array.isArray((rawConfig as { flavourProductIds?: unknown }).flavourProductIds)
        ? (rawConfig as { flavourProductIds: unknown[] }).flavourProductIds.filter((id): id is string => typeof id === "string")
        : [];
      const allowedCoilIds = rawConfig && typeof rawConfig === "object" && Array.isArray((rawConfig as { coilProductIds?: unknown }).coilProductIds)
        ? (rawConfig as { coilProductIds: unknown[] }).coilProductIds.filter((id): id is string => typeof id === "string")
        : [];
      const selectedCoilCount = allowedCoilIds.length
        ? freeItems.filter(({ variant }) => allowedCoilIds.includes(variant.productId)).length
        : configuredMinCoils;
      const selectedFlavourCount = freeItems.length - selectedCoilCount;
      if (selectedCoilCount < configuredMinCoils || selectedCoilCount > configuredMaxCoils || selectedFlavourCount < configuredMinFlavours || selectedFlavourCount > configuredMaxFlavours) {
        throw new CheckoutError(`Select ${configuredMinCoils}-${configuredMaxCoils} coils and between ${configuredMinFlavours} and ${configuredMaxFlavours} flavours.`);
      }
      if (!main.variant.product.bundleEnabled || !allowedCollections.length) {
        throw new CheckoutError("This product does not have an active bundle offer.");
      }
      if (group.some(({ item }) => item.quantity !== main.item.quantity)) {
        throw new CheckoutError("Bundle item quantities must match the main product quantity.");
      }
      const freeProductIds = new Set(freeItems.map(({ variant }) => variant.productId));
      if (freeProductIds.size !== freeItems.length || freeProductIds.has(main.variant.productId)) {
        throw new CheckoutError("Choose different add-on products for the bundle.");
      }
      const freeVariantIds = new Set(freeItems.map(({ item }) => item.variantId));
      if (freeVariantIds.size !== freeItems.length) {
        throw new CheckoutError("Choose different free product variants for the bundle.");
      }
      for (const { variant } of freeItems) {
        if (allowedProductIds.length && !allowedProductIds.includes(variant.productId)) {
          throw new CheckoutError("A selected free product is not allowed in this bundle.");
        }
        if (allowedFlavourIds.length && !allowedFlavourIds.includes(variant.productId) && !allowedCoilIds.includes(variant.productId)) {
          throw new CheckoutError("A selected component is not allowed in this bundle.");
        }
        const categorySlug = variant.product.category.slug;
        const parentSlug = variant.product.category.parent?.slug;
        if (!allowedCollections.includes(categorySlug) && (!parentSlug || !allowedCollections.includes(parentSlug))) {
          throw new CheckoutError("A selected free product is not part of the main product's allowed bundle collections.");
        }
      }
    }

    for (const { item, variant } of validatedItems) {
      let unitPrice = item.bundleRole === "FREEBIE" ? 0 : Number(variant.variantPrice);
      if (item.bundleRole === "MAIN" && item.bundleGroupId) {
        const rawConfig = variant.product.bundleConfig;
        if (rawConfig && typeof rawConfig === "object") {
          const bundlePrice = Number((rawConfig as { bundlePrice?: unknown }).bundlePrice);
          const discountValue = Number((rawConfig as { discountValue?: unknown }).discountValue ?? 0);
          const discountType = (rawConfig as { discountType?: unknown }).discountType;
          if (Number.isFinite(bundlePrice) && bundlePrice >= 0) unitPrice = bundlePrice;
          else if (discountType === "FLAT" && Number.isFinite(discountValue)) unitPrice = Math.max(0, unitPrice - discountValue);
          else if (discountType === "PERCENTAGE" && Number.isFinite(discountValue)) unitPrice = Math.max(0, unitPrice * (1 - discountValue / 100));
        }
      }
      subtotal += unitPrice * item.quantity;

      resolvedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        bundleGroupId: item.bundleGroupId,
      });
    }

    // --- Coupon validation -----------------------------------------------
    let discountAmount = 0;
    let couponId: string | undefined;

    if (payload.couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: payload.couponCode } });

      if (!coupon || !coupon.isActive) {
        throw new CheckoutError("Invalid or expired coupon code.");
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new CheckoutError("This coupon has expired.");
      }
      if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
        throw new CheckoutError("This coupon has reached its usage limit.");
      }
      if (subtotal < Number(coupon.minOrderAmount)) {
        throw new CheckoutError(
          `Minimum order amount for this coupon is £${coupon.minOrderAmount}.`,
        );
      }

      discountAmount =
        coupon.discountType === "PERCENTAGE"
          ? (subtotal * Number(coupon.value)) / 100
          : Number(coupon.value);
      discountAmount = Math.min(discountAmount, subtotal);
      couponId = coupon.id;

      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    let rewardDiscount = 0;
    const rewardSettings = await getRewardSettings(tx);
    const rewardPoints = payload.rewardPoints ?? 0;
    if (!Number.isInteger(rewardPoints) || rewardPoints < 0) {
      throw new CheckoutError("Reward points must be a whole number.");
    }
    if (rewardPoints > 0) {
      if (!userId) throw new CheckoutError("Log in to redeem reward points.");
      const maxPoints = maxRedeemablePoints(subtotal - discountAmount, rewardSettings);
      if (rewardPoints > maxPoints) {
        throw new CheckoutError(`You can redeem up to ${maxPoints} points on this order.`);
      }
      const account = await tx.rewardAccount.findUnique({ where: { userId } });
      if (!account || account.balance < rewardPoints) {
        throw new CheckoutError("Insufficient reward points.");
      }
      rewardDiscount = rewardPoints * rewardSettings.valuePerPoint;
      await tx.rewardAccount.update({
        where: { id: account.id },
        data: { balance: { decrement: rewardPoints } },
      });
      await tx.rewardTransaction.create({
        data: { accountId: account.id, points: -rewardPoints, reason: "Redeemed at checkout" },
      });
    }

    // --- Shipping ----------------------------------------------------------
    const shippingQuote = await calculateShipping({
      city: payload.shippingCity,
      subtotal: subtotal - discountAmount,
    });

    const totalAmount = Math.max(0, subtotal - discountAmount - rewardDiscount) + shippingQuote.fee;

    // --- Persist order -------------------------------------------------
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        customerPhone: payload.customerPhone,
        isGuestCheckout: !userId,
        userId,
        status: "PENDING",
        shippingAddress: payload.shippingAddress,
        shippingCity: payload.shippingCity,
        shippingFee: shippingQuote.fee,
        subtotal,
        discountAmount,
        totalAmount,
        paymentMethod: payload.paymentMethod,
        couponId,
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            bundleGroupId: item.bundleGroupId,
          })),
        },
      },
    });

    // --- Decrement stock -------------------------------------------------
    for (const item of resolvedItems) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + shippingQuote.etaDays);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      shippingFee: Number(order.shippingFee),
      estimatedDelivery: etaDate.toISOString().split("T")[0],
    };
  });
}

export async function trackOrder(orderNumber: string, phone: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { product: true, variant: true } } },
  });

  if (!order || order.customerPhone !== phone) {
    throw new CheckoutError("No matching order found for that Order ID and phone number.", 404);
  }

  return order;
}
