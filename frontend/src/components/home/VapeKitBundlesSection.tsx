import Image from "next/image";
import Link from "next/link";
import type { PLPProduct } from "@/components/plp/ProductGrid";
import { formatCurrency } from "@/lib/currency";

export interface CollectionSpotlight {
  collectionSlug: string;
  heading: string;
  subheading: string;
  description: string;
  ctaText: string;
}

const DEFAULT_SPOTLIGHT: CollectionSpotlight = {
  collectionSlug: "vape-kit-bundles",
  heading: "Vape Kit Bundles",
  subheading: "Everything You Need in One Pack",
  description: "Enhance your vaping setup with our Vape Kit Bundles, designed for convenience and value. Each bundle brings together a vape kit and useful essentials, so you can get started with everything in one pack.",
  ctaText: "Shop Vape Kit Bundles",
};

export default function VapeKitBundlesSection({ products, spotlight = DEFAULT_SPOTLIGHT }: { products: PLPProduct[]; spotlight?: CollectionSpotlight }) {
  const collectionHref = spotlight.collectionSlug === "all"
    ? "/collections/all"
    : `/collections/${encodeURIComponent(spotlight.collectionSlug)}`;

  return (
    <section className="bg-white px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <h2 className="text-[1.325rem] font-bold text-[#111]">{spotlight.heading}</h2>
          {spotlight.subheading && <p className="mt-1 text-[1.325rem] font-bold text-[#111]">{spotlight.subheading}</p>}
          {spotlight.description && <p className="mt-5 text-sm leading-6 text-neutral-600">
            {spotlight.description}
          </p>
          }
        </header>

        {products.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-md border border-neutral-200 bg-white p-3"
              >
                <Link href={`/products/${product.slug}`} className="group block">
                  <div className="relative aspect-square">
                    <Image
                      src={product.images[0]?.url ?? "/placeholder-product.jpg"}
                      alt={product.images[0]?.altText ?? product.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                      className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 min-h-10 line-clamp-2 text-center text-xs font-medium text-[#111]">
                    {product.title}
                  </p>
                </Link>
                <p className="mt-2 text-center text-sm font-semibold text-red-600">
                  {formatCurrency(product.basePrice)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center">
            <Link
              href={collectionHref}
              className="site-action inline-flex px-5 py-2"
            >
              {spotlight.ctaText}
            </Link>
          </div>
        )}
        {products.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href={collectionHref}
              className="site-action inline-flex px-5 py-2"
            >
              {spotlight.ctaText}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}