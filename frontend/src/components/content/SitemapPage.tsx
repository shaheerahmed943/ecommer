"use client";

import Link from "next/link";
import { useState } from "react";
import PageHero from "@/components/layout/PageHero";

interface SitemapGroup {
  title: string;
  links: { label: string; href: string }[];
}

export default function SitemapPage({
  title,
  intro,
  groups,
}: {
  title: string;
  intro: string;
  groups: SitemapGroup[];
}) {
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  return (
    <main>
      <PageHero title={title} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <h1 className="text-center text-2xl font-semibold text-[#111]">{title}</h1>
        <p className="mt-3 text-center text-sm text-neutral-600">{intro}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {groups.map((group, index) => {
            const isExpanded = expandedGroups[index] === true;
            const visibleLinks = isExpanded ? group.links : group.links.slice(0, 10);
            const hasMore = group.links.length > 10;

            return (
            <section key={`${group.title}-${index}`} className="rounded-sm bg-neutral-50 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-[#111]">{group.title}</h2>
              <ul className="mt-4 space-y-2">
                {visibleLinks.map((link, linkIndex) => (
                  <li key={`${link.label}-${linkIndex}`}>
                    <Link href={link.href} className="block truncate text-xs text-[#111] hover:text-green-700 hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setExpandedGroups((current) => ({ ...current, [index]: !isExpanded }))}
                  className="mt-5 inline-flex rounded-sm bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              )}
            </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
