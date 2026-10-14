"use client";

import { useState } from "react";
import PageHero from "@/components/layout/PageHero";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  label: string;
  anchor: string;
  faqs?: FaqItem[];
}

interface FaqSection {
  heading: string;
  body: string;
}

export default function FaqBrowser({
  title,
  intro,
  categories,
  sections,
}: {
  title: string;
  intro: string;
  categories: FaqCategory[];
  sections: FaqSection[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory | null>(null);
  const selectedFaqs = selectedCategory?.faqs?.length
    ? selectedCategory.faqs
    : selectedCategory
      ? sections
        .filter((section, index) => `faq-${index}-${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` === selectedCategory.anchor)
        .map((section) => ({ question: section.heading, answer: section.body }))
      : sections.map((section) => ({ question: section.heading, answer: section.body }));

  return (
    <main className="bg-white">
      <PageHero title={title} />
      <div className="mx-auto grid max-w-4xl gap-5 px-4 py-8 sm:px-8 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-5 sm:py-8">
        <aside className="h-fit rounded-sm bg-neutral-100 p-3 sm:sticky sm:top-6">
          <p className="text-[10px] font-semibold text-[#111]">Categories</p>
          <nav className="mt-3 space-y-2" aria-label="FAQ categories">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`block text-left text-[10px] leading-4 hover:underline ${selectedCategory ? "text-[#0070c9]" : "font-semibold text-[#00a651]"}`}
            >
              All FAQs
            </button>
            {categories.map((category, index) => (
              <button
                key={`${category.label}-${category.anchor}-${index}`}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`block w-full text-left text-[10px] leading-4 hover:underline ${selectedCategory === category ? "font-semibold text-[#00a651]" : "text-[#0070c9]"}`}
              >
                {category.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <h2 className="font-serif text-[1.325rem] font-bold leading-tight text-[#0A2540]">
            {selectedCategory?.label ?? title}
          </h2>
          <p className="sr-only">{intro}</p>
          <div className="mt-5 border-t border-neutral-200">
            {selectedFaqs.map((faq, index) => (
              <details key={`${faq.question}-${index}`} className="group border-b border-neutral-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-[13px] font-bold text-[#111] [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <span className="text-xs font-normal text-[#111] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-3 text-[13px] leading-5 text-neutral-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
