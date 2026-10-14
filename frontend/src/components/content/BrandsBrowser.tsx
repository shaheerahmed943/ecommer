"use client";

import { useMemo, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import Link from "next/link";

interface BrandProduct {
  id: string;
  title?: string;
  brand?: string | null;
  productKind?: string | null;
  deviceType?: string | null;
  nicotineStrength?: string | null;
}

export interface BrandPageItem {
  name: string;
  logoUrl?: string;
  linkUrl?: string;
  filters?: string[];
  sortOrder?: number;
}

const FILTERS = ["All Brands", "E-Liquid", "Nic Salt", "Disposables", "Vape Kits"] as const;

function matchesFilter(product: BrandProduct, filter: (typeof FILTERS)[number]) {
  if (filter === "All Brands") return true;
  const value = `${product.productKind ?? ""} ${product.deviceType ?? ""} ${product.nicotineStrength ?? ""}`.toLowerCase().replace(/[_-]/g, " ");
  if (filter === "Nic Salt") return value.includes("nic") || value.includes("salt");
  if (filter === "Disposables") return value.includes("disposable") || value.includes("prefilled");
  if (filter === "Vape Kits") return value.includes("kit") || value.includes("mod") || value.includes("pod");
  return value.includes("e-liquid") || value.includes("liquid") || value.includes("shortfill");
}

export default function BrandsBrowser({ products, configuredBrands = [], title = "Vape Brands", intro = "See our extensive collection of vaping products from the industry's most trusted manufacturers." }: { products: BrandProduct[]; configuredBrands?: BrandPageItem[]; title?: string; intro?: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All Brands");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    products.filter((product) => matchesFilter(product, filter)).forEach((product) => {
      const brand = product.brand?.trim();
      if (brand) counts.set(brand, (counts.get(brand) ?? 0) + 1);
    });
    const configured = configuredBrands
      .filter((brand) => !filter || filter === "All Brands" || brand.filters?.includes(filter))
      .map((brand) => {
        const titleMatches = products.filter((product) => product.title?.toLowerCase().includes(brand.name.toLowerCase())).length;
        return [brand.name, counts.get(brand.name) ?? titleMatches, brand] as const;
      });
    if (configured.length) return configured.sort((a, b) => (a[2].sortOrder ?? 0) - (b[2].sortOrder ?? 0) || a[0].localeCompare(b[0]));
    return [...counts.entries()].map(([name, count]) => [name, count, undefined] as const).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filter, products, configuredBrands]);

  const visibleBrands = selectedBrand ? brands.filter(([brand]) => brand === selectedBrand) : brands;

  return (
    <main>
      <PageHero title={title} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-[#111] sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-[#334155]">{intro}</p>
      </header>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => { setFilter(item); setSelectedBrand(null); }}
            className={`rounded-full border px-5 py-2.5 text-xs font-medium transition-colors ${
              filter === item ? "border-blue-700 bg-blue-700 text-white" : "border-neutral-200 bg-white text-[#111] hover:border-blue-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {selectedBrand && (
        <button type="button" onClick={() => setSelectedBrand(null)} className="mx-auto mt-6 block text-sm text-blue-700 hover:underline">
          Show all brands
        </button>
      )}

      <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {visibleBrands.map(([brand, count, config]) => (
          <Link
            key={brand}
            href={config?.linkUrl || `/collections/all?search=${encodeURIComponent(brand)}`}
            onClick={() => setSelectedBrand(brand)}
            className="flex min-h-20 flex-col justify-center rounded-xl border border-neutral-200 bg-white px-4 py-4 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3 text-left">
              {config?.logoUrl ? <img src={config.logoUrl} alt="" className="h-8 w-12 shrink-0 object-contain" /> : null}
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#0A2540]">{brand}</span>
                <span className="mt-1 block text-xs text-neutral-500">{count} {count === 1 ? "product" : "products"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {visibleBrands.length === 0 && <p className="mt-12 text-center text-sm text-neutral-500">No brands found in this category.</p>}
      </div>
    </main>
  );
}
