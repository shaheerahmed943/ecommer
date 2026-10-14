import ProductGrid, { PLPProduct } from "@/components/plp/ProductGrid";
import FilterSidebar from "@/components/plp/FilterSidebar";
import { api } from "@/lib/api";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PLPPageProps {
  params: { slug: string };
  searchParams: Record<string, string | undefined>;
}

interface CollectionContent {
  name: string;
  description: string | null;
  pageHeading: string | null;
  breadcrumbLabel: string | null;
}

const CATEGORY_TITLES: Record<string, string> = {
  all: "All Products",
  "disposable-vape-alternatives": "Prefilled Kits",
  "e-liquids": "E-Liquids",
  "vaping-kits": "Vaping Kits",
  "vape-kit-bundles": "Vape Kit Bundles",
  "pods-coils": "Pods & Coils",
  "nicotine-pouches": "Nicotine Pouches",
  accessories: "Accessories",
};

export default async function CollectionPage({ params, searchParams }: PLPPageProps) {
  if (params.slug === "new-prefilled-kits") redirect("/collections/all");

  let collection: CollectionContent | null = null;
  if (params.slug !== "all") {
    try {
      collection = await api.getCollectionContent(params.slug) as CollectionContent;
    } catch {
      collection = null;
    }
  }

  const query = new URLSearchParams();
  if (params.slug !== "all") query.set("category", params.slug);
  if (searchParams.search) query.set("search", searchParams.search);
  if (searchParams.fabric) query.set("fabric", searchParams.fabric);
  if (searchParams.type) query.set("type", searchParams.type);
  if (searchParams.size) query.set("size", searchParams.size);
  if (searchParams.sortBy) query.set("sortBy", searchParams.sortBy);

  let products: PLPProduct[] = [];
  let totalItems = 0;
  try {
    const result = (await api.listProducts(query.toString())) as { data: PLPProduct[]; totalItems?: number };
    products = result.data;
    totalItems = result.totalItems ?? products.length;
  } catch {
    products = [];
  }

  const defaultTitle = collection?.name.split(">").pop()?.trim() || CATEGORY_TITLES[params.slug] || params.slug.replaceAll("-", " ");
  const pageTitle = collection?.pageHeading || CATEGORY_TITLES[params.slug] || defaultTitle;
  const breadcrumbTitle = collection?.breadcrumbLabel || defaultTitle;

  return (
    <>
      <section className="border-b border-[#e8e2d7] bg-[#F5F2EC]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <nav aria-label="Breadcrumb" className="text-xs text-neutral-500 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="transition-colors hover:text-[#0A2540]">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/collections/all" className="transition-colors hover:text-[#0A2540]">Shop</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium text-[#0A2540]">{breadcrumbTitle}</li>
            </ol>
          </nav>

          <div className="mt-7 max-w-4xl sm:mt-9">
            <p className="mb-2 text-[11px] font-semibold uppercase text-[#66751e]">EcoSmok collection</p>
            <h1 className="font-serif text-[2.3rem] font-bold leading-tight text-[#0A2540]">{pageTitle}</h1>
            {collection?.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600 sm:text-base sm:leading-7">
                {collection.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-3">
          <p className="text-sm font-medium text-[#0A2540]">
            {totalItems} {totalItems === 1 ? "product" : "products"}
          </p>
          <p className="text-xs text-neutral-500">Curated for your next favourite</p>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="h-fit w-full shrink-0 rounded-lg border border-neutral-200 bg-white p-4 lg:w-60">
            <FilterSidebar />
          </aside>
          <div className="min-w-0 flex-1">
            <ProductGrid products={products} />
          </div>
        </div>
      </section>
    </>
  );
}
