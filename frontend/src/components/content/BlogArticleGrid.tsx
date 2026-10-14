"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface BlogArticle {
  title: string;
  summary: string;
  imageUrl: string;
  category: string;
  date: string;
  readTime: string;
  href: string;
  visibility?: string;
}

function articleSlug(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "post";
}

export default function BlogArticleGrid({ articles }: { articles: BlogArticle[] }) {
  const [visibleCount, setVisibleCount] = useState(6);
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(articles.map((article) => article.category).filter(Boolean)))],
    [articles],
  );
  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <input aria-label="Search blog posts" placeholder="Search blog posts..." className="w-full max-w-xs border-b border-neutral-300 px-1 py-2 text-xs outline-none focus:border-[#0A2540]" />
        <nav className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category} className="rounded-sm border border-neutral-200 px-3 py-2 text-[11px] font-medium">
              {category}
            </span>
          ))}
        </nav>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleArticles.map((article, index) => (
          <article key={`${article.title}-${article.date}-${index}`} className="overflow-hidden border border-neutral-200 bg-white">
            <div className="relative aspect-[1.65/1] bg-neutral-100">
              {article.imageUrl && <Image src={article.imageUrl} alt={article.title} fill className="object-cover" unoptimized />}
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">{article.category} · {article.date}</p>
              <h2 className="mt-2 line-clamp-3 text-base font-medium leading-6">{article.title}</h2>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-600">{article.summary}</p>
              <p className="mt-2 text-[10px] text-neutral-500">{article.readTime}</p>
              <Link href={`/blogs/news/${articleSlug(article.title)}`} className="mt-4 inline-flex bg-black px-4 py-2 text-[10px] font-semibold text-white">
                READ MORE
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-10 text-center text-xs text-neutral-500">
        You&apos;ve viewed {visibleArticles.length} of {articles.length} posts
      </p>
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + 6, articles.length))}
            className="border border-neutral-300 px-5 py-2 text-xs"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
