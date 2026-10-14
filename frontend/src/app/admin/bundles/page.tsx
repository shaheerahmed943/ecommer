"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, PackageCheck, Search, X } from "lucide-react";
import { api } from "@/lib/api";

interface BundleProduct {
  id: string;
  title: string;
  slug: string;
  status: string;
  type: string;
  bundleEnabled: boolean;
  bundleCollectionSlugs: string[];
  bundleConfig?: BundleConfig | null;
  variants: { id: string; size: string; color: string; flavour: string | null; stockQuantity: number }[];
}

interface BundleConfig {
  heading: string;
  description: string;
  mainLabel: string;
  freeProductLabel: string;
  freeProductCount: number;
  bundlePrice: number | null;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  steps: string[];
  componentProductIds: string[];
  flavourCollections: string[];
  coilCollections: string[];
  coilProductIds: string[];
  flavourProductIds: string[];
  minCoils: number;
  maxCoils: number;
  minFlavours: number;
  maxFlavours: number;
}

const DEFAULT_BUNDLE_CONFIG: BundleConfig = {
  heading: "Build your bundle",
  description: "Choose your required options and free products.",
  mainLabel: "Select main product option",
  freeProductLabel: "Free product",
  freeProductCount: 2,
  bundlePrice: null,
  discountType: "PERCENTAGE",
  discountValue: 0,
  steps: ["Select main product", "Select flavours", "Select coils", "Review bundle"],
  componentProductIds: [],
  flavourCollections: [],
  coilCollections: [
    "food-beverages-tobacco-tobacco-products-vaporizers-electronic-cigarettes-replacement-coils",
    "food-beverages-tobacco-tobacco-products-vaporizers-electronic-cigarettes-vaporizer-coils-pods",
  ],
  coilProductIds: [],
  flavourProductIds: [],
  minCoils: 1,
  maxCoils: 1,
  minFlavours: 2,
  maxFlavours: 2,
};

interface Collection {
  name: string;
  slug: string;
  isActive: boolean;
}

