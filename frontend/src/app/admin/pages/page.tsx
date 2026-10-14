"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { api } from "@/lib/api";

const PAGE_ENTRIES = [
  { slug: "customer-support", label: "Customer Support", kind: "custom" },
  { slug: "guides", label: "Guides", kind: "dynamic" },
  { slug: "vaping-faqs", label: "Vaping FAQs", kind: "dynamic" },
  { slug: "vaping-knowledge", label: "Vaping Knowledge", kind: "dynamic" },
  { slug: "black-friday", label: "Black Friday", kind: "dynamic" },
  { slug: "brands", label: "Brands", kind: "dynamic" },
  { slug: "eco-smok-wholesale", label: "EcoSmok Wholesale", kind: "dynamic" },
  { slug: "sitemap", label: "Sitemap", kind: "dynamic" },
  { slug: "about", label: "About Us", kind: "existing", editor: "/admin/about" },
  { slug: "contact", label: "Contact Us", kind: "existing", editor: "/admin/contact" },
  { slug: "age-verification", label: "Age Verification", kind: "dynamic" },
  { slug: "terms", label: "Terms And Condition", kind: "existing", editor: "/admin/terms" },
  { slug: "privacy", label: "Privacy Policy", kind: "existing", editor: "/admin/privacy" },
  { slug: "returns", label: "Returns & Exchanges", kind: "existing", editor: "/admin/returns" },
  { slug: "size-guide", label: "Size Guide", kind: "existing", editor: "/admin/size-guide" },
  { slug: "blogs/news", label: "Blogs", kind: "existing", editor: "/admin/blogs/news" },
  { slug: "faq", label: "FAQ", kind: "existing", editor: "/admin/homepage" },
  { slug: "account", label: "Rewards Club", kind: "existing", editor: "/admin/rewards" },
  { slug: "track-order", label: "Track Order", kind: "existing", editor: "/admin/orders" },
  { slug: "collections", label: "Shop Collections", kind: "existing", editor: "/admin/collections" },
];

interface SupportPageContent {
  slug: string;
  title: string;
  intro: string;
  email: string;
  emailText: string;
  phone: string;
  phoneText: string;
  sections: { heading: string; body: string }[];
  categories: { label: string; anchor: string; faqs?: { question: string; answer: string }[] }[];
  groups: { id: string; title: string; description: string; faqs: { question: string; answer: string }[] }[];
  brands?: { name: string; logoUrl?: string; linkUrl?: string; filters?: string[]; sortOrder?: number }[];
  sitemapGroups?: { title: string; links: { label: string; href: string }[] }[];
}

type PageContent = SupportPageContent;

