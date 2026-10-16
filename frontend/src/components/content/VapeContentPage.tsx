import Link from "next/link";
import React from "react";
import PageHero from "@/components/layout/PageHero";

export interface VapeContentSection {
  heading: string;
  body: string;
}

function renderBody(body: string) {
  const tokens = body.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return tokens.map((token, index) => {
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2].startsWith("http") ? link[2] : link[2];
      return <Link key={index} href={href} className="font-medium text-[#0A2540] underline">{link[1]}</Link>;
    }
    const bold = token.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    return <React.Fragment key={index}>{token}</React.Fragment>;
  });
}

export default function VapeContentPage({
  eyebrow = "EcoSmok UK",
  title,
  intro,
  sections,
  links = [],
}: {
  eyebrow?: string;
  title: string;
  intro: string;
  sections: VapeContentSection[];
  links?: { label: string; href: string }[];
}) {
  return (
    <article>
      <PageHero title={title} />
      <div className="mx-auto max-w-5xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A2540]">{eyebrow}</p>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-600">{intro}</p>
      {links.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="site-action inline-flex px-4 py-2">
              {link.label}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.heading} className="border-t border-neutral-200 pt-5">
            <h2 className="text-xl font-semibold text-[#0A2540]">{section.heading}</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-neutral-600">{renderBody(section.body)}</p>
          </section>
        ))}
      </div>
      </div>
    </article>
  );
}
