"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Minus, Plus, Ruler, ShieldCheck, Star, ZoomIn } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { useCartStore } from "@/store/useCartStore";
import BundleAddonSelector, { SelectedBundleAddon } from "./BundleAddonSelector";

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  fabricOption: string | null;
  variantPrice: number;
  stockQuantity: number;
  imageUrl?: string | null;
  flavour?: string | null;
  nicotineStrength?: string | null;
  isActive?: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  imageUrls: string[];
}

export interface BundleProductOption {
  id: string;
  title: string;
  slug: string;
  brand?: string | null;
  images: { url: string; altText: string | null }[];
  variants: ProductVariant[];
  bundleTypes?: Array<"flavour" | "coil">;
}

export interface BundleConfig {
  heading: string;
  description: string;
  mainLabel: string;
  freeProductLabel: string;
  freeProductCount: number;
  componentCollections: string[];
  flavourCollections: string[];
  coilCollections: string[];
  componentProductIds: string[];
  coilProductIds: string[];
  flavourProductIds: string[];
  minCoils: number;
  maxCoils: number;
  minFlavours: number;
  maxFlavours: number;
  bundlePrice?: number | null;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  steps: string[];
}

export interface ProductDetailProps {
  id: string;
  title: string;
  slug: string;
  description: string;
  fabricDetails: string | null;
  careInstructions: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: Review[];
  bundleEnabled: boolean;
  bundleCollectionSlugs: string[];
  bundleConfig?: BundleConfig | null;
  bundleProducts?: BundleProductOption[];
  pairedProducts?: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    basePrice: number;
    variants: ProductVariant[];
  }[];
  relatedProducts?: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    basePrice: number;
    variants: ProductVariant[];
  }[];
}

