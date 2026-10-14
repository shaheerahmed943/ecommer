"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { BundleConfig, BundleProductOption, ProductVariant } from "./ProductDetail";
import { formatCurrency } from "@/lib/currency";

export interface SelectedBundleAddon {
  product: BundleProductOption;
  variant: ProductVariant;
}

interface BundleAddonSelectorProps {
  products: BundleProductOption[];
  config?: BundleConfig | null;
  mainProduct: { title: string; imageUrl: string; variant: ProductVariant };
  mainPrice: number;
  quantity: number;
  mainAvailable: boolean;
  onBack: () => void;
  onConfirm: (addons: SelectedBundleAddon[]) => void;
}

type SelectorStep = "products" | "review";

function variantLabel(variant: ProductVariant) {
  return [variant.flavour, variant.nicotineStrength, variant.color, variant.size]
    .filter(Boolean)
    .join(" · ");
}

export default function BundleAddonSelector({
  products,
  config,
  mainProduct,
  mainPrice,
  quantity,
  mainAvailable,
  onBack,
  onConfirm,
}: BundleAddonSelectorProps) {
  const effectiveConfig = config ?? {
    heading: "Build your bundle",
    description: "Choose your free products.",
    mainLabel: "Select main product option",
    freeProductLabel: "Free product",
    freeProductCount: 2,
    componentCollections: [],
    flavourCollections: [],
    coilCollections: [],
    componentProductIds: [],
    coilProductIds: [],
    flavourProductIds: [],
    minCoils: 0,
    maxCoils: 0,
    minFlavours: 2,
    maxFlavours: 2,
    bundlePrice: null,
    discountType: "PERCENTAGE" as const,
    discountValue: 0,
    steps: ["Select main product", "Select flavours", "Select coils", "Review bundle"],
  };
  const stepLabels = [
    ...effectiveConfig.steps,
    "Select main product",
    "Select flavours",
    "Select coils",
    "Review bundle",
  ].slice(0, 4);
  const requiredFlavours = Math.max(2, effectiveConfig.minFlavours);
  const maxFlavours = Math.max(requiredFlavours, effectiveConfig.maxFlavours);
  const hasConfiguredCoils =
    effectiveConfig.coilProductIds.length > 0 || effectiveConfig.coilCollections.length > 0;
  const minCoils = hasConfiguredCoils ? Math.max(1, effectiveConfig.minCoils ?? 1) : 0;
  const maxCoils = hasConfiguredCoils ? Math.max(minCoils, effectiveConfig.maxCoils ?? minCoils) : 0;
  const [step, setStep] = useState<SelectorStep>("products");
  const [selectionType, setSelectionType] = useState<"coil" | "flavour">("flavour");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const selected = useMemo(
    () =>
      selectedProductIds.flatMap((productId) => {
        const product = products.find((item) => item.id === productId);
        const variantId = selectedVariants[productId];
        const variant = product?.variants.find((item) => item.id === variantId);
        return product && variant ? [{ product, variant }] : [];
      }),
    [products, selectedProductIds, selectedVariants],
  );
  const isCoilProduct = (product: BundleProductOption) =>
    product.bundleTypes?.includes("coil") ||
    effectiveConfig.coilProductIds.includes(product.id);
  const selectedCoils = selected.filter((item) => isCoilProduct(item.product));
  const selectedFlavours = selected.filter((item) => !isCoilProduct(item.product));
  const eligibleProducts = products.filter((product) => {
    if (product.bundleTypes?.length) return product.bundleTypes.includes(selectionType);
    if (selectionType === "coil" && hasConfiguredCoils) return effectiveConfig.coilProductIds.includes(product.id);
    if (effectiveConfig.flavourProductIds.length) return effectiveConfig.flavourProductIds.includes(product.id);
    return !effectiveConfig.coilProductIds.includes(product.id);
  });
  const currentStepIndex = step === "review" ? 3 : selectionType === "flavour" ? 1 : 2;

  const originalFreePrice = selected.reduce((sum, item) => sum + item.variant.variantPrice, 0);
  const calculatedBundlePrice = effectiveConfig.bundlePrice ?? (
    effectiveConfig.discountType === "FLAT"
      ? Math.max(0, mainPrice - effectiveConfig.discountValue)
      : Math.max(0, mainPrice * (1 - effectiveConfig.discountValue / 100))
  );
  const savings = Math.max(0, (mainPrice - calculatedBundlePrice + originalFreePrice) * quantity);

  function chooseProduct(product: BundleProductOption) {
    const availableVariants = product.variants.filter(
      (variant) => variant.isActive !== false && variant.stockQuantity > 0,
    );
    if (!availableVariants.length) return;

    const alreadySelected = selectedProductIds.includes(product.id);
    if (alreadySelected) {
      setSelectedProductIds((current) => current.filter((id) => id !== product.id));
      return;
    }
    const currentCount = selectionType === "coil" ? selectedCoils.length : selectedFlavours.length;
    const limit = selectionType === "coil" ? maxCoils : maxFlavours;
    if (currentCount >= limit) {
      setError(`You can select only ${limit} ${selectionType === "coil" ? "coils" : "flavours"}.`);
      return;
    }

    setError("");
    setSelectedProductIds((current) => [...current, product.id]);
    setSelectedVariants((current) => ({
      ...current,
      [product.id]: current[product.id] ?? availableVariants[0].id,
    }));
  }

  function continueFromSelection() {
    if (!mainAvailable) {
      setError("The selected main product variant is currently out of stock.");
      return;
    }
    if (selectionType === "flavour" && selectedFlavours.length < requiredFlavours) {
      setError(`Please select at least ${requiredFlavours} flavours.`);
      return;
    }
    if (selectionType === "flavour") {
      setError("");
      setSelectionType("coil");
      return;
    }
    if (selectedCoils.length < minCoils || selectedCoils.length > maxCoils) {
      setError(`Please select ${minCoils}-${maxCoils} compatible coils.`);
      return;
    }
    setError("");
    setStep("review");
  }

  return (
    <section className="mt-7" aria-label="Build your product bundle">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-neutral-500">
        {stepLabels.map((label, index) => {
          const active = index === currentStepIndex;
          return (
            <div key={label} className={`flex items-center gap-2 ${active ? "text-[#0A2540]" : ""}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${active ? "border-[#0A2540] bg-[#0A2540] text-white" : "border-neutral-300"}`}>
                {index + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
              {index < stepLabels.length - 1 && <span className="mx-1 h-px w-5 bg-neutral-300 sm:w-10" />}
            </div>
          );
        })}
      </div>

      {step === "products" ? (
        <>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0A2540]">{selectionType === "coil" ? "Select compatible coil" : effectiveConfig.heading}</h2>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                {selectionType === "coil" ? "Choose a coil configured for this bundle product." : effectiveConfig.description}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[#0A2540]">
              {selectionType === "coil" ? `${selectedCoils.length} / ${maxCoils}` : `${selectedFlavours.length} / ${maxFlavours}`}
            </span>
          </div>

          {products.length ? (
            <div className={`grid grid-cols-3 gap-2 ${eligibleProducts.length > 3 ? "max-h-[600px] overflow-y-auto pr-1" : ""}`}>
              {eligibleProducts.map((product) => {
                const availableVariants = product.variants.filter(
                  (variant) => variant.isActive !== false && variant.stockQuantity > 0,
                );
                if (!availableVariants.length) return null;
                const selectedProduct = selectedProductIds.includes(product.id);
                const variantId = selectedVariants[product.id] ?? availableVariants[0].id;
                const selectedVariant = availableVariants.find((variant) => variant.id === variantId) ?? availableVariants[0];

                return (
                  <article key={product.id} className={`overflow-hidden rounded-lg border bg-white ${selectedProduct ? "border-[#0A2540] ring-1 ring-[#0A2540]" : "border-neutral-200"}`}>
                    <div className="relative aspect-square bg-[#F5F2EC]">
                      <Image
                        src={selectedVariant.imageUrl || product.images[0]?.url || "/placeholder-product.jpg"}
                        alt={product.images[0]?.altText ?? product.title}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 33vw, 160px"
                        className="object-contain p-1"
                      />
                      <span className="absolute left-1 top-1 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-semibold text-green-700">FREE</span>
                    </div>
                    <div className="p-1.5">
                      <p className="line-clamp-3 min-h-9 text-[10px] font-semibold leading-3 text-[#0A2540]">{product.title}</p>
                      {product.brand && <p className="mt-0.5 truncate text-[9px] text-neutral-500">{product.brand}</p>}
                      {availableVariants.length > 1 && (
                        <select
                          value={variantId}
                          aria-label={`Choose option for ${product.title}`}
                          onChange={(event) => setSelectedVariants((current) => ({ ...current, [product.id]: event.target.value }))}
                          className="mt-1.5 w-full rounded border border-neutral-300 bg-white px-1 py-1 text-[9px]"
                        >
                          {availableVariants.map((variant) => (
                            <option key={variant.id} value={variant.id}>{variantLabel(variant) || "Standard option"}</option>
                          ))}
                        </select>
                      )}
                      <p className="mt-1 line-clamp-2 min-h-6 text-[9px] leading-3 text-neutral-500">{variantLabel(selectedVariant) || "Standard option"} · Original {formatCurrency(selectedVariant.variantPrice)}</p>
                      <button
                        type="button"
                        onClick={() => chooseProduct(product)}
                        aria-pressed={selectedProduct}
                        className={`mt-1.5 min-h-8 w-full rounded text-[9px] font-semibold ${selectedProduct ? "bg-[#0A2540] text-white" : "border border-[#0A2540] text-[#0A2540] hover:bg-[#0A2540] hover:text-white"}`}
                      >
                        {selectedProduct ? "Selected · Remove" : `Add ${selectionType === "coil" ? "coil" : effectiveConfig.freeProductLabel}`}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No in-stock add-on products are available in the assigned collections.</p>
          )}

          {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => {
              if (selectionType === "coil") {
                setSelectionType("flavour");
                setError("");
              } else {
                onBack();
              }
            }} className="min-h-11 rounded-lg border border-neutral-300 px-4 text-sm font-medium text-neutral-700">Back</button>
            <button type="button" onClick={continueFromSelection} disabled={!mainAvailable || (selectionType === "coil" ? selectedCoils.length < minCoils : selectedFlavours.length < requiredFlavours)} className="min-h-11 flex-1 rounded-lg bg-[#0A2540] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300">
              {selectionType === "flavour" ? "Next: Select coils →" : "Continue to review →"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0A2540]">Your Bundle</h2>
            <div className="flex gap-3 text-sm font-semibold text-[#0A2540]">
              <button type="button" onClick={() => { setSelectionType("flavour"); setStep("products"); }} className="underline">Edit flavours</button>
              <button type="button" onClick={() => { setSelectionType("coil"); setStep("products"); }} className="underline">Edit coils</button>
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
            <ReviewRow label="Main product" title={mainProduct.title} detail={variantLabel(mainProduct.variant)} price={mainPrice} />
            {selected.map((item, index) => (
              <ReviewRow key={item.product.id} label={`Free product ${index + 1}`} title={item.product.title} detail={variantLabel(item.variant)} price={item.variant.variantPrice} />
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-[#F5F2EC] p-4 text-sm">
            <div className="flex justify-between text-neutral-500"><span>Original free products</span><span>{formatCurrency(savings)}</span></div>
            <div className="mt-2 flex justify-between text-base font-semibold text-[#0A2540]"><span>Bundle price × {quantity}</span><span>{formatCurrency(calculatedBundlePrice * quantity)}</span></div>
            <div className="mt-1 flex justify-between text-sm font-semibold text-green-700"><span>You save</span><span>{formatCurrency(savings)}</span></div>
          </div>
          {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setStep("products")} className="min-h-11 rounded-lg border border-neutral-300 px-4 text-sm font-medium text-neutral-700">← Back</button>
            <button type="button" onClick={() => onConfirm(selected)} disabled={!mainAvailable || selectedFlavours.length < requiredFlavours || (hasConfiguredCoils && selectedCoils.length !== 1)} className="min-h-11 flex-1 rounded-lg bg-[#0A2540] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300">Add Bundle to Cart</button>
          </div>
        </>
      )}
    </section>
  );
}

function ReviewRow({ label, title, detail, price }: { label: string; title: string; detail: string; price: number }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 text-sm font-medium text-[#0A2540]">{title}</p><p className="mt-1 text-xs text-neutral-500">{detail || "Selected option"}</p></div>
      <p className="text-sm text-neutral-500">{formatCurrency(price)}</p>
    </div>
  );
}
