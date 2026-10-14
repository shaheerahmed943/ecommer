import Image from "next/image";
import Link from "next/link";

export interface WelcomeSection {
  heading: string;
  paragraphs: string[];
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
}

const DEFAULT_WELCOME_SECTION: WelcomeSection = {
  heading: "Welcome to EcoSmok Your Go To Vape Online Store in the UK",
  paragraphs: [
    "At EcoSmok, we offer a wide range of vape kits, vape pens, pod systems, prefilled kits, coils, tanks, and more from trusted brands across the UK.",
    "Explore premium e-liquids, new flavours, exclusive deals, bundle offers, and multi-buy discounts, all in one place.",
    "With fast UK delivery and reliable customer service, EcoSmok is your destination for quality vaping products. For adults aged 18 and over.",
  ],
  ctaText: "Shop now",
  ctaLink: "/collections/all",
  imageUrl: "/Welcome_to_Ecosmok_Banner_02_540x.webp",
};

export default function WelcomeStoreSection({ content }: { content?: WelcomeSection }) {
  const section = content ?? DEFAULT_WELCOME_SECTION;

  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 sm:gap-12 sm:py-14 lg:grid-cols-2 lg:gap-16">
      <div className="max-w-xl">
        <h2 className="text-[1.325rem] font-bold leading-tight text-[#111]">
          {section.heading}
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-neutral-700">
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))}
        </div>
        {section.ctaText && section.ctaLink && (
          <Link
            href={section.ctaLink}
            className="mt-5 inline-flex min-h-10 items-center rounded-full bg-green-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            {section.ctaText}
          </Link>
        )}
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[430px] overflow-hidden rounded-md">
        <Image
          src={section.imageUrl || DEFAULT_WELCOME_SECTION.imageUrl}
          alt="Vape devices and e-liquid from EcoSmok"
          fill
          sizes="(max-width: 1023px) 100vw, 45vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}