export default function AdminPagesPage() {
  const [slug, setSlug] = useState(PAGE_ENTRIES[0].slug);
  const [page, setPage] = useState<PageContent | null>(null);
  const [message, setMessage] = useState("");
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState<number | null>(null);

  useEffect(() => {
    const entry = PAGE_ENTRIES.find((item) => item.slug === slug);
    setMessage("");
    setPage(null);
    if (entry?.kind === "dynamic" || entry?.kind === "custom") {
      api.adminGetGenericPageContent(slug).then((data) => setPage(data as PageContent))
        .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load page."));
    }
  }, [slug]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!page) return;
    try {
      await api.adminUpdateGenericPageContent(slug, page);
      setMessage("Page saved and live.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save page."); }
  }

  async function uploadBrandLogo(file: File, brandIndex: number) {
    setUploadingBrandLogo(brandIndex);
    try {
      const uploaded = await api.adminUploadImage(file);
      setPage((current) => current ? {
        ...current,
        brands: (current.brands ?? []).map((brand, index) =>
          index === brandIndex ? { ...brand, logoUrl: uploaded.url } : brand,
        ),
      } : current);
      setMessage("Brand logo uploaded. Save the page to publish it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload brand logo.");
    } finally {
      setUploadingBrandLogo(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header><h1 className="font-serif text-3xl text-[#0A2540]">Website Pages</h1><p className="mt-2 text-sm text-neutral-500">All footer pages are listed here. Existing pages open their dedicated editor; new CMS pages can be edited below.</p></header>
      <select value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white p-3">
        {PAGE_ENTRIES.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.label}</option>)}
      </select>
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4">
        <div>
          <p className="text-sm font-medium text-[#0A2540]">
            {PAGE_ENTRIES.find((entry) => entry.slug === slug)?.label}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Open the page visitors see on the storefront.</p>
        </div>
        <Link
          href={
            slug === "vaping-faqs"
              ? "/faq"
              : slug === "blogs/news"
                ? "/blogs/news"
                : `/pages/${slug}`
          }
          target="_blank"
          className="rounded-lg border border-[#0A2540] px-3 py-2 text-sm font-medium text-[#0A2540] hover:bg-[#0A2540] hover:text-white"
        >
          View live page
        </Link>
      </div>
      {PAGE_ENTRIES.find((entry) => entry.slug === slug)?.kind === "existing" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="font-serif text-xl text-[#0A2540]">{PAGE_ENTRIES.find((entry) => entry.slug === slug)?.label}</h2>
          <p className="mt-2 text-sm text-neutral-600">This page already exists and has its own editor.</p>
          <Link
            href={PAGE_ENTRIES.find((entry) => entry.slug === slug)?.editor || "/admin"}
            className="mt-4 inline-flex rounded-lg bg-[#0A2540] px-4 py-3 text-sm font-medium text-white"
          >
            Open dedicated editor
          </Link>
        </div>
      )}
      {page && <form onSubmit={save} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <input value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Page title" />
        <textarea value={page.intro} onChange={(e) => setPage({ ...page, intro: e.target.value })} className="w-full rounded-lg border border-neutral-300 p-3" rows={3} placeholder="Intro" />
        {slug === "customer-support" && <>
          <input value={page.email} onChange={(e) => setPage({ ...page, email: e.target.value })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Support email" />
          <input value={page.emailText} onChange={(e) => setPage({ ...page, emailText: e.target.value })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Email card text" />
          <input value={page.phone} onChange={(e) => setPage({ ...page, phone: e.target.value })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Support phone" />
          <input value={page.phoneText} onChange={(e) => setPage({ ...page, phoneText: e.target.value })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Phone card text" />
          <div className="space-y-2 rounded-lg border border-neutral-200 p-4">
            <p className="text-sm font-medium text-[#0A2540]">Category buttons</p>
            {page.categories.map((category, categoryIndex) => <div key={category.anchor} className="grid gap-2 sm:grid-cols-2">
              <input value={category.label} onChange={(e) => setPage({ ...page, categories: page.categories.map((item, i) => i === categoryIndex ? { ...item, label: e.target.value } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Category label" />
              <input value={category.anchor} onChange={(e) => setPage({ ...page, categories: page.categories.map((item, i) => i === categoryIndex ? { ...item, anchor: e.target.value } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Section anchor" />
            </div>)}
          </div>
          {page.groups.map((group, groupIndex) => <div key={group.id} className="space-y-3 rounded-lg border border-neutral-200 p-4">
            <input value={group.title} onChange={(e) => setPage({ ...page, groups: page.groups.map((item, i) => i === groupIndex ? { ...item, title: e.target.value } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="FAQ group title" />
            <textarea value={group.description} onChange={(e) => setPage({ ...page, groups: page.groups.map((item, i) => i === groupIndex ? { ...item, description: e.target.value } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" rows={3} placeholder="FAQ group description" />
            {group.faqs.map((faq, faqIndex) => <div key={`${group.id}-${faqIndex}`} className="grid gap-2 rounded-lg bg-neutral-50 p-3">
              <input value={faq.question} onChange={(e) => setPage({ ...page, groups: page.groups.map((item, i) => i === groupIndex ? { ...item, faqs: item.faqs.map((entry, j) => j === faqIndex ? { ...entry, question: e.target.value } : entry) } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Question" />
              <textarea value={faq.answer} onChange={(e) => setPage({ ...page, groups: page.groups.map((item, i) => i === groupIndex ? { ...item, faqs: item.faqs.map((entry, j) => j === faqIndex ? { ...entry, answer: e.target.value } : entry) } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" rows={3} placeholder="Answer" />
            </div>)}
          </div>)}
        </>}
        {slug === "vaping-faqs" && <div className="space-y-4 rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[#0A2540]">FAQ categories and questions</p>
            <button type="button" onClick={() => setPage({ ...page, categories: [...(page.categories ?? []), { label: "New category", anchor: "new-category", faqs: [{ question: "New question", answer: "New answer" }] }] })} className="rounded-lg border border-[#0A2540] px-3 py-2 text-xs font-medium text-[#0A2540]">Add category</button>
          </div>
          {(page.categories ?? []).map((category, categoryIndex) => <details key={`${category.label}-${categoryIndex}`} className="rounded-lg bg-neutral-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-[#0A2540]">
              {category.label || "Untitled category"} <span className="ml-1 text-xs font-normal text-neutral-500">({category.faqs?.length ?? 0} questions)</span>
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={category.label} onChange={(e) => setPage({ ...page, categories: (page.categories ?? []).map((item, i) => i === categoryIndex ? { ...item, label: e.target.value } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Category label" />
                <input value={category.anchor} onChange={(e) => setPage({ ...page, categories: (page.categories ?? []).map((item, i) => i === categoryIndex ? { ...item, anchor: e.target.value } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="FAQ anchor" />
              </div>
            {(category.faqs ?? []).map((faq, faqIndex) => <div key={`${categoryIndex}-${faqIndex}`} className="grid gap-2 border-l-2 border-[#00a651] pl-3">
              <input value={faq.question} onChange={(e) => setPage({ ...page, categories: (page.categories ?? []).map((item, i) => i === categoryIndex ? { ...item, faqs: (item.faqs ?? []).map((entry, j) => j === faqIndex ? { ...entry, question: e.target.value } : entry) } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Question" />
              <textarea value={faq.answer} onChange={(e) => setPage({ ...page, categories: (page.categories ?? []).map((item, i) => i === categoryIndex ? { ...item, faqs: (item.faqs ?? []).map((entry, j) => j === faqIndex ? { ...entry, answer: e.target.value } : entry) } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" rows={3} placeholder="Answer" />
              <button type="button" onClick={() => setPage({ ...page, categories: (page.categories ?? []).map((item, i) => i === categoryIndex ? { ...item, faqs: (item.faqs ?? []).filter((_, j) => j !== faqIndex) } : item) })} className="justify-self-start text-xs text-red-600">Remove question</button>
            </div>)}
              <div className="flex gap-3">
              <button type="button" onClick={() => setPage({ ...page, categories: (page.categories ?? []).map((item, i) => i === categoryIndex ? { ...item, faqs: [...(item.faqs ?? []), { question: "New question", answer: "New answer" }] } : item) })} className="text-xs font-medium text-[#0070c9]">Add question</button>
              <button type="button" onClick={() => setPage({ ...page, categories: (page.categories ?? []).filter((_, i) => i !== categoryIndex) })} className="text-xs text-red-600">Remove category</button>
              </div>
            </div>
          </details>)}
        </div>}
        {slug === "brands" && <div className="space-y-4 rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[#0A2540]">Brand cards</p>
            <button type="button" onClick={() => setPage({ ...page, brands: [...(page.brands ?? []), { name: "New Brand", filters: ["All Brands"], sortOrder: (page.brands?.length ?? 0) + 1 }] })} className="rounded-lg border border-[#0A2540] px-3 py-2 text-xs font-medium text-[#0A2540]">Add brand</button>
          </div>
          {(page.brands ?? []).map((brand, brandIndex) => <div key={`${brand.name}-${brandIndex}`} className="grid gap-2 rounded-lg bg-neutral-50 p-3 sm:grid-cols-2">
            <input value={brand.name} onChange={(e) => setPage({ ...page, brands: (page.brands ?? []).map((item, i) => i === brandIndex ? { ...item, name: e.target.value } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Brand name" />
            <input value={brand.logoUrl ?? ""} onChange={(e) => setPage({ ...page, brands: (page.brands ?? []).map((item, i) => i === brandIndex ? { ...item, logoUrl: e.target.value } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Logo URL (optional)" />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white p-3 text-xs text-[#0A2540]">
              <span>{uploadingBrandLogo === brandIndex ? "Uploading..." : "Upload logo image"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                disabled={uploadingBrandLogo !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadBrandLogo(file, brandIndex);
                  e.target.value = "";
                }}
                className="sr-only"
              />
            </label>
            {brand.logoUrl && <img src={brand.logoUrl} alt={`${brand.name} logo preview`} className="h-10 max-w-32 rounded border border-neutral-200 bg-white object-contain p-1" />}
            {brand.logoUrl && <button type="button" onClick={() => setPage({ ...page, brands: (page.brands ?? []).map((item, i) => i === brandIndex ? { ...item, logoUrl: "" } : item) })} className="justify-self-start text-xs text-red-600">Remove logo</button>}
            <input value={brand.linkUrl ?? ""} onChange={(e) => setPage({ ...page, brands: (page.brands ?? []).map((item, i) => i === brandIndex ? { ...item, linkUrl: e.target.value } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Brand link (e.g. /collections/all?search=Voopoo)" />
            <input value={(brand.filters ?? []).join(", ")} onChange={(e) => setPage({ ...page, brands: (page.brands ?? []).map((item, i) => i === brandIndex ? { ...item, filters: e.target.value.split(",").map((value) => value.trim()).filter(Boolean) } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Filters: All Brands, E-Liquid, Nic Salt" />
            <input type="number" value={brand.sortOrder ?? brandIndex + 1} onChange={(e) => setPage({ ...page, brands: (page.brands ?? []).map((item, i) => i === brandIndex ? { ...item, sortOrder: Number(e.target.value) } : item) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Display order" />
            <button type="button" onClick={() => setPage({ ...page, brands: (page.brands ?? []).filter((_, i) => i !== brandIndex) })} className="justify-self-start text-xs text-red-600">Remove brand</button>
          </div>)}
          <p className="text-xs text-neutral-500">Leave this list empty to automatically show brands found in your products.</p>
        </div>}
        {slug !== "customer-support" && <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#0A2540]">Guide points</p>
            <button
              type="button"
              onClick={() => setPage({ ...page, sections: [...page.sections, { heading: "", body: "" }] })}
              className="rounded-lg border border-[#0A2540] px-3 py-2 text-sm font-medium text-[#0A2540] hover:bg-[#0A2540] hover:text-white"
            >
              + Add point
            </button>
          </div>
          {page.sections.map((section, index) => <div key={index} className="space-y-2 rounded-lg border border-neutral-200 p-4">
            <input value={section.heading} onChange={(e) => setPage({ ...page, sections: page.sections.map((s, i) => i === index ? { ...s, heading: e.target.value } : s) })} className="w-full rounded-lg border border-neutral-300 p-3" placeholder="Point heading" />
            <textarea value={section.body} onChange={(e) => setPage({ ...page, sections: page.sections.map((s, i) => i === index ? { ...s, body: e.target.value } : s) })} className="w-full rounded-lg border border-neutral-300 p-3" rows={5} placeholder="Point content" />
            <button
              type="button"
              onClick={() => setPage({ ...page, sections: page.sections.filter((_, i) => i !== index) })}
              className="text-xs text-red-600"
            >
              Remove point
            </button>
          </div>)}
        </>}
        {slug === "sitemap" && (
          <div className="space-y-4 rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#0A2540]">Sitemap columns</p>
              <button
                type="button"
                onClick={() => setPage({ ...page, sitemapGroups: [...(page.sitemapGroups ?? []), { title: "", links: [] }] })}
                className="rounded-lg border border-[#0A2540] px-3 py-2 text-sm font-medium text-[#0A2540]"
              >
                + Add column
              </button>
            </div>
            {(page.sitemapGroups ?? []).map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3 rounded-lg border border-neutral-200 p-4">
                <div className="flex gap-2">
                  <input
                    value={group.title}
                    onChange={(e) => setPage({ ...page, sitemapGroups: (page.sitemapGroups ?? []).map((item, i) => i === groupIndex ? { ...item, title: e.target.value } : item) })}
                    className="w-full rounded-lg border border-neutral-300 p-3"
                    placeholder="Column title"
                  />
                  <button type="button" onClick={() => setPage({ ...page, sitemapGroups: (page.sitemapGroups ?? []).filter((_, i) => i !== groupIndex) })} className="text-xs text-red-600">Remove</button>
                </div>
                {group.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input value={link.label} onChange={(e) => setPage({ ...page, sitemapGroups: (page.sitemapGroups ?? []).map((item, i) => i === groupIndex ? { ...item, links: item.links.map((entry, j) => j === linkIndex ? { ...entry, label: e.target.value } : entry) } : item) })} className="rounded-lg border border-neutral-300 p-3" placeholder="Link label" />
                    <input value={link.href} onChange={(e) => setPage({ ...page, sitemapGroups: (page.sitemapGroups ?? []).map((item, i) => i === groupIndex ? { ...item, links: item.links.map((entry, j) => j === linkIndex ? { ...entry, href: e.target.value } : entry) } : item) })} className="rounded-lg border border-neutral-300 p-3" placeholder="Link URL" />
                    <button type="button" onClick={() => setPage({ ...page, sitemapGroups: (page.sitemapGroups ?? []).map((item, i) => i === groupIndex ? { ...item, links: item.links.filter((_, j) => j !== linkIndex) } : item) })} className="text-xs text-red-600">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setPage({ ...page, sitemapGroups: (page.sitemapGroups ?? []).map((item, i) => i === groupIndex ? { ...item, links: [...item.links, { label: "", href: "/" }] } : item) })} className="text-sm text-[#0A2540] underline">+ Add link</button>
              </div>
            ))}
          </div>
        )}
        {message && <p className="text-sm text-[#0A2540]">{message}</p>}
        <button className="flex items-center gap-2 rounded-lg bg-[#0A2540] px-4 py-3 text-sm font-medium text-white"><Save className="h-4 w-4" /> Save page</button>
      </form>}
    </div>
  );
}
