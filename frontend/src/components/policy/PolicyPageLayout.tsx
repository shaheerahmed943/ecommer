"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";

export interface PolicySection {
  heading: string;
  body: string;
}

export interface PolicyContent {
  heading: string;
  intro: string;
  sections: PolicySection[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function renderBody(body: string) {
  return body.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).map((token, index) => {
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <Link key={index} href={link[2]} className="text-[#0A2540] underline">{link[1]}</Link>;
    const bold = token.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    return <span key={index}>{token}</span>;
  });
}

export default function PolicyPageLayout({
  content,
  hero = false,
  children,
}: {
  content: PolicyContent;
  hero?: boolean;
  children?: React.ReactNode;
}) {
  const { heading, intro, sections } = content;

  return (
    <div>
      {hero ? (
        <section className="bg-[#0A2540] px-4 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C5DC3B]">
              EcoSmok
            </p>
            <h1 className="mt-4 max-w-4xl font-serif text-[2.3rem] font-bold leading-tight text-white">
              {heading}
            </h1>
            {intro && <p className="mt-5 max-w-3xl text-base leading-7 text-white/80">{intro}</p>}
          </div>
        </section>
      ) : <PageHero title={heading} />}

      {!hero && intro && (
        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mx-auto max-w-3xl px-4 pt-8 text-base leading-relaxed text-neutral-600"
        >
          {intro}
        </motion.p>
      )}

      {children}

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-16">
        {sections.map((section, idx) => (
          <motion.section
            key={idx}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
          >
            <h2 className="font-serif text-[1.325rem] font-bold text-[#0A2540]">{section.heading}</h2>
            <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-neutral-700">{renderBody(section.body)}</p>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
