"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export interface AboutSection {
  heading: string;
  paragraphs: string[];
  commitmentHeading: string;
  commitmentParagraphs: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

const DEFAULT_FAQ_ITEMS: FaqItem[] = [
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
  {
    question: "Which style of kit matches my needs?",
    answer: "Prefilled pod kits are simple to use, refillable pod systems offer more liquid choice, and larger mod kits provide more adjustment. Choose a device designed for your experience level and read its instructions.",
  },
  {
    question: "How much nicotine should I vape?",
    answer: "Nicotine needs vary. Adult smokers who switch should choose a strength that helps manage cravings and follow the product label. If you do not smoke, do not start vaping or using nicotine.",
  },
  {
    question: "Any tips for choosing a flavour I'll actually like?",
    answer: "Start with flavour profiles you already enjoy, such as fruit, mint or tobacco-inspired blends. Check the flavour description and bottle size before ordering.",
  },
  {
    question: "How do I know which coil or pod my device takes?",
    answer: "Check your device model and its manual, then compare the exact compatible pod or coil name on the product listing. If you are unsure, contact customer support before ordering.",
  },
  {
    question: "What is a box mod, and is it right for me?",
    answer: "A box mod is a larger vape device with adjustable settings, usually paired with a separate tank. It may suit experienced users, but a simpler pod kit can be easier for beginners.",
  },
];

const DEFAULT_ABOUT: AboutSection = {
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

export default function HomeAboutFaqSection({
  about,
  faq,
}: {
  about?: AboutSection;
  faq?: FaqSection;
}) {
  const [openFaq, setOpenFaq] = useState(0);
  const aboutContent = about ?? DEFAULT_ABOUT;
  const faqContent = faq ?? { title: "FAQ", items: DEFAULT_FAQ_ITEMS };

  return (
    <section className="mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-8">
      <article className="rounded-lg bg-neutral-50 p-5 sm:p-7">
        <h2 className="text-[1.325rem] font-bold leading-tight text-[#111]">
          {aboutContent.heading}
        </h2>
        <div className="mt-4 space-y-4 text-xs leading-5 text-neutral-700 sm:text-sm">
          {aboutContent.paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`} dangerouslySetInnerHTML={{ __html: paragraph }} />
          ))}
        </div>

        <h3 className="mt-7 text-lg font-semibold text-[#111]">{aboutContent.commitmentHeading}</h3>
        <div className="mt-3 space-y-4 text-xs leading-5 text-neutral-700 sm:text-sm">
          {aboutContent.commitmentParagraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div>
        <h2 className="mb-3 text-[1.325rem] font-bold text-[#111]">{faqContent.title}</h2>
        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {(faqContent.items ?? DEFAULT_FAQ_ITEMS).map((item, index) => {
            const isOpen = openFaq === index;
            const answerId = `home-faq-answer-${index}`;

            return (
              <div key={`${item.question}-${index}`}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="flex min-h-11 w-full items-center justify-between gap-4 py-3 text-left text-sm font-medium text-[#111]"
                >
                  <span>{item.question}</span>
                  {isOpen ? <Minus className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
                </button>
                {isOpen && (
                  <p id={answerId} className="pb-4 pr-6 text-xs leading-5 text-neutral-600 sm:text-sm">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}