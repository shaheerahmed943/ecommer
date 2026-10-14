import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";

interface AboutContent {
  heroImageUrl: string;
  heroSubheading: string;
  heading: string;
  whyShopSection?: {
    imageUrl: string;
    heading: string;
    body: string;
    points: { title: string; description: string }[];
    buttonLabel: string;
    buttonHref: string;
    imagePosition: "left" | "right";
  };
  additionalSections?: AboutFeatureSection[];
}

interface AboutFeatureSection {
  imageUrl: string;
  heading: string;
  body: string;
  points: { title: string; description: string }[];
  buttonLabel: string;
  buttonHref: string;
  imagePosition: "left" | "right";
}

const DEFAULT_CONTENT: AboutContent = {
  heroImageUrl: "",
  heroSubheading: "",
  heading: "About Us",
};

export default async function AboutPage() {
  const stored = (await api.getAboutContent().catch(() => null)) as Partial<AboutContent> | null;
  const content = { ...DEFAULT_CONTENT, ...(stored ?? {}) };

  return (
    <main className="bg-white text-[#111]">
      <section className="relative min-h-[250px] overflow-hidden bg-neutral-100">
        {content.heroImageUrl && (
          <>
            <Image
              src={content.heroImageUrl}
              alt=""
              fill
              priority
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/35" />
          </>
        )}
        <div className="relative mx-auto flex min-h-[250px] max-w-6xl flex-col justify-center px-4 sm:px-6">
          <div className={`text-sm ${content.heroImageUrl ? "text-white/80" : "text-neutral-500"}`}>
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <span>{content.heading}</span>
          </div>
          <h1 className={`mt-5 text-4xl font-semibold sm:text-6xl ${content.heroImageUrl ? "text-white" : "text-[#111]"}`}>
            {content.heading}
          </h1>
          {content.heroSubheading && (
            <p className={`mt-4 max-w-xl text-base sm:text-lg ${content.heroImageUrl ? "text-white/90" : "text-neutral-600"}`}>
              {content.heroSubheading}
            </p>
          )}
        </div>
      </section>
      {[content.whyShopSection, ...(content.additionalSections ?? [])].filter(Boolean).map((section, index) => section && (
        <section key={`about-section-${index}`} className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className={`relative aspect-[4/3] overflow-hidden ${section.imagePosition === "right" ? "lg:order-2" : ""}`}>
            {section.imageUrl ? (
              <Image
                src={section.imageUrl}
                alt={section.heading}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="h-full min-h-[300px] bg-neutral-100" />
            )}
          </div>
          <div className={section.imagePosition === "right" ? "lg:order-1" : ""}>
            <h2 className="text-2xl font-medium sm:text-3xl">{section.heading}</h2>
            <div className="mt-6 h-px w-12 bg-[#009b3a]" />
            <p className="mt-6 text-sm leading-7 text-neutral-600">{section.body}</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-600">
              {section.points.map((point) => (
                <li key={point.title}>
                  <strong className="text-[#111]">{point.title}:</strong> {point.description}
                </li>
              ))}
            </ul>
            {section.buttonLabel && (
              <Link
                href={section.buttonHref || "/collections/all"}
                className="mt-7 inline-flex rounded-md bg-[#c9002b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#a90024]"
              >
                {section.buttonLabel}
              </Link>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
