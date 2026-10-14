import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Mail,
  Package,
  Phone,
  RotateCcw,
  Wrench,
} from "lucide-react";
import { api } from "@/lib/api";
import BrandsBrowser from "@/components/content/BrandsBrowser";
import PageHero from "@/components/layout/PageHero";
import BlackFridayPage from "@/components/content/BlackFridayPage";
import WholesalePage from "@/components/content/WholesalePage";
import SitemapPage from "@/components/content/SitemapPage";

interface PageContent {
  slug: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  brands?: { name: string; logoUrl?: string; linkUrl?: string; filters?: string[]; sortOrder?: number }[];
  sitemapGroups?: { title: string; links: { label: string; href: string }[] }[];
  articles?: BlogArticle[];
}

interface BlogArticle {
  title: string;
  summary: string;
  imageUrl: string;
  category: string;
  date: string;
  readTime: string;
}

function blogSlug(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "post";
}

interface BrandProduct {
  id: string;
  title?: string;
  brand?: string | null;
  productKind?: string | null;
  deviceType?: string | null;
  nicotineStrength?: string | null;
}

interface CustomerSupportContent extends PageContent {
  email: string;
  emailText: string;
  phone: string;
  phoneText: string;
  categories: { label: string; anchor: string }[];
  groups: { id: string; title: string; description: string; faqs: { question: string; answer: string }[] }[];
}

const SUPPORT_GROUPS = [
  {
    title: "Ordering and Account Questions",
    description: "Everything you need to know about creating an account, placing orders, tracking deliveries, and managing all your purchases with EcoSmoke.",
    icon: CheckCircle2,
    faqs: [
      ["How do I create an account?", "To create an account at EcoSmoke, simply click on the \"Sign Up\" button on our homepage. Enter your details, including your name, email address, and password, then submit the form. A confirmation email will be sent to you so you can verify and activate your account."],
      ["How do I place an order?", "Browse our products, add the items you want to your basket, and continue to checkout. Enter your delivery and payment details, then confirm your order."],
      ["Can I modify my order after it has been placed?", "Contact our support team as soon as possible. We can only make changes before the order has been dispatched."],
      ["How can I track my order?", "Use our Track Order page with your order number and email address. We will also send tracking updates by email."],
      ["What should I do if I received the wrong item?", "Please contact us with your order number and a photo of the item received so we can resolve this quickly."],
    ],
  },
  {
    title: "Payment and Pricing Questions",
    description: "Learn about our accepted payment methods, shipping fees, special offers, and how we securely process all transactions to ensure a safe and smooth shopping experience.",
    icon: CreditCard,
    faqs: [
      ["What payment methods do you accept?", "At EcoSmoke.co.uk, we accept a variety of payment methods, including major credit and debit cards. Payment options available to you are shown securely at checkout."],
      ["Are there any additional fees for shipping?", "Any delivery charge is shown clearly at checkout before you place your order."],
      ["Do you offer discounts or promotions?", "Our latest promotions are shown on the website. Follow our offers and newsletter updates so you do not miss a deal."],
    ],
  },
  {
    title: "Shipping Questions",
    description: "Find details about delivery times, available shipping carriers, international orders, and how to track your EcoSmoke package efficiently.",
    icon: Package,
    faqs: [
      ["Do you offer international shipping?", "Yes, EcoSmoke provides international shipping to selected countries. For details on destinations and restrictions, please see our shipping policy page."],
      ["Do you offer free shipping?", "Free delivery eligibility and any applicable order threshold are shown during checkout."],
      ["What shipping carriers do you use?", "We use trusted delivery partners selected according to the destination and delivery service chosen."],
      ["Can I choose my delivery method?", "Available delivery methods are displayed at checkout for your address."],
      ["What should I do if my order hasn't arrived?", "Check your tracking link first, then contact our support team with your order number if the delivery is delayed."],
    ],
  },
  {
    title: "Returns and Exchanges",
    description: "Learn about EcoSmoke's return policy, exchange process, and the steps to follow if you need to send an item back.",
    icon: RotateCcw,
    faqs: [
      ["What is your return policy?", "EcoSmoke accepts returns on unopened items within 14 days of delivery. If you receive a defective or wrong item, contact us for return instructions. Please note that opened e-liquid cannot be returned due to health and safety regulations."],
      ["How do I initiate a return or exchange?", "Contact customer support with your order number and reason for return. We will explain the next steps and provide the appropriate return instructions."],
      ["Can I return an opened e-liquid?", "For health and safety reasons, opened e-liquid cannot be returned."],
    ],
  },
  {
    title: "Customer Support",
    description: "Get assistance with product selection, technical guidance, and ways to reach EcoSmoke's customer service team for support.",
    icon: Wrench,
    faqs: [
      ["How can I reach EcoSmoke's customer service?", "You can contact us by calling our customer service number at +44 7443 176197. If you prefer WhatsApp, our support number supports this service, and you can expect a response within 30 minutes."],
      ["What's the best way to email EcoSmoke?", "Send your enquiry to hello@ecosmok.co.uk and include your order number where relevant."],
      ["Where is EcoSmoke located?", "EcoSmoke is a UK-based online vape retailer serving customers across the United Kingdom."],
      ["What are your customer service hours?", "Our team aims to respond to enquiries during normal UK business hours."],
      ["Do you have a warranty on your products?", "Warranty support depends on the product and issue. Contact us with your order details for help."],
      ["What is your age verification process?", "Customers must be aged 18 or over. We use age verification checks before completing eligible orders."],
      ["How do I choose the right vape products for me?", "Contact our team with your experience and preferences and we can help you choose suitable products."],
      ["What should I do if an item is out of stock?", "Check back soon or contact us and we can suggest a suitable alternative where available."],
    ],
  },
] as const;

