"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import ImageUploadField from "@/components/admin/ImageUploadField";

interface HeroSlide {
  imageUrl: string;
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface FabricTile {
  name: string;
  imageUrl: string;
  link: string;
}

interface HomepageWidgetCard {
  heading: string;
  imageUrl: string;
  link: string;
}

interface HomepageWidgetTab {
  label: string;
  type: "cards" | "collection";
  collectionSlug?: string;
  cards?: HomepageWidgetCard[];
}

interface HomepageWidget {
  id: string;
  title: string;
  tabs: HomepageWidgetTab[];
}

interface WelcomeSection {
  heading: string;
  paragraphs: string[];
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
}

interface AboutSection {
  heading: string;
  paragraphs: string[];
  commitmentHeading: string;
  commitmentParagraphs: string[];
}

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

interface TrendArticle {
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

interface TrendsSection {
  title: string;
  ctaText: string;
  ctaLink: string;
  articles: TrendArticle[];
}

interface CollectionSpotlight {
  collectionSlug: string;
  heading: string;
  subheading: string;
  description: string;
  ctaText: string;
}

interface HomepageContent {
  heroSlides: HeroSlide[];
  fabricTiles: FabricTile[];
  homeWidgets?: HomepageWidget[];
  promoBanner?: { text: string; link?: string; isActive: boolean };
  featuredCollectionTitle?: string;
  featuredCollectionSlug?: string;
  collectionSpotlight?: CollectionSpotlight;
  welcomeSection?: WelcomeSection;
  aboutSection?: AboutSection;
  faqSection?: FaqSection;
  trendsSection?: TrendsSection;
}

interface CategoryOption {
  name: string;
  slug: string;
  isActive: boolean;
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

const DEFAULT_COLLECTION_SPOTLIGHT: CollectionSpotlight = {
  collectionSlug: "vape-kit-bundles",
  heading: "Vape Kit Bundles",
  subheading: "Everything You Need in One Pack",
  description: "Enhance your vaping setup with our Vape Kit Bundles, designed for convenience and value. Each bundle brings together a vape kit and useful essentials, so you can get started with everything in one pack.",
  ctaText: "Shop Vape Kit Bundles",
};

export default function AdminHomepagePage() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .adminGetHomepageContent()
      .then((data) => {
        const loaded = data as HomepageContent;
        setContent({
          ...loaded,
          heroSlides: loaded.heroSlides?.length ? loaded.heroSlides : [{ imageUrl: "", heading: "", subheading: "", ctaText: "", ctaLink: "" }],
          fabricTiles: loaded.fabricTiles?.length ? loaded.fabricTiles : [{ name: "Nic Salts", imageUrl: "", link: "/collections/nic-salts" }],
          homeWidgets: loaded.homeWidgets?.length ? loaded.homeWidgets : [{
            id: "homepage-widget-1",
            title: "Shop by Category",
            tabs: [
              {
                label: "Categories",
                type: "cards",
                cards: (loaded.fabricTiles ?? []).map((tile) => ({ heading: tile.name, imageUrl: tile.imageUrl, link: tile.link })),
              },
              { label: "Best Seller", type: "collection", collectionSlug: "all" },
              { label: "New", type: "collection", collectionSlug: "all" },
            ],
          }],
          welcomeSection: loaded.welcomeSection ?? DEFAULT_WELCOME_SECTION,
          aboutSection: loaded.aboutSection ?? DEFAULT_ABOUT_SECTION,
          faqSection: loaded.faqSection ?? DEFAULT_FAQ_SECTION,
          trendsSection: {
            ...(loaded.trendsSection ?? DEFAULT_TRENDS_SECTION),
            articles: [
              ...(loaded.trendsSection?.articles ?? []),
              ...DEFAULT_TRENDS_SECTION.articles.slice(loaded.trendsSection?.articles?.length ?? 0),
            ],
          },
          collectionSpotlight: loaded.collectionSpotlight ?? DEFAULT_COLLECTION_SPOTLIGHT,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."))
      .finally(() => setIsLoading(false));
    api.adminGetCategories()
      .then((data) => setCategories(data as CategoryOption[]))
      .catch(() => setCategories([]));
  }, []);

  function updateSlide(idx: number, field: keyof HeroSlide, value: string) {
    setContent((c) =>
      c
        ? {
            ...c,
            heroSlides: c.heroSlides.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
          }
        : c,
    );
  }

  function updateTile(idx: number, field: keyof FabricTile, value: string) {
    setContent((c) =>
      c
        ? {
            ...c,
            fabricTiles: c.fabricTiles.map((t, i) => (i === idx ? { ...t, [field]: value } : t)),
          }
        : c,
    );
  }

  function updateWidget(widgetIdx: number, field: "title", value: string) {
    setContent((c) => c ? {
      ...c,
      homeWidgets: (c.homeWidgets ?? []).map((widget, index) => index === widgetIdx ? { ...widget, [field]: value } : widget),
    } : c);
  }

  function updateWidgetTab(widgetIdx: number, tabIdx: number, field: keyof HomepageWidgetTab, value: string) {
    setContent((c) => c ? {
      ...c,
      homeWidgets: (c.homeWidgets ?? []).map((widget, index) => index !== widgetIdx ? widget : {
        ...widget,
        tabs: widget.tabs.map((tab, tabIndex) => tabIndex === tabIdx ? { ...tab, [field]: value } : tab),
      }),
    } : c);
  }

  function updateWidgetCard(widgetIdx: number, tabIdx: number, cardIdx: number, field: keyof HomepageWidgetCard, value: string) {
    setContent((c) => c ? {
      ...c,
      homeWidgets: (c.homeWidgets ?? []).map((widget, index) => index !== widgetIdx ? widget : {
        ...widget,
        tabs: widget.tabs.map((tab, tabIndex) => tabIndex !== tabIdx ? tab : {
          ...tab,
          cards: (tab.cards ?? []).map((card, index) => index === cardIdx ? { ...card, [field]: value } : card),
        }),
      }),
    } : c);
  }

  function updateWelcomeParagraph(index: number, value: string) {
    setContent((c) => c ? {
      ...c,
      welcomeSection: {
        ...(c.welcomeSection ?? DEFAULT_WELCOME_SECTION),
        paragraphs: (c.welcomeSection?.paragraphs ?? DEFAULT_WELCOME_SECTION.paragraphs).map((paragraph, i) => i === index ? value : paragraph),
      },
    } : c);
  }

  function updateAboutParagraph(type: "paragraphs" | "commitmentParagraphs", index: number, value: string) {
    setContent((c) => c ? {
      ...c,
      aboutSection: {
        ...(c.aboutSection ?? DEFAULT_ABOUT_SECTION),
        [type]: (c.aboutSection?.[type] ?? DEFAULT_ABOUT_SECTION[type]).map((paragraph, i) => i === index ? value : paragraph),
      },
    } : c);
  }

  function updateFaqItem(index: number, field: keyof FaqItem, value: string) {
    setContent((c) => c ? {
      ...c,
      faqSection: {
        ...(c.faqSection ?? DEFAULT_FAQ_SECTION),
        items: (c.faqSection?.items ?? DEFAULT_FAQ_SECTION.items).map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      },
    } : c);
  }

  function updateTrendArticle(index: number, field: keyof TrendArticle, value: string) {
    setContent((c) => c ? {
      ...c,
      trendsSection: {
        ...(c.trendsSection ?? DEFAULT_TRENDS_SECTION),
        articles: (c.trendsSection?.articles ?? DEFAULT_TRENDS_SECTION.articles).map((article, i) =>
          i === index ? { ...article, [field]: value } : article,
        ),
      },
    } : c);
  }

  function updateCollectionSpotlight(field: keyof CollectionSpotlight, value: string) {
    setContent((c) => c ? {
      ...c,
      collectionSpotlight: {
        ...(c.collectionSpotlight ?? DEFAULT_COLLECTION_SPOTLIGHT),
        [field]: value,
      },
    } : c);
  }

  async function handleSave() {
    if (!content) return;
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.adminUpdateHomepageContent(content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !content) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-serif text-2xl text-[#0A2540]">Homepage Design</h1>

      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-1 font-semibold text-[#0A2540]">Hero Banner Slider</h2>
        <p className="mb-4 text-xs text-neutral-500">Full-width slides shown at the top of the homepage.</p>
        <div className="space-y-6">
          {content.heroSlides.map((slide, idx) => (
            <div key={idx} className="rounded-lg border border-neutral-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">Slide {idx + 1}</span>
                {content.heroSlides.length > 1 && (
                  <button type="button" onClick={() => setContent((c) => c ? { ...c, heroSlides: c.heroSlides.filter((_, i) => i !== idx) } : c)} className="text-neutral-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <ImageUploadField url={slide.imageUrl} onChange={(url) => updateSlide(idx, "imageUrl", url)} />
                <input placeholder="Heading" value={slide.heading} onChange={(e) => updateSlide(idx, "heading", e.target.value)} className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
                <input placeholder="Subheading" value={slide.subheading ?? ""} onChange={(e) => updateSlide(idx, "subheading", e.target.value)} className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Button text (e.g. Shop Now)" value={slide.ctaText ?? ""} onChange={(e) => updateSlide(idx, "ctaText", e.target.value)} className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
                  <input placeholder="Button link (e.g. /collections/all)" value={slide.ctaLink ?? ""} onChange={(e) => updateSlide(idx, "ctaLink", e.target.value)} className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setContent((c) => c ? { ...c, heroSlides: [...c.heroSlides, { imageUrl: "", heading: "", subheading: "", ctaText: "", ctaLink: "" }] } : c)} className="mt-4 flex items-center gap-1 text-sm text-[#0A2540] underline">
          <Plus className="h-3.5 w-3.5" /> Add slide
        </button>
      </section>

      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-1 font-semibold text-[#0A2540]">Homepage Tab Widgets</h2>
        <p className="mb-5 text-xs text-neutral-500">Add as many widgets as needed. Each widget has custom cards, best sellers, and new/collection tabs.</p>
        <div className="space-y-8">
          {(content.homeWidgets ?? []).map((widget, widgetIdx) => (
            <div key={widget.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="mb-4 flex items-center gap-3">
                <input value={widget.title} onChange={(e) => updateWidget(widgetIdx, "title", e.target.value)} placeholder="Widget heading" className="flex-1 rounded-lg border border-neutral-300 p-2.5 text-sm font-semibold" />
                <button type="button" onClick={() => setContent((c) => c ? { ...c, homeWidgets: (c.homeWidgets ?? []).filter((_, i) => i !== widgetIdx) } : c)} className="text-neutral-400 hover:text-red-500" aria-label="Remove widget">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-5">
                {widget.tabs.slice(0, 3).map((tab, tabIdx) => (
                  <div key={tabIdx} className="rounded-lg bg-neutral-50 p-4">
                    <div className="mb-3 grid gap-3 sm:grid-cols-2">
                      <input value={tab.label} onChange={(e) => updateWidgetTab(widgetIdx, tabIdx, "label", e.target.value)} placeholder="Tab label" className="rounded-lg border border-neutral-300 p-2 text-sm" />
                      {tab.type === "collection" && (
                        <input value={tab.collectionSlug ?? "all"} onChange={(e) => updateWidgetTab(widgetIdx, tabIdx, "collectionSlug", e.target.value)} placeholder="Collection slug e.g. vaping-kits" className="rounded-lg border border-neutral-300 p-2 text-sm" />
                      )}
                    </div>
                    {tab.type === "cards" && (
                      <div className="space-y-3">
                        {(tab.cards ?? []).map((card, cardIdx) => (
                          <div key={cardIdx} className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3">
                            <div className="flex-1 space-y-2">
                              <ImageUploadField url={card.imageUrl} onChange={(url) => updateWidgetCard(widgetIdx, tabIdx, cardIdx, "imageUrl", url)} />
                              <input value={card.heading} onChange={(e) => updateWidgetCard(widgetIdx, tabIdx, cardIdx, "heading", e.target.value)} placeholder="Card heading" className="w-full rounded-lg border border-neutral-300 p-2 text-sm" />
                              <input value={card.link} onChange={(e) => updateWidgetCard(widgetIdx, tabIdx, cardIdx, "link", e.target.value)} placeholder="Card link e.g. /collections/all?search=Hayati" className="w-full rounded-lg border border-neutral-300 p-2 text-sm" />
                            </div>
                            <button type="button" onClick={() => setContent((c) => c ? { ...c, homeWidgets: (c.homeWidgets ?? []).map((item, i) => i !== widgetIdx ? item : { ...item, tabs: item.tabs.map((currentTab, j) => j !== tabIdx ? currentTab : { ...currentTab, cards: (currentTab.cards ?? []).filter((_, k) => k !== cardIdx) }) }) } : c)} className="text-neutral-400 hover:text-red-500" aria-label="Remove card">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setContent((c) => c ? { ...c, homeWidgets: (c.homeWidgets ?? []).map((item, i) => i !== widgetIdx ? item : { ...item, tabs: item.tabs.map((currentTab, j) => j !== tabIdx ? currentTab : { ...currentTab, cards: [...(currentTab.cards ?? []), { heading: "", imageUrl: "", link: "" }] }) }) } : c)} className="flex items-center gap-1 text-sm text-[#0A2540] underline">
                          <Plus className="h-3.5 w-3.5" /> Add card
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setContent((c) => c ? { ...c, homeWidgets: [...(c.homeWidgets ?? []), { id: `homepage-widget-${Date.now()}`, title: "New Widget", tabs: [{ label: "Categories", type: "cards", cards: [] }, { label: "Best Seller", type: "collection", collectionSlug: "all" }, { label: "New", type: "collection", collectionSlug: "all" }] }] } : c)} className="mt-5 flex items-center gap-1 text-sm text-[#0A2540] underline">
          <Plus className="h-3.5 w-3.5" /> Add widget
        </button>
      </section>

      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-1 font-semibold text-[#0A2540]">Collection Spotlight</h2>
        <p className="mb-4 text-xs text-neutral-500">Choose which collection and copy appear in this homepage section.</p>
        <div className="space-y-3">
          <select
            value={content.collectionSpotlight?.collectionSlug ?? DEFAULT_COLLECTION_SPOTLIGHT.collectionSlug}
            onChange={(e) => updateCollectionSpotlight("collectionSlug", e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm"
          >
            <option value="all">All Products</option>
            {categories.filter((category) => category.isActive).map((category) => (
              <option key={category.slug} value={category.slug}>{category.name.split(">").pop()?.trim() || category.name}</option>
            ))}
          </select>
          <input
            value={content.collectionSpotlight?.heading ?? ""}
            onChange={(e) => updateCollectionSpotlight("heading", e.target.value)}
            placeholder="Section heading"
            className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
          />
          <input
            value={content.collectionSpotlight?.subheading ?? ""}
            onChange={(e) => updateCollectionSpotlight("subheading", e.target.value)}
            placeholder="Subheading"
            className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
          />
          <textarea
            value={content.collectionSpotlight?.description ?? ""}
            onChange={(e) => updateCollectionSpotlight("description", e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
          />
          <input
            value={content.collectionSpotlight?.ctaText ?? ""}
            onChange={(e) => updateCollectionSpotlight("ctaText", e.target.value)}
            placeholder="Button text"
            className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm"
          />
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-[#0A2540]">Promo Banner & Section Titles</h2>
        <div className="space-y-3">
          <input placeholder="Featured collection section title" value={content.featuredCollectionTitle ?? ""} onChange={(e) => setContent((c) => (c ? { ...c, featuredCollectionTitle: e.target.value } : c))} className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          <select value={content.featuredCollectionSlug ?? "vaping-kits"} onChange={(e) => setContent((c) => (c ? { ...c, featuredCollectionSlug: e.target.value } : c))} className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm">
            <option value="">All products</option>
            {categories.filter((category) => category.isActive).map((category) => (
              <option key={category.slug} value={category.slug}>{category.name}</option>
            ))}
          </select>
          <input placeholder="Promo banner text (e.g. Free shipping above £80)"  value={content.promoBanner?.text ?? ""} onChange={(e) => setContent((c) => c ? { ...c, promoBanner: { text: e.target.value, isActive: c.promoBanner?.isActive ?? true, link: c.promoBanner?.link } } : c)} className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={content.promoBanner?.isActive ?? false} onChange={(e) => setContent((c) => c ? { ...c, promoBanner: { text: c.promoBanner?.text ?? "", isActive: e.target.checked, link: c.promoBanner?.link } } : c)} />
            Show promo banner
          </label>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-[#0A2540]">Welcome Section</h2>
        <div className="space-y-3">
          <input value={content.welcomeSection?.heading ?? ""} onChange={(e) => setContent((c) => c ? { ...c, welcomeSection: { ...(c.welcomeSection ?? DEFAULT_WELCOME_SECTION), heading: e.target.value } } : c)} placeholder="Heading" className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          {(content.welcomeSection?.paragraphs ?? DEFAULT_WELCOME_SECTION.paragraphs).map((paragraph, idx) => (
            <textarea key={idx} value={paragraph} onChange={(e) => updateWelcomeParagraph(idx, e.target.value)} rows={3} placeholder="Paragraph" className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          ))}
          <button type="button" onClick={() => setContent((c) => c ? { ...c, welcomeSection: { ...(c.welcomeSection ?? DEFAULT_WELCOME_SECTION), paragraphs: [...(c.welcomeSection?.paragraphs ?? DEFAULT_WELCOME_SECTION.paragraphs), ""] } } : c)} className="flex items-center gap-1 text-sm text-[#0A2540] underline">
            <Plus className="h-3.5 w-3.5" /> Add paragraph
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={content.welcomeSection?.ctaText ?? ""} onChange={(e) => setContent((c) => c ? { ...c, welcomeSection: { ...(c.welcomeSection ?? DEFAULT_WELCOME_SECTION), ctaText: e.target.value } } : c)} placeholder="Button text" className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
            <input value={content.welcomeSection?.ctaLink ?? ""} onChange={(e) => setContent((c) => c ? { ...c, welcomeSection: { ...(c.welcomeSection ?? DEFAULT_WELCOME_SECTION), ctaLink: e.target.value } } : c)} placeholder="Button link" className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
          </div>
          <ImageUploadField url={content.welcomeSection?.imageUrl ?? ""} onChange={(url) => setContent((c) => c ? { ...c, welcomeSection: { ...(c.welcomeSection ?? DEFAULT_WELCOME_SECTION), imageUrl: url } } : c)} />
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-[#0A2540]">About & FAQ</h2>
        <div className="space-y-5">
          <input value={content.aboutSection?.heading ?? ""} onChange={(e) => setContent((c) => c ? { ...c, aboutSection: { ...(c.aboutSection ?? DEFAULT_ABOUT_SECTION), heading: e.target.value } } : c)} placeholder="About heading" className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          {(content.aboutSection?.paragraphs ?? DEFAULT_ABOUT_SECTION.paragraphs).map((paragraph, idx) => (
            <textarea key={idx} value={paragraph} onChange={(e) => updateAboutParagraph("paragraphs", idx, e.target.value)} rows={2} placeholder="About paragraph" className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          ))}
          <input value={content.aboutSection?.commitmentHeading ?? ""} onChange={(e) => setContent((c) => c ? { ...c, aboutSection: { ...(c.aboutSection ?? DEFAULT_ABOUT_SECTION), commitmentHeading: e.target.value } } : c)} placeholder="Commitment heading" className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          {(content.aboutSection?.commitmentParagraphs ?? DEFAULT_ABOUT_SECTION.commitmentParagraphs).map((paragraph, idx) => (
            <textarea key={idx} value={paragraph} onChange={(e) => updateAboutParagraph("commitmentParagraphs", idx, e.target.value)} rows={2} placeholder="Commitment paragraph" className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          ))}
          <input value={content.faqSection?.title ?? ""} onChange={(e) => setContent((c) => c ? { ...c, faqSection: { ...(c.faqSection ?? DEFAULT_FAQ_SECTION), title: e.target.value } } : c)} placeholder="FAQ title" className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          {(content.faqSection?.items ?? DEFAULT_FAQ_SECTION.items).map((item, idx) => (
            <div key={idx} className="rounded-lg border border-neutral-200 p-3">
              <input value={item.question} onChange={(e) => updateFaqItem(idx, "question", e.target.value)} placeholder="FAQ question" className="mb-2 w-full rounded-lg border border-neutral-300 p-2 text-sm" />
              <textarea value={item.answer} onChange={(e) => updateFaqItem(idx, "answer", e.target.value)} rows={3} placeholder="FAQ answer" className="w-full rounded-lg border border-neutral-300 p-2 text-sm" />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-[#0A2540]">Vaping Trends</h2>
        <div className="space-y-4">
          <input value={content.trendsSection?.title ?? ""} onChange={(e) => setContent((c) => c ? { ...c, trendsSection: { ...(c.trendsSection ?? DEFAULT_TRENDS_SECTION), title: e.target.value } } : c)} placeholder="Trends section title" className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={content.trendsSection?.ctaText ?? ""} onChange={(e) => setContent((c) => c ? { ...c, trendsSection: { ...(c.trendsSection ?? DEFAULT_TRENDS_SECTION), ctaText: e.target.value } } : c)} placeholder="CTA text" className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
            <input value={content.trendsSection?.ctaLink ?? ""} onChange={(e) => setContent((c) => c ? { ...c, trendsSection: { ...(c.trendsSection ?? DEFAULT_TRENDS_SECTION), ctaLink: e.target.value } } : c)} placeholder="CTA link" className="rounded-lg border border-neutral-300 p-2.5 text-sm" />
          </div>
          {(content.trendsSection?.articles ?? DEFAULT_TRENDS_SECTION.articles).map((article, idx) => (
            <div key={idx} className="rounded-lg border border-neutral-200 p-3">
              <input value={article.title} onChange={(e) => updateTrendArticle(idx, "title", e.target.value)} placeholder="Article title" className="mb-2 w-full rounded-lg border border-neutral-300 p-2 text-sm" />
              <input value={article.summary} onChange={(e) => updateTrendArticle(idx, "summary", e.target.value)} placeholder="Summary" className="mb-2 w-full rounded-lg border border-neutral-300 p-2 text-sm" />
              <input value={article.href} onChange={(e) => updateTrendArticle(idx, "href", e.target.value)} placeholder="Link" className="mb-2 w-full rounded-lg border border-neutral-300 p-2 text-sm" />
              <input value={article.coverText} onChange={(e) => updateTrendArticle(idx, "coverText", e.target.value)} placeholder="Cover text" className="mb-2 w-full rounded-lg border border-neutral-300 p-2 text-sm" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={article.readTime} onChange={(e) => updateTrendArticle(idx, "readTime", e.target.value)} placeholder="Read time" className="rounded-lg border border-neutral-300 p-2 text-sm" />
                <input value={article.displayDate} onChange={(e) => updateTrendArticle(idx, "displayDate", e.target.value)} placeholder="Display date" className="rounded-lg border border-neutral-300 p-2 text-sm" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">Saved! Changes are live.</p>}

      <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 rounded-lg bg-[#0A2540] px-8 py-3.5 font-medium text-white disabled:bg-neutral-300">
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Homepage
      </button>
    </div>
  );
}