export default function ProductDetail(product: ProductDetailProps) {
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size))),
    [product.variants],
  );
  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color))),
    [product.variants],
  );

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isCareOpen, setIsCareOpen] = useState(false);
  const [bundleStep, setBundleStep] = useState<"variant" | "addons">("variant");
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [pairedVariantIds, setPairedVariantIds] = useState<Record<string, string>>({});
  const [relatedVariantIds, setRelatedVariantIds] = useState<Record<string, string>>({});
  const relatedProductsRef = useRef<HTMLDivElement>(null);
  const [liveAvailability, setLiveAvailability] = useState<{
    available: boolean;
    stockQuantity: number;
    price: number | null;
  } | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setPairedVariantIds(
      Object.fromEntries(
        (product.pairedProducts ?? []).map((pairedProduct) => {
          const firstAvailable = pairedProduct.variants.find(
            (variant) => variant.isActive !== false && variant.stockQuantity > 0,
          ) ?? pairedProduct.variants[0];
          return [pairedProduct.id, firstAvailable?.id ?? ""];
        }),
      ),
    );
  }, [product.pairedProducts]);

  useEffect(() => {
    setRelatedVariantIds(
      Object.fromEntries(
        (product.relatedProducts ?? []).map((relatedProduct) => {
          const firstAvailable = relatedProduct.variants.find(
            (variant) => variant.isActive !== false && variant.stockQuantity > 0,
          ) ?? relatedProduct.variants[0];
          return [relatedProduct.id, firstAvailable?.id ?? ""];
        }),
      ),
    );
  }, [product.relatedProducts]);

  const activeVariant = useMemo(
    () =>
      product.variants.find(
        (v) => v.size === selectedSize && v.color === selectedColor,
      ) ?? null,
    [product.variants, selectedSize, selectedColor],
  );

  const galleryImages = useMemo(() => {
    if (!activeVariant?.imageUrl) return product.images;
    const variantImage: ProductImage = {
      id: `variant-${activeVariant.id}`,
      url: activeVariant.imageUrl,
      altText: `${product.title} ${activeVariant.flavour || activeVariant.color}`,
    };
    return [variantImage, ...product.images.filter((image) => image.url !== variantImage.url)];
  }, [activeVariant?.id, activeVariant?.imageUrl, activeVariant?.flavour, activeVariant?.color, product.images, product.title]);

  useEffect(() => {
    setActiveImageIdx(0);
  }, [activeVariant?.id]);

  const displayPrice = liveAvailability?.price ?? activeVariant?.variantPrice ?? 0;
  const displayStock = liveAvailability?.stockQuantity ?? activeVariant?.stockQuantity ?? 0;

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null;

  /** Re-fetch live stock/price whenever the variant selection changes. */
  async function refreshAvailability(variantId: string) {
    setIsCheckingStock(true);
    try {
      const availability = await api.getVariantAvailability(variantId);
      setLiveAvailability(availability as typeof liveAvailability);
    } catch {
      // Non-fatal: fall back to the last-known variant data already shown.
    } finally {
      setIsCheckingStock(false);
    }
  }

  function handleSizeChange(size: string) {
    setSelectedSize(size);
    const match = product.variants.find((v) => v.size === size && v.color === selectedColor);
    if (match) refreshAvailability(match.id);
  }

  function handleColorChange(color: string) {
    setSelectedColor(color);
    const match = product.variants.find((v) => v.size === selectedSize && v.color === color);
    if (match) refreshAvailability(match.id);
  }

  function handleAddToCart() {
    if (!activeVariant || displayStock <= 0) return;
    addItem({
      productId: product.id,
      variantId: activeVariant.id,
      title: product.title,
      slug: product.slug,
      imageUrl: product.images[0]?.url ?? "/placeholder-product.jpg",
      size: activeVariant.size,
      color: activeVariant.color,
      unitPrice: displayPrice,
      quantity,
      stockQuantity: displayStock,
    });
  }

  function addPairedProductToCart(pairedProduct: NonNullable<ProductDetailProps["pairedProducts"]>[number]) {
    const variant = pairedProduct.variants.find(
      (item) => item.id === pairedVariantIds[pairedProduct.id],
    );
    if (!variant || variant.stockQuantity <= 0) return;

    addItem({
      productId: pairedProduct.id,
      variantId: variant.id,
      title: pairedProduct.title,
      slug: pairedProduct.slug,
      imageUrl: pairedProduct.imageUrl ?? "/placeholder-product.jpg",
      size: variant.size,
      color: variant.flavour || variant.color,
      unitPrice: variant.variantPrice,
      quantity: 1,
      stockQuantity: variant.stockQuantity,
    });
  }

  function addRelatedProductToCart(relatedProduct: NonNullable<ProductDetailProps["relatedProducts"]>[number]) {
    const variant = relatedProduct.variants.find((item) => item.id === relatedVariantIds[relatedProduct.id]);
    if (!variant || variant.stockQuantity <= 0) return;

    addItem({
      productId: relatedProduct.id,
      variantId: variant.id,
      title: relatedProduct.title,
      slug: relatedProduct.slug,
      imageUrl: relatedProduct.imageUrl ?? "/placeholder-product.jpg",
      size: variant.size,
      color: variant.flavour || variant.color,
      unitPrice: variant.variantPrice,
      quantity: 1,
      stockQuantity: variant.stockQuantity,
    });
  }

  function scrollRelatedProducts(direction: "left" | "right") {
    relatedProductsRef.current?.scrollBy({
      left: direction === "right" ? relatedProductsRef.current.clientWidth : -relatedProductsRef.current.clientWidth,
      behavior: "smooth",
    });
  }

  function handleAddBundleToCart(addons: SelectedBundleAddon[]) {
    const requiredAddonCount = (product.bundleConfig?.minFlavours ?? product.bundleConfig?.freeProductCount ?? 2)
      + (product.bundleConfig?.minCoils ?? ((product.bundleConfig?.coilProductIds?.length ?? 0) > 0 ? 1 : 0));
    if (!activeVariant || displayStock <= 0 || addons.length < requiredAddonCount) return;
    const bundleConfig = product.bundleConfig;
    const bundlePrice = bundleConfig?.bundlePrice ?? (
      bundleConfig?.discountType === "FLAT"
        ? Math.max(0, displayPrice - (bundleConfig.discountValue ?? 0))
        : bundleConfig?.discountType === "PERCENTAGE"
          ? Math.max(0, displayPrice * (1 - (bundleConfig.discountValue ?? 0) / 100))
          : displayPrice
    );
    const bundleGroupId = crypto.randomUUID();
    addItem({
      productId: product.id,
      variantId: activeVariant.id,
      title: product.title,
      slug: product.slug,
      imageUrl: product.images[0]?.url ?? "/placeholder-product.jpg",
      size: activeVariant.size,
      color: activeVariant.color,
      unitPrice: bundlePrice,
      quantity,
      stockQuantity: displayStock,
      bundleGroupId,
      bundleRole: "MAIN",
    });
    for (const addon of addons) {
      addItem({
        productId: addon.product.id,
        variantId: addon.variant.id,
        title: addon.product.title,
        slug: addon.product.slug,
        imageUrl: addon.product.images[0]?.url ?? "/placeholder-product.jpg",
        size: addon.variant.size,
        color: addon.variant.flavour || addon.variant.color,
        unitPrice: 0,
        quantity,
        stockQuantity: addon.variant.stockQuantity,
        bundleGroupId,
        bundleRole: "FREEBIE",
      });
    }
    setBundleStep("variant");
  }

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16">
      {/* --------------------------------------------------------------- */}
      {/* Image Gallery                                                    */}
      {/* --------------------------------------------------------------- */}
      <div>
        <div
          className="group relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-[#F5F2EC]"
          onClick={() => setIsZoomed(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImageIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative h-full w-full"
            >
                <Image
                  src={galleryImages[activeImageIdx]?.url ?? "/placeholder-product.jpg"}
                  alt={galleryImages[activeImageIdx]?.altText ?? product.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-4 right-4 rounded-full bg-white/90 p-2 shadow-md">
            <ZoomIn className="h-4 w-4 text-[#0A2540]" />
          </div>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto">
            {galleryImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveImageIdx(idx)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                idx === activeImageIdx ? "border-[#0A2540]" : "border-transparent"
              }`}
            >
              <Image src={img.url} alt={img.altText ?? ""} fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Details & Purchase Panel                                         */}
      {/* --------------------------------------------------------------- */}
      <div>
        <h1 className="font-serif text-[2.3rem] font-bold leading-tight text-[#0A2540]">{product.title}</h1>

        {averageRating && (
          <div className="mt-2 flex items-center gap-1 text-sm text-neutral-600">
            <Star className="h-4 w-4 fill-[#C5DC3B] text-[#C5DC3B]" />
            {averageRating.toFixed(1)} · {product.reviews.length} reviews
          </div>
        )}

        <p className="mt-4 text-2xl font-semibold text-[#0A2540]">
          {formatCurrency(displayPrice)}
          {isCheckingStock && <span className="ml-2 text-sm text-neutral-400">updating…</span>}
        </p>

        {(!product.bundleEnabled || bundleStep === "variant") && <>
        {/* Color / flavour selector */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-neutral-800">{product.bundleEnabled ? "Main flavour / option" : "Color"}: {selectedColor}</p>
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  color === selectedColor
                    ? "border-[#0A2540] bg-[#0A2540] text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-[#0A2540]"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Size selector */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-800">Size: {selectedSize}</p>
            <button className="flex items-center gap-1 text-xs text-neutral-500 underline">
              <Ruler className="h-3 w-3" /> Size guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = product.variants.find(
                (v) => v.size === size && v.color === selectedColor,
              );
              const outOfStock = !variant || variant.stockQuantity === 0;
              return (
                <button
                  key={size}
                  disabled={outOfStock}
                  onClick={() => handleSizeChange(size)}
                  className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm transition-colors ${
                    size === selectedSize
                      ? "border-[#0A2540] bg-[#0A2540] text-white"
                      : outOfStock
                        ? "cursor-not-allowed border-neutral-200 text-neutral-300 line-through"
                        : "border-neutral-300 text-neutral-700 hover:border-[#0A2540]"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
        </>}

        {/* Quantity + Add to Cart */}
        {(!product.bundleEnabled || bundleStep === "variant") && <div className="mt-8 flex items-center gap-4">
          <div className="flex items-center rounded-lg border border-neutral-300">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-3 text-neutral-600 hover:text-[#0A2540]"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
              className="p-3 text-neutral-600 hover:text-[#0A2540]"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={product.bundleEnabled ? () => setBundleStep("addons") : handleAddToCart}
            disabled={!activeVariant || displayStock <= 0}
            className="site-action flex-1 py-3.5 disabled:cursor-not-allowed"
          >
            {product.bundleEnabled ? "Next: Select flavours" : displayStock <= 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>}

        {product.bundleEnabled && bundleStep === "addons" && activeVariant && (
          <BundleAddonSelector
            products={product.bundleProducts ?? []}
            config={product.bundleConfig}
            mainProduct={{
              title: product.title,
              imageUrl: product.images[0]?.url ?? "/placeholder-product.jpg",
              variant: activeVariant,
            }}
            mainPrice={displayPrice}
            quantity={quantity}
            mainAvailable={displayStock > 0}
            onBack={() => setBundleStep("variant")}
            onConfirm={handleAddBundleToCart}
          />
        )}

        {product.bundleEnabled && bundleStep === "variant" && displayStock <= 0 && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">
            Bundle selection is unavailable because this main product option is out of stock. Choose an in-stock option or restock it to continue.
          </p>
        )}

        {displayStock > 0 && displayStock <= 5 && (
          <p className="mt-2 text-xs text-red-600">Only {displayStock} left in this size/color.</p>
        )}

        {/* Care instructions accordion */}
        {product.careInstructions && (
          <div className="mt-8 border-t border-neutral-200 pt-4">
            <button
              onClick={() => setIsCareOpen((o) => !o)}
              className="flex w-full items-center justify-between text-left font-medium text-[#0A2540]"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Care Instructions
              </span>
              <span>{isCareOpen ? "−" : "+"}</span>
            </button>
            <AnimatePresence>
              {isCareOpen && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pt-3 text-sm text-neutral-600"
                >
                  {product.careInstructions}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        {product.fabricDetails && (
          <div className="mt-3 border-t border-neutral-200 pt-4 text-sm text-neutral-600">
            <strong className="text-[#0A2540]">Fabric:</strong> {product.fabricDetails}
          </div>
        )}

        {product.pairedProducts?.length ? (
          <section className="mt-8 border-t border-neutral-200 pt-6">
            <header className="mb-3">
              <h2 className="text-base font-semibold text-[#111]">Pairs well with</h2>
            </header>
            <div className="space-y-2">
              {product.pairedProducts.map((pairedProduct) => (
                <div key={pairedProduct.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2.5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-white">
                    <Image src={pairedProduct.imageUrl ?? "/placeholder-product.jpg"} alt={pairedProduct.title} fill className="object-contain p-1" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium leading-4 text-[#111]">{pairedProduct.title}</p>
                    <p className="mt-1 text-xs text-neutral-700">
                      {formatCurrency(pairedProduct.variants.find((variant) => variant.id === pairedVariantIds[pairedProduct.id])?.variantPrice ?? pairedProduct.basePrice)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <select
                        value={pairedVariantIds[pairedProduct.id] ?? ""}
                        onChange={(event) => setPairedVariantIds((current) => ({ ...current, [pairedProduct.id]: event.target.value }))}
                        className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5 text-[10px] text-neutral-700"
                        aria-label={`Choose ${pairedProduct.title} option`}
                      >
                        {pairedProduct.variants.map((variant) => (
                          <option key={variant.id} value={variant.id} disabled={variant.isActive === false || variant.stockQuantity <= 0}>
                            {[variant.flavour, variant.color, variant.size].filter(Boolean).join(" / ") || "Default option"}
                            {variant.stockQuantity <= 0 ? " (Out of stock)" : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => addPairedProductToCart(pairedProduct)}
                        disabled={!pairedProduct.variants.some((variant) => variant.id === pairedVariantIds[pairedProduct.id] && variant.isActive !== false && variant.stockQuantity > 0)}
                        className="shrink-0 rounded bg-[#2f8738] px-5 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-[#26712e] disabled:cursor-not-allowed disabled:bg-neutral-300"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {product.relatedProducts?.length ? (
        <section className="col-span-full border-t border-neutral-200 pt-8 sm:pt-10">
          <header className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-[#0A2540] sm:text-2xl">Related Products</h2>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => scrollRelatedProducts("left")}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-neutral-300 bg-white text-[#111] transition-colors hover:bg-neutral-50"
                aria-label="Previous related products"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRelatedProducts("right")}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-neutral-300 bg-white text-[#111] transition-colors hover:bg-neutral-50"
                aria-label="Next related products"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div ref={relatedProductsRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {product.relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="flex w-[calc(50%-8px)] min-w-[220px] snap-start flex-col border border-neutral-200 bg-white sm:w-[calc(33.333%-11px)] lg:w-[calc(20%-13px)]">
                <div className="relative aspect-square shrink-0 overflow-hidden border-b border-neutral-200 bg-white">
                  <Image src={relatedProduct.imageUrl ?? "/placeholder-product.jpg"} alt={relatedProduct.title} fill className="object-contain p-5" sizes="(min-width: 1024px) 20vw, 50vw" />
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="line-clamp-2 min-h-10 text-xs font-medium leading-5 text-[#0A2540]">{relatedProduct.title}</p>
                  <p className="mt-2 text-sm font-semibold text-[#111]">
                    {formatCurrency(relatedProduct.variants.find((variant) => variant.id === relatedVariantIds[relatedProduct.id])?.variantPrice ?? relatedProduct.basePrice)}
                  </p>
                  <div className="mt-auto pt-3">
                    <select
                      value={relatedVariantIds[relatedProduct.id] ?? ""}
                      onChange={(event) => setRelatedVariantIds((current) => ({ ...current, [relatedProduct.id]: event.target.value }))}
                      className="mb-2 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-[11px] text-neutral-700"
                      aria-label={`Choose ${relatedProduct.title} option`}
                    >
                      {relatedProduct.variants.map((variant) => (
                        <option key={variant.id} value={variant.id} disabled={variant.isActive === false || variant.stockQuantity <= 0}>
                          {[variant.flavour, variant.color, variant.size].filter(Boolean).join(" / ") || "Default option"}
                          {variant.stockQuantity <= 0 ? " (Out of stock)" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => addRelatedProductToCart(relatedProduct)}
                      disabled={!relatedProduct.variants.some((variant) => variant.id === relatedVariantIds[relatedProduct.id] && variant.isActive !== false && variant.stockQuantity > 0)}
                      className="site-action w-full px-3 py-2.5 disabled:cursor-not-allowed"
                    >
                      Quick Buy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="col-span-full border-t border-neutral-200 pt-8 sm:pt-10">
        <header className="mb-5 max-w-3xl">
          <p className="mb-1 text-[11px] font-semibold uppercase text-[#66751e]">Product guide</p>
          <h2 className="font-serif text-2xl text-[#0A2540] sm:text-3xl">Product details</h2>
        </header>
        <article
          className="product-description max-w-4xl text-sm leading-7 text-neutral-700 [&_a]:font-medium [&_a]:text-[#0A2540] [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:border-b [&_h2]:border-neutral-200 [&_h2]:pb-2 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-[#0A2540] [&_hr]:my-7 [&_img]:mx-auto [&_img]:my-6 [&_img]:h-auto [&_img]:max-h-[560px] [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-2 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:font-semibold [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </section>

      {/* Fullscreen zoom overlay */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setIsZoomed(false)}
          >
            <div className="relative h-[85vh] w-[85vw] max-w-3xl">
              <Image
                src={galleryImages[activeImageIdx]?.url ?? "/placeholder-product.jpg"}
                alt={product.title}
                fill
                className="object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