function SupportFaq({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-neutral-200 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-[#111] [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <span className="text-lg font-normal text-neutral-500 transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="px-4 pb-4 text-sm leading-6 text-neutral-600">{answer}</p>
    </details>
  );
}

function CustomerSupportPage({ content }: { content: CustomerSupportContent }) {
  const categoryIcons = [CheckCircle2, CreditCard, RotateCcw, Package, Wrench];
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-bold text-[#009b3a]">Customer Support</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111] sm:text-4xl">{content.title}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-neutral-600">
              {content.intro}
            </p>
          </div>
          <div className="space-y-3">
            <a href={`mailto:${content.email}`} className="flex items-center gap-5 rounded-2xl bg-neutral-100 px-6 py-5 transition-colors hover:bg-neutral-200">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-400 text-white"><Mail className="h-6 w-6" /></span>
              <span><strong className="block text-sm text-[#009b3a]">Send us an email</strong><span className="text-xs text-neutral-600">{content.emailText}</span></span>
            </a>
            <a href={`tel:${content.phone}`} className="flex items-center gap-5 rounded-2xl bg-neutral-100 px-6 py-5 transition-colors hover:bg-neutral-200">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#079ca3] text-white"><Phone className="h-6 w-6" /></span>
              <span><strong className="block text-sm text-[#009b3a]">Give us a call</strong><span className="text-xs text-neutral-600">{content.phoneText}</span></span>
            </a>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {content.categories.map(({ label, anchor }, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            return (
            <a key={anchor} href={`#${anchor}`} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl bg-neutral-100 px-2 text-center text-xs font-bold text-[#009b3a] transition-colors hover:bg-neutral-200">
              <Icon className="h-7 w-7 text-[#111]" />
              {label}
            </a>
            );
          })}
        </div>

        <div className="mt-14 space-y-12">
          {content.groups.map(({ id, title, description, faqs }) => (
            <section key={id} id={id} className="grid gap-7 lg:grid-cols-2 lg:items-start">
              <div className="min-h-56 rounded-2xl bg-neutral-50 px-5 py-5 sm:px-6">
                <h2 className="text-xl font-bold text-[#111]">{title}</h2>
                <p className="mt-4 text-sm leading-6 text-neutral-600">{description}</p>
              </div>
              <div>
                <h2 className="mb-3 text-lg font-bold text-[#111]">FAQ</h2>
                <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white">
                  {faqs.map(({ question, answer }) => <SupportFaq key={question} question={question} answer={answer} />)}
                </div>
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function GenericPage({ params }: { params: { slug: string } }) {
  if (params.slug === "vape-deals") redirect("/vape-deals");
  let page: PageContent;
  try {
    page = await api.getGenericPageContent(params.slug) as PageContent;
  } catch {
    notFound();
  }

  if (params.slug === "customer-support") {
    return <CustomerSupportPage content={page as CustomerSupportContent} />;
  }

  if (params.slug === "brands") {
    const result = await api.listProducts("pageSize=60").catch(() => ({ data: [] }));
    return <BrandsBrowser products={(result as { data: BrandProduct[] }).data} configuredBrands={page.brands} title={page.title} intro={page.intro} />;
  }

  if (params.slug === "black-friday") {
    return <BlackFridayPage title={page.title} intro={page.intro} sections={page.sections} />;
  }

  if (params.slug === "eco-smok-wholesale") {
    return <WholesalePage title={page.title} intro={page.intro} sections={page.sections} />;
  }

  if (params.slug === "sitemap") {
    return <SitemapPage title={page.title} intro={page.intro} groups={page.sitemapGroups ?? []} />;
  }

  const relatedArticles = params.slug === "guides"
    ? ((await api.getGenericPageContent("blogs/news").catch(() => null) as { articles?: BlogArticle[] } | null)?.articles ?? [])
      .filter((article) => article.category.toLowerCase() === "guides")
      .slice(0, 3)
    : [];

  return (
    <main>
      <PageHero title={page!.title} />
      <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-lg text-neutral-600">{page!.intro}</p>
      <div className="mt-10 space-y-8">
        {page!.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif text-xl text-[#0A2540]">{section.heading}</h2>
            <p className="mt-2 whitespace-pre-line leading-7 text-neutral-600">{section.body}</p>
          </section>
        ))}
      </div>
      </div>
      {params.slug === "guides" && relatedArticles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <div className="mb-6 flex items-end justify-between border-b border-neutral-200 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#009b3a]">From the blog</p>
              <h2 className="mt-1 font-serif text-2xl text-[#0A2540]">Related guides</h2>
            </div>
            <Link href="/blogs/news" className="text-xs font-semibold text-[#0A2540] underline">View all blogs</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {relatedArticles.map((article) => (
                <article key={article.title} className="overflow-hidden border border-neutral-200 bg-white">
                  <div className="relative aspect-[1.7/1] bg-neutral-100">
                    {article.imageUrl && <Image src={article.imageUrl} alt={article.title} fill className="object-cover" unoptimized />}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500">{article.category} · {article.date}</p>
                    <h3 className="mt-2 line-clamp-2 text-base font-medium leading-6 text-[#111]">{article.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-600">{article.summary}</p>
                    <Link href={`/blogs/news/${blogSlug(article.title)}`} className="mt-4 inline-flex bg-black px-4 py-2 text-[10px] font-semibold text-white">READ MORE</Link>
                  </div>
                </article>
              ))}
          </div>
        </section>
      )}
    </main>
  );
}
