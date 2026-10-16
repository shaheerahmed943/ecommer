import Image from "next/image";
import Link from "next/link";

export interface TrendArticle {
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

export interface TrendsSection {
  title: string;
  ctaText: string;
  ctaLink: string;
  articles: TrendArticle[];
}

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

export default function VapingTrendsSection({ section }: { section?: TrendsSection }) {
  const content = section ?? DEFAULT_TRENDS_SECTION;
  const savedArticles = content.articles ?? [];
  const articles = [
    ...savedArticles,
    ...DEFAULT_TRENDS_SECTION.articles.slice(savedArticles.length),
  ];

  return (
    <section className="bg-neutral-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-center text-[1.325rem] font-bold text-[#111]">
          {content.title}
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.title} className="flex flex-col rounded-xl bg-white p-3 shadow-sm">
              <Link href={article.href || "/blogs/news"} className="group">
                <div className={`relative aspect-[16/9] overflow-hidden rounded-lg ${article.coverClass}`}>
                  <div className="absolute inset-y-0 right-0 w-[62%]">
                    <Image
                      src={article.imageUrl || "/Welcome_to_Ecosmok_Banner_02_540x.webp"}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ objectPosition: article.imagePosition }}
                    />
                  </div>
                  <div className={`absolute inset-0 ${article.overlayClass}`} />
                  <p className="absolute inset-y-0 left-3 flex w-[58%] items-center whitespace-pre-line text-lg font-extrabold leading-[0.95] text-white drop-shadow sm:text-xl">
                    {article.coverText}
                  </p>
                </div>
              </Link>

              <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                <p className="text-[10px] text-neutral-500">
                  <time dateTime={article.date}>{article.displayDate}</time>
                  <span aria-hidden="true"> · </span>
                  {article.readTime}
                </p>
                <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[#111]">
                  <Link href={article.href || "/blogs/news"} className="hover:underline">
                    {article.title}
                  </Link>
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-600">
                  {article.summary}
                </p>
                <Link
                  href={article.href || "/blogs/news"}
                  className="site-action inline-flex px-4 py-2"
                >
                  Read More
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-7 text-center">
          <Link
            href={content.ctaLink || "/blogs/news"}
            className="site-action inline-flex px-5 py-2"
          >
            {content.ctaText || "View More"}
          </Link>
        </div>
      </div>
    </section>
  );
}