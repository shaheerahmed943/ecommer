import { api } from "@/lib/api";
import BlogArticleGrid, { BlogArticle } from "@/components/content/BlogArticleGrid";

const FALLBACK_ARTICLES: BlogArticle[] = [
  { title: "Bringing Vapes Into the UK: The New 50ml Travel Allowance Explained", summary: "What adult travellers need to know about bringing vape products into the UK.", imageUrl: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=900", category: "News", date: "Oct 04, 2026", readTime: "5 min read", href: "/blogs/news" },
  { title: "Why Vape E-Liquid Bottles and Pod Kits Are Shrinking Across the UK", summary: "A plain-English guide to changing product sizes and what they mean for shoppers.", imageUrl: "https://images.unsplash.com/photo-1499145484967-3f2e1c8f4a5b?w=900", category: "Guides", date: "Oct 02, 2026", readTime: "4 min read", href: "/blogs/news" },
  { title: "Faulty or Fake Vape? What UK Law Says and How to Report It", summary: "Learn how to spot product problems and what steps to take next.", imageUrl: "https://images.unsplash.com/photo-1534885320675-b08aa131cc5e?w=900", category: "Reviews", date: "Oct 01, 2026", readTime: "6 min read", href: "/blogs/news" },
  { title: "UK Vape Shop Licensing: What's Coming and Why It's Delayed Until 2027", summary: "A quick overview of proposed licensing changes for vape retailers.", imageUrl: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=900", category: "News", date: "Oct 01, 2026", readTime: "4 min read", href: "/blogs/news" },
  { title: "Vaping at Work: What UK Law Actually Says", summary: "Can you vape at work in the UK? Here is what employers and staff should know.", imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900", category: "Guides", date: "Oct 01, 2026", readTime: "3 min read", href: "/blogs/news" },
  { title: "When to Change Your Vape Coil: A UK Guide to Spotting the Warning Signs", summary: "Know when a coil needs replacing and how to keep your device performing well.", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900", category: "Guides", date: "Oct 01, 2026", readTime: "5 min read", href: "/blogs/news" },
];

export default async function NewsBlogPage() {
  const stored = await api.getGenericPageContent("blogs/news").catch(() => null) as {
    title?: string;
    articles?: BlogArticle[];
  } | null;
  const articles = (stored?.articles?.length ? stored.articles : FALLBACK_ARTICLES)
    .filter((article) => article.visibility?.trim().toLowerCase() !== "hidden");

  return (
    <main className="bg-white text-[#111]">
      <section className="bg-neutral-50 py-10 text-center">
        <h1 className="text-3xl font-medium sm:text-4xl">{stored?.title || "Blogs"}</h1>
      </section>
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6">
        <BlogArticleGrid articles={articles} />
      </section>
    </main>
  );
}
