"use client";

import Image from "next/image";
import Link from "next/link";

export interface AboutValue {
  title: string;
  description: string;
}

export interface AboutFeatureSection {
  imageUrl: string;
  heading: string;
  body: string;
  points: AboutValue[];
  buttonLabel: string;
  buttonHref: string;
  imagePosition: "left" | "right";
}

export interface AboutContent {
  heroImageUrl: string;
  heroSubheading: string;
  heading: string;
  paragraphs: string[];
  storyImageUrl: string;
  values: AboutValue[];
  galleryImages: string[];
  whyShopSection?: AboutFeatureSection;
}

function AboutImage({ src, alt }: { src: string; alt: string }) {
  if (!src) return <div className="min-h-[300px] bg-neutral-100" />;
  return <Image src={src} alt={alt} fill className="object-cover" unoptimized />;
}

export default function AboutPageClient({ content }: { content: AboutContent }) {
  return (
    <main className="bg-white text-[#111]">
      <div className="border-b border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-neutral-500 sm:px-6">
          <Link href="/" className="hover:text-[#009b3a]">Home</Link>
          <span className="mx-2">/</span>
          <span>About Us</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="py-5 text-2xl font-semibold sm:text-3xl">About Us</h1>

        {content.whyShopSection && <section className="grid gap-10 py-10 lg:grid-cols-2 lg:items-center">
          <div className={`relative aspect-[4/3] overflow-hidden ${content.whyShopSection.imagePosition === "right" ? "order-2 lg:order-2" : "order-1"}`}>
            <AboutImage src={content.whyShopSection.imageUrl || content.storyImageUrl} alt={content.whyShopSection.heading} />
          </div>
          <div className={`lg:pl-8 ${content.whyShopSection.imagePosition === "right" ? "order-1 lg:order-1 lg:pl-0 lg:pr-8" : "order-2"}`}>
            <h2 className="text-2xl font-medium sm:text-3xl">{content.whyShopSection.heading}</h2>
            <div className="mt-5 h-px w-12 bg-[#009b3a]" />
            <p className="mt-6 text-sm leading-7 text-neutral-600">{content.whyShopSection.body}</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-600">
              {content.whyShopSection.points.map((value) => <li key={value.title}><strong className="text-[#111]">{value.title}:</strong> {value.description}</li>)}
            </ul>
            <Link href={content.whyShopSection.buttonHref} className="site-action mt-6 inline-flex px-5 py-2.5">
              {content.whyShopSection.buttonLabel}
            </Link>
          </div>
        </section>}
      </div>
    </main>
  );
}
