import ProductDetail, { BundleProductOption } from "@/components/pdp/ProductDetail";
import { api } from "@/lib/api";
import sanitizeHtml from "sanitize-html";

interface ProductPageProps {
  params: { slug: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const product = (await api.getProduct(params.slug)) as Parameters<
      typeof ProductDetail
    >[0] & { reviews?: unknown[] };
    const safeDescription = sanitizeHtml(product.description, {
      allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h2", "hr"],
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "width", "height"],
      },
      allowedSchemes: ["http", "https", "mailto"],
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
      },
    });

    const bundleCollections = product.bundleConfig?.componentCollections?.length
      ? product.bundleConfig.componentCollections
      : product.bundleCollectionSlugs;
    const separateCollections = [
      ...(product.bundleConfig?.flavourCollections ?? []),
      ...(product.bundleConfig?.coilCollections ?? []),
    ];
    const requestedCollections = [...new Set([
      ...(bundleCollections ?? []),
      ...separateCollections,
    ])];
    const configuredIds = [
      ...(product.bundleConfig?.coilProductIds ?? []),
      ...(product.bundleConfig?.flavourProductIds ?? []),
      ...(product.bundleConfig?.componentProductIds ?? []),
    ];
    const configuredProductTypes = (productId: string): BundleProductOption["bundleTypes"] => {
      const types: BundleProductOption["bundleTypes"] = [];
      if (product.bundleConfig?.coilProductIds?.includes(productId)) types.push("coil");
      if (product.bundleConfig?.flavourProductIds?.includes(productId)) types.push("flavour");
      return types;
    };
    const bundleProducts = product.bundleEnabled
      ? await Promise.all([
          ...requestedCollections.map(async (collectionSlug) => {
          try {
            const result = await api.listProducts(`category=${encodeURIComponent(collectionSlug)}&pageSize=60`) as { data: BundleProductOption[] };
            const bundleTypes: BundleProductOption["bundleTypes"] = [];
            if (product.bundleConfig?.coilCollections?.includes(collectionSlug)) bundleTypes.push("coil");
            if (product.bundleConfig?.flavourCollections?.includes(collectionSlug)) bundleTypes.push("flavour");
            return result.data.map((option) => ({ ...option, bundleTypes }));
          } catch {
            return [];
          }
        }),
          ...(configuredIds.length ? [
            api.listProducts(`ids=${configuredIds.map((id) => encodeURIComponent(id)).join(",")}`)
              .then((result) => (result as { data: BundleProductOption[] }).data.map((option) => ({
                ...option,
                bundleTypes: configuredProductTypes(option.id),
              })))
              .catch(() => []),
          ] : []),
        ]).then((groups) => {
          const uniqueProducts = new Map<string, BundleProductOption>();
          for (const option of groups.flat()) {
            const allowedProductIds = [
              ...(product.bundleConfig?.componentProductIds ?? []),
              ...(product.bundleConfig?.coilProductIds ?? []),
              ...(product.bundleConfig?.flavourProductIds ?? []),
            ];
            const existing = uniqueProducts.get(option.id);
            const bundleTypes = [...new Set([...(existing?.bundleTypes ?? []), ...(option.bundleTypes ?? [])])];
            if (
              option.id !== product.id &&
              (!allowedProductIds.length || allowedProductIds.includes(option.id)) &&
              option.variants.some((variant) => variant.isActive !== false && variant.stockQuantity > 0)
            ) {
              uniqueProducts.set(option.id, { ...option, bundleTypes });
            }
          }
          return [...uniqueProducts.values()];
        })
      : [];

    return <ProductDetail {...product} description={safeDescription} reviews={(product as any).reviews ?? []} bundleProducts={bundleProducts} />;
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-serif text-2xl text-[#0A2540]">Product not found</h1>
        <p className="mt-2 text-neutral-600">
          Make sure the backend API is running and this slug exists in the database
          (seed data first — see README).
        </p>
      </main>
    );
  }
}
