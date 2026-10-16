import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import BlogCustomContent from "@/components/content/BlogCustomContent";

interface BlogArticle {
  title: string;
  summary: string;
  content?: string;
  imageUrl: string;
  category: string;
  date: string;
  readTime: string;
  href: string;
  visibility?: string;
  tags?: string;
}

interface BlogContent {
  title?: string;
  articles?: BlogArticle[];
}

function articleSlug(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "post";
}

function fallbackContent(article: BlogArticle) {
  return `<p>${article.summary}</p><h2 id="what-you-need-to-know">What you need to know</h2><p>${article.summary} This guide explains the key points in clear, practical language so you can make informed choices.</p><h2 id="our-guide">Our guide</h2><p>Read the latest information, check product details carefully, and follow all applicable UK rules. If you need more help, our team is here to support you.</p>`;
}

function prepareArticleHtml(rawContent: string, fallback: string) {
  if (!rawContent.trim()) return fallback;
  const decoded = decodeHtml(rawContent);
  const documentMatch = decoded.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = documentMatch ? documentMatch[1] : decoded;
  const rootMatch = body.match(/<div[^>]*class=["'][^"']*\beco-article\b[^"']*["'][^>]*>/i);
  if (rootMatch && rootMatch.index !== undefined) {
    body = body.slice(rootMatch.index);
  } else {
    const firstArticleHeading = body.search(/<h1\b/i);
    if (firstArticleHeading > 0) body = body.slice(firstArticleHeading);
  }
  return body
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .trim() || fallback;
}

function extractArticleStyles(rawContent: string) {
  const decoded = decodeHtml(rawContent);
  return Array.from(decoded.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1])
    .join("\n");
}

function decodeHtml(value: string) {
  let decoded = value;
  for (let index = 0; index < 10; index += 1) {
    const next = decoded
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&amp;/gi, "&");
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

function articleContentScore(article: BlogArticle) {
  const content = article.content?.trim() || "";
  return (article.imageUrl?.trim() ? 2 : 0)
    + (/<style[\s>]/i.test(content) ? 3 : decodeHtml(content).includes("<style") ? 2 : content ? 1 : 0);
}

function canonicalArticles(articles: BlogArticle[]) {
  return Array.from(
    articles.reduce((byTitle, item) => {
      const title = item.title?.trim();
      if (!title) return byTitle;
      const current = byTitle.get(title);
      if (!current || articleContentScore(item) > articleContentScore(current)) {
        byTitle.set(title, item);
      }
      return byTitle;
    }, new Map<string, BlogArticle>()).values(),
  );
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const stored = await api.getGenericPageContent("blogs/news").catch(() => null) as BlogContent | null;
  const articles = canonicalArticles(
    (stored?.articles || []).filter((item) => item.visibility?.trim().toLowerCase() !== "hidden"),
  );
  const article = articles
    ?.filter((item) => articleSlug(item.title) === params.slug)
    .sort((first, second) => articleContentScore(second) - articleContentScore(first))[0];

  if (!article) notFound();

  const related = articles
    .filter((item) => item.title !== article.title)
    .slice(0, 3);
  const categories = Array.from(new Set(
    articles.map((item) => item.category?.trim()).filter(Boolean),
  ));
  const tags = (article.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const content = prepareArticleHtml(article.content || "", fallbackContent(article));
  const articleStyles = extractArticleStyles(article.content || "");
  const hasCustomContent = Boolean(articleStyles.trim());

  return (
    <main className="bg-white text-[#10211d]">
      <div className="mx-auto max-w-[1180px] px-4 py-3 text-[10px] text-neutral-500">
        <Link href="/blogs/news" className="hover:underline">Home</Link> <span className="mx-1">›</span>
        <Link href="/blogs/news" className="hover:underline">News</Link> <span className="mx-1">›</span> {article.title}
      </div>
      {article.imageUrl && (
        <div className="mx-auto max-w-[1180px] px-4 pb-6">
          <Image
            src={article.imageUrl}
            alt={article.title}
            width={0}
            height={0}
            sizes="(max-width: 1180px) 100vw, 1180px"
            className="h-auto w-full object-contain"
            unoptimized
            priority
          />
        </div>
      )}
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-8 lg:grid-cols-[220px_minmax(0,1180px)]">
        <aside className="hidden lg:block">
          <div className="border-b border-neutral-200 pb-5">
            <div className="flex overflow-hidden rounded border border-neutral-300">
              <input placeholder="Search..." className="w-full px-2 py-2 text-xs outline-none" />
              <button type="button" className="bg-black px-3 text-xs text-white">⌕</button>
            </div>
          </div>
          <h2 className="mt-5 border-l-2 border-[#23af68] px-3 py-2 text-[10px] font-bold uppercase">Categories</h2>
          <div className="space-y-2 px-3 py-3 text-xs text-neutral-600">
            {categories.map((category) => <Link key={category} href={`/blogs/news?category=${encodeURIComponent(category)}`} className="block hover:text-[#23af68]">{category}</Link>)}
          </div>
          <h2 className="mt-5 border-l-2 border-[#23af68] px-3 py-2 text-[10px] font-bold uppercase">Related articles</h2>
          <div className="space-y-3 px-3 py-3">
            {related.map((item, index) => (
              <Link key={`${item.title}-${item.date}-${index}`} href={`/blogs/news/${articleSlug(item.title)}`} className="flex gap-2 text-[10px] leading-3 font-medium hover:text-[#23af68]">
                <div className="relative h-12 w-14 shrink-0 overflow-hidden bg-neutral-100">
                  {item.imageUrl && <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />}
                </div>
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
          {tags.length > 0 && (
            <>
              <h2 className="mt-5 border-l-2 border-[#23af68] px-3 py-2 text-[10px] font-bold uppercase">Article tags</h2>
              <div className="flex flex-wrap gap-2 px-3 py-3">
                {tags.map((tag) => (
                  <Link key={tag} href={`/blogs/news?search=${encodeURIComponent(tag)}`} className="border border-neutral-200 px-2 py-1 text-[9px] text-neutral-600 hover:border-[#23af68] hover:text-[#23af68]">
                    {tag}
                  </Link>
                ))}
              </div>
            </>
          )}
        </aside>
        <article className="min-w-0">
          {hasCustomContent ? (
            <div className="border border-neutral-200">
              <BlogCustomContent content={content} styles={articleStyles} />
            </div>
          ) : (
            <div className="overflow-hidden border border-neutral-200">
              <header className="bg-[#103832] px-6 py-10 text-white sm:px-8">
                <p className="inline-flex rounded-full bg-[#23af68] px-4 py-2 text-xs font-bold uppercase tracking-wide">
                  {article.category || "Vaping News & Trends"}
                </p>
                <h1 className="mt-5 max-w-3xl text-3xl font-medium leading-tight sm:text-5xl">
                  {article.title}
                </h1>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-[#b8e7d0] sm:text-base">
                  {article.summary}
                </p>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs font-semibold text-white/90">
                  <span>Published {article.date}</span>
                  <span>EcoSmok Editorial Team</span>
                </div>
              </header>
              <div className="border-l-4 border-[#23af68] bg-[#edf8f0] px-6 py-7 sm:px-8">
                <h2 className="text-lg font-medium">In this article</h2>
                <div className="mt-4 grid gap-3 text-sm font-semibold sm:grid-cols-2">
                  <a href="#what-you-need-to-know" className="hover:text-[#23af68]">What you need to know</a>
                  <a href="#our-guide" className="hover:text-[#23af68]">Our guide</a>
                </div>
              </div>
              <div className="blog-default-content px-6 py-8 sm:px-8">
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          )}
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <h2 className="mb-4 text-center text-xl font-semibold">Leave a comment</h2>
            <div className="grid gap-3 sm:grid-cols-2"><input placeholder="Name" className="border border-neutral-300 p-3 text-xs" /><input placeholder="Email" className="border border-neutral-300 p-3 text-xs" /></div>
            <textarea placeholder="Message" rows={5} className="mt-3 w-full border border-neutral-300 p-3 text-xs" />
            <button type="button" className="site-action mt-3 px-5 py-2">SUBMIT COMMENT</button>
          </div>
        </article>
      </div>
    </main>
  );
}
