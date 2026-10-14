import HeroCarousel, { HeroSlide } from "@/components/home/HeroCarousel";
import HomepageWidgets, { HomepageWidgetData, HomepageWidgetTab } from "@/components/home/HomepageWidgets";
import FeaturedCollections from "@/components/home/FeaturedCollections";
import NewArrivalsSlider from "@/components/home/NewArrivalsSlider";
import VapeKitBundlesSection from "@/components/home/VapeKitBundlesSection";
import WelcomeStoreSection, { WelcomeSection } from "@/components/home/WelcomeStoreSection";
import HomeAboutFaqSection, { AboutSection, FaqSection } from "@/components/home/HomeAboutFaqSection";
import VapingTrendsSection, { TrendsSection } from "@/components/home/VapingTrendsSection";
import { PLPProduct } from "@/components/plp/ProductGrid";
import { api } from "@/lib/api";

interface HomepageContent {
  heroSlides: HeroSlide[];
  fabricTiles?: { name: string; imageUrl: string; link: string }[];
  homeWidgets?: HomepageWidgetData[];
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

export default async function HomePage() {
  const [content, newArrivalsResult] = await Promise.allSettled([
    api.getHomepageContent() as Promise<HomepageContent>,
    api.listProducts("sortBy=newest&pageSize=10") as Promise<{ data: PLPProduct[] }>,
  ]);

  const homepage =
    content.status === "fulfilled"
      ? content.value
      : { heroSlides: [], fabricTiles: [], promoBanner: undefined, featuredCollectionTitle: "Boutique Favourites" };

  const collectionSpotlight = homepage.collectionSpotlight ?? {
    collectionSlug: "vape-kit-bundles",
    heading: "Vape Kit Bundles",
    subheading: "Everything You Need in One Pack",
    description: "Enhance your vaping setup with our Vape Kit Bundles, designed for convenience and value. Each bundle brings together a vape kit and useful essentials, so you can get started with everything in one pack.",
    ctaText: "Shop Vape Kit Bundles",
  };
  const spotlightQuery = collectionSpotlight.collectionSlug === "all"
    ? "pageSize=8&sortBy=featured"
    : `category=${encodeURIComponent(collectionSpotlight.collectionSlug)}&pageSize=8&sortBy=featured`;
  const bundleProducts = await api
    .listProducts(spotlightQuery)
    .then((result) => (result as { data: PLPProduct[] }).data)
    .catch(() => []);
  const featuredCollectionSlug = homepage.featuredCollectionSlug ?? "vaping-kits";
  const featuredProducts = await api
    .listProducts(`category=${encodeURIComponent(featuredCollectionSlug)}&pageSize=8&sortBy=featured`)
    .then((result) => (result as { data: PLPProduct[] }).data)
    .catch(() => []);
  const newArrivals = newArrivalsResult.status === "fulfilled" ? newArrivalsResult.value.data : [];
  const rawContent = content.status === "fulfilled" ? content.value : homepage;
  const widgets = rawContent.homeWidgets?.length
    ? rawContent.homeWidgets
    : rawContent.fabricTiles?.length
      ? [{
          id: "legacy-fabric-tiles",
          title: "Shop by Category",
          tabs: [
            {
              label: "Categories",
              type: "cards" as const,
              cards: rawContent.fabricTiles.map((tile) => ({
                heading: tile.name,
                imageUrl: tile.imageUrl,
                link: tile.link,
              })),
            },
            { label: "Best Seller", type: "collection" as const, collectionSlug: "all" },
            { label: "New", type: "collection" as const, collectionSlug: "all" },
          ],
        }]
      : [];

  const hydratedWidgets = await Promise.all(
    widgets.map(async (widget) => ({
      ...widget,
      tabs: await Promise.all(
        widget.tabs.map(async (tab: HomepageWidgetTab) => {
          if (tab.type !== "collection") return tab;
          try {
            const query = tab.collectionSlug && tab.collectionSlug !== "all"
              ? `category=${encodeURIComponent(tab.collectionSlug)}&pageSize=12`
              : "pageSize=12&sortBy=newest";
            const result = (await api.listProducts(query)) as { data: HomepageWidgetTab["products"] };
            return { ...tab, products: result.data ?? [] };
          } catch {
            return { ...tab, products: [] };
          }
        }),
      ),
    })),
  );

  return (
    <div>
      {homepage.promoBanner?.isActive && homepage.promoBanner.text && (
        <div className="bg-[#0A2540] py-2 text-center text-xs text-white">
          {homepage.promoBanner.text}
        </div>
      )}

      <HeroCarousel slides={homepage.heroSlides} />
      <HomepageWidgets widgets={hydratedWidgets} />
      <VapeKitBundlesSection products={bundleProducts} spotlight={collectionSpotlight} />
      <WelcomeStoreSection content={homepage.welcomeSection} />
      <HomeAboutFaqSection about={homepage.aboutSection} faq={homepage.faqSection} />
      {homepage.featuredCollectionTitle?.trim().toLowerCase() !== collectionSpotlight.heading.trim().toLowerCase() && (
        <FeaturedCollections
          title={homepage.featuredCollectionTitle ?? "Boutique Favourites"}
          products={featuredProducts}
        />
      )}
      <NewArrivalsSlider products={newArrivals} />
      <VapingTrendsSection section={homepage.trendsSection} />
    </div>
  );
}