export default function AdminBundlesPage() {
  const [products, setProducts] = useState<BundleProduct[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [bundleEnabled, setBundleEnabled] = useState(false);
  const [collectionSlugs, setCollectionSlugs] = useState<string[]>([]);
  const [flavourCollections, setFlavourCollections] = useState<string[]>([]);
  const [coilCollections, setCoilCollections] = useState<string[]>([]);
  const [config, setConfig] = useState<BundleConfig>(DEFAULT_BUNDLE_CONFIG);
  const [activeTab, setActiveTab] = useState<"basic" | "collections" | "products" | "coils" | "flavours">("basic");
  const [collectionType, setCollectionType] = useState<"flavours" | "coils">("flavours");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const eligibleProducts = products.filter((product) => product.id !== selectedProductId && product.status === "ACTIVE");
  const filteredProducts = eligibleProducts.filter((product) => {
    const query = productSearch.trim().toLowerCase();
    return !query || product.title.toLowerCase().includes(query) || product.slug.toLowerCase().includes(query);
  });

  useEffect(() => {
    Promise.all([api.adminListBundleProducts(), api.adminGetCategories()])
      .then(([productData, collectionData]) => {
        const nextProducts = productData as BundleProduct[];
        setProducts(nextProducts);
        setCollections(collectionData as Collection[]);
        if (nextProducts.length) setSelectedProductId(nextProducts[0].id);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Failed to load bundle settings."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const product = products.find((item) => item.id === selectedProductId);
    setBundleEnabled(product?.bundleEnabled ?? false);
    setCollectionSlugs(product?.bundleCollectionSlugs ?? []);
    const nextConfig = product?.bundleConfig ? { ...DEFAULT_BUNDLE_CONFIG, ...product.bundleConfig } : DEFAULT_BUNDLE_CONFIG;
    setConfig(nextConfig);
    setFlavourCollections(nextConfig.flavourCollections.length ? nextConfig.flavourCollections : product?.bundleCollectionSlugs ?? []);
    setCoilCollections(nextConfig.coilCollections.length ? nextConfig.coilCollections : DEFAULT_BUNDLE_CONFIG.coilCollections);
  }, [products, selectedProductId]);

  function toggleCollection(slug: string) {
    setCollectionSlugs((current) => current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug]);
  }

  async function saveSettings() {
    if (!selectedProduct) return;
    const combinedCollections = [...new Set([...flavourCollections, ...coilCollections])];
    if (bundleEnabled && combinedCollections.length === 0) {
      setError("Choose at least one collection for the free add-ons.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const saved = await api.adminUpdateProductBundle(selectedProduct.id, {
        bundleEnabled,
        collectionSlugs: combinedCollections,
        config: { ...config, flavourCollections, coilCollections },
      }) as {
        id: string;
        bundleEnabled: boolean;
        bundleCollectionSlugs: string[];
        bundleConfig: BundleConfig;
      };
      setProducts((current) => current.map((product) => product.id === saved.id
        ? { ...product, bundleEnabled: saved.bundleEnabled, bundleCollectionSlugs: saved.bundleCollectionSlugs, bundleConfig: saved.bundleConfig }
        : product));
      setSuccess(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save bundle settings.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-neutral-500">Loading bundle settings...</p>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#0A2540]">Product Bundles</h1>
        <p className="mt-1 text-sm text-neutral-500">Configure every bundle label, price, step and eligible component collection without changing code.</p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6">
        <label className="block text-sm font-medium text-neutral-700">
          Main product
          <select
            value={selectedProductId}
            onChange={(event) => {
              setSelectedProductId(event.target.value);
              setError(null);
              setSuccess(false);
            }}
            className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white p-2.5"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.title}</option>
            ))}
          </select>
        </label>

        {!selectedProduct && <p className="mt-4 text-sm text-neutral-500">Create a product first, then configure its bundle here.</p>}

        {selectedProduct && (
          <>
            <div className="mt-4 flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
              <div>
                <p className="font-medium text-[#0A2540]">{selectedProduct.title}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {selectedProduct.variants.length} variants · {selectedProduct.variants.filter((variant) => variant.stockQuantity > 0).length} in stock · {selectedProduct.status}
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#0A2540]">
                <input
                  type="checkbox"
                  checked={bundleEnabled}
                  onChange={(event) => setBundleEnabled(event.target.checked)}
                  className="h-4 w-4 accent-[#0A2540]"
                />
                Bundle on
              </label>
            </div>

            {selectedProduct.status !== "ACTIVE" || !selectedProduct.variants.some((variant) => variant.stockQuantity > 0) ? (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">
                This main product cannot start a bundle on the storefront until it is active and has at least one in-stock variant. Update its status or stock in Products.
              </p>
            ) : null}

            {bundleEnabled && (
              <div className="pt-4">
                <div className="mb-5 flex flex-col gap-3 border-b border-neutral-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2 overflow-x-auto">
                    {([
                      ["basic", "Basic & pricing"],
                      ["collections", "Collections"],
                      ["products", "Specific products"],
                      ["coils", `Coil products${config.coilProductIds.length ? ` (${config.coilProductIds.length})` : ""}`],
                      ["flavours", "Flavours"],
                    ] as const).map(([tab, label]) => (
                      <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold ${activeTab === tab ? "bg-[#0A2540] text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {(activeTab === "products" || activeTab === "coils" || activeTab === "flavours") && (
                    <label className="relative block shrink-0 sm:w-64">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <span className="sr-only">Search bundle products</span>
                      <input
                        type="search"
                        value={productSearch}
                        onChange={(event) => setProductSearch(event.target.value)}
                        placeholder="Search products..."
                        className="w-full rounded-md border border-neutral-300 py-2 pl-9 pr-9 text-sm outline-none focus:border-[#0A2540] focus:ring-1 focus:ring-[#0A2540]"
                      />
                      {productSearch && (
                        <button
                          type="button"
                          onClick={() => setProductSearch("")}
                          aria-label="Clear product search"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </label>
                  )}
                </div>
                <div className={activeTab === "basic" ? "" : "hidden"}>
                <h2 className="text-sm font-semibold text-[#0A2540]">Bundle content and pricing</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {([
                    ["heading", "Bundle heading"],
                    ["mainLabel", "Main product label"],
                    ["freeProductLabel", "Free product label"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="text-sm font-medium text-neutral-700">
                      {label}
                      <input value={config[key]} onChange={(event) => setConfig((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full rounded-md border border-neutral-300 p-2.5" />
                    </label>
                  ))}
                  <label className="text-sm font-medium text-neutral-700 sm:col-span-2">
                    Bundle description
                    <textarea value={config.description} onChange={(event) => setConfig((current) => ({ ...current, description: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-300 p-2.5" />
                  </label>
                  <label className="text-sm font-medium text-neutral-700">
                    Minimum coils
                    <input type="number" min={0} max={10} value={config.minCoils} onChange={(event) => setConfig((current) => ({ ...current, minCoils: Number(event.target.value), freeProductCount: Number(event.target.value) + current.minFlavours }))} className="mt-1 w-full rounded-md border border-neutral-300 p-2.5" />
                  </label>
                  <label className="text-sm font-medium text-neutral-700">
                    Maximum coils
                    <input type="number" min={0} max={10} value={config.maxCoils} onChange={(event) => setConfig((current) => ({ ...current, maxCoils: Number(event.target.value) }))} className="mt-1 w-full rounded-md border border-neutral-300 p-2.5" />
                  </label>
                  <label className="text-sm font-medium text-neutral-700">
                    Minimum flavours
                    <input type="number" min={2} max={10} value={config.minFlavours} onChange={(event) => setConfig((current) => ({ ...current, minFlavours: Number(event.target.value), freeProductCount: Number(event.target.value) }))} className="mt-1 w-full rounded-md border border-neutral-300 p-2.5" />
                  </label>
                  <label className="text-sm font-medium text-neutral-700">
                    Maximum flavours
                    <input type="number" min={2} max={10} value={config.maxFlavours} onChange={(event) => setConfig((current) => ({ ...current, maxFlavours: Number(event.target.value) }))} className="mt-1 w-full rounded-md border border-neutral-300 p-2.5" />
                  </label>
                  <label className="text-sm font-medium text-neutral-700">
                    Fixed bundle price (optional)
                    <input type="number" min={0} value={config.bundlePrice ?? ""} onChange={(event) => setConfig((current) => ({ ...current, bundlePrice: event.target.value === "" ? null : Number(event.target.value) }))} className="mt-1 w-full rounded-md border border-neutral-300 p-2.5" placeholder="Leave blank to use discount" />
                  </label>
                  <label className="text-sm font-medium text-neutral-700">
                    Discount type
                    <select value={config.discountType} onChange={(event) => setConfig((current) => ({ ...current, discountType: event.target.value as BundleConfig["discountType"] }))} className="mt-1 w-full rounded-md border border-neutral-300 bg-white p-2.5">
                      <option value="PERCENTAGE">Percentage</option><option value="FLAT">Flat amount</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-neutral-700">
                    Discount value
                    <input type="number" min={0} value={config.discountValue} onChange={(event) => setConfig((current) => ({ ...current, discountValue: Number(event.target.value) }))} className="mt-1 w-full rounded-md border border-neutral-300 p-2.5" />
                  </label>
                  <label className="text-sm font-medium text-neutral-700 sm:col-span-2">
                    Step labels (one per line)
                    <textarea value={config.steps.join("\n")} onChange={(event) => setConfig((current) => ({ ...current, steps: event.target.value.split("\n") }))} rows={3} className="mt-1 w-full rounded-md border border-neutral-300 p-2.5" />
                  </label>
                </div>
                </div>
                <div className={activeTab === "collections" ? "" : "hidden"}>
                <div className="mb-4 flex gap-2 rounded-md bg-neutral-100 p-1">
                  <button
                    type="button"
                    onClick={() => setCollectionType("flavours")}
                    className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${collectionType === "flavours" ? "bg-[#0A2540] text-white" : "text-neutral-600 hover:bg-neutral-200"}`}
                  >
                    Flavours
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectionType("coils")}
                    className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${collectionType === "coils" ? "bg-[#0A2540] text-white" : "text-neutral-600 hover:bg-neutral-200"}`}
                  >
                    Coils
                  </button>
                </div>
                <h2 className="text-sm font-semibold text-[#0A2540]">
                  {collectionType === "flavours" ? "Flavour collections" : "Coil collections"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  {collectionType === "flavours"
                    ? "Choose the collections shown in the flavours step."
                    : "Choose the collections shown in the coils step."}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {collections.filter((collection) => collection.isActive).map((collection) => (
                    <label key={collection.slug} className="flex min-w-0 items-start gap-2 rounded-md border border-neutral-200 p-3 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={(collectionType === "flavours" ? flavourCollections : coilCollections).includes(collection.slug)}
                        onChange={() => {
                          const setter = collectionType === "flavours" ? setFlavourCollections : setCoilCollections;
                          setter((current) => current.includes(collection.slug)
                            ? current.filter((item) => item !== collection.slug)
                            : [...current, collection.slug]);
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0A2540]"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">{collection.name.split(">").pop()?.trim() || collection.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500">/{collection.slug}</span>
                      </span>
                    </label>
                  ))}
                </div>
                </div>
                {!collections.some((collection) => collection.isActive) && <p className="mt-3 text-sm text-amber-700">Create an active collection before enabling add-ons.</p>}
                <div className={activeTab === "products" ? "" : "hidden"}>
                <h2 className="mt-6 text-sm font-semibold text-[#0A2540]">Specific allowed products (optional)</h2>
                <p className="mt-1 text-xs leading-5 text-neutral-500">Leave empty to allow products from the selected collections. If you select products, only these products can be used.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {filteredProducts.map((product) => (
                    <label key={product.id} className="flex items-start gap-2 rounded-md border border-neutral-200 p-3 text-sm text-neutral-700">
                      <input type="checkbox" checked={config.componentProductIds.includes(product.id)} onChange={() => setConfig((current) => ({ ...current, componentProductIds: current.componentProductIds.includes(product.id) ? current.componentProductIds.filter((id) => id !== product.id) : [...current.componentProductIds, product.id] }))} className="mt-0.5 h-4 w-4 accent-[#0A2540]" />
                      <span><span className="block font-medium">{product.title}</span><span className="text-xs text-neutral-500">{product.variants.length} variants</span></span>
                    </label>
                  ))}
                  {filteredProducts.length === 0 && <p className="text-sm text-neutral-500">No products match your search.</p>}
                </div>
                </div>
                <div className={activeTab === "coils" ? "" : "hidden"}>
                <h2 className="mt-6 text-sm font-semibold text-[#0A2540]">Add coil products</h2>
                <p className="mt-1 text-xs leading-5 text-neutral-500">Tick the coil products that customers can choose in the coil step. You can select multiple products. Leave empty only if the main product variant itself is the coil option.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {filteredProducts.map((product) => (
                    <label key={`coil-${product.id}`} className="flex items-start gap-2 rounded-md border border-neutral-200 p-3 text-sm text-neutral-700">
                      <input type="checkbox" checked={config.coilProductIds.includes(product.id)} onChange={() => setConfig((current) => ({ ...current, coilProductIds: current.coilProductIds.includes(product.id) ? current.coilProductIds.filter((id) => id !== product.id) : [...current.coilProductIds, product.id] }))} className="mt-0.5 h-4 w-4 accent-[#0A2540]" />
                      <span className="min-w-0"><span className="block font-medium">{product.title}</span><span className="text-xs text-neutral-500">{product.variants.length} variants · {product.variants.filter((variant) => variant.stockQuantity > 0).length} in stock</span></span>
                    </label>
                  ))}
                  {filteredProducts.length === 0 && <p className="text-sm text-neutral-500">No products match your search.</p>}
                </div>
                <p className="mt-3 text-xs font-medium text-[#0A2540]">
                  {config.coilProductIds.length} coil product{config.coilProductIds.length === 1 ? "" : "s"} selected
                </p>
                </div>
                <div className={activeTab === "flavours" ? "" : "hidden"}>
                <h2 className="mt-6 text-sm font-semibold text-[#0A2540]">Flavour products</h2>
                <p className="mt-1 text-xs leading-5 text-neutral-500">Select the products available in the flavour step. If none are selected, the collection/product rules above are used.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {filteredProducts.map((product) => (
                    <label key={`flavour-${product.id}`} className="flex items-start gap-2 rounded-md border border-neutral-200 p-3 text-sm text-neutral-700">
                      <input type="checkbox" checked={config.flavourProductIds.includes(product.id)} onChange={() => setConfig((current) => ({ ...current, flavourProductIds: current.flavourProductIds.includes(product.id) ? current.flavourProductIds.filter((id) => id !== product.id) : [...current.flavourProductIds, product.id] }))} className="mt-0.5 h-4 w-4 accent-[#0A2540]" />
                      <span>{product.title}</span>
                    </label>
                  ))}
                  {filteredProducts.length === 0 && <p className="text-sm text-neutral-500">No products match your search.</p>}
                </div>
                </div>
              </div>
            )}
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 flex items-center gap-1.5 text-sm text-green-700"><Check className="h-4 w-4" /> Bundle settings saved.</p>}
        <button
          type="button"
          onClick={saveSettings}
          disabled={!selectedProduct || isSaving}
          className="mt-5 flex items-center gap-2 rounded-lg bg-[#0A2540] px-5 py-2.5 text-sm font-medium text-white disabled:bg-neutral-400"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
          Save bundle settings
        </button>
      </section>
    </div>
  );
}