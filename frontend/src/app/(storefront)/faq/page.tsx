import { api } from "@/lib/api";
import FaqBrowser from "@/components/content/FaqBrowser";

interface FaqContent {
  title: string;
  intro: string;
  categories?: { label: string; anchor: string; faqs?: { question: string; answer: string }[] }[];
  sections: { heading: string; body: string }[];
}

const DEFAULT_CONTENT: FaqContent = {
  title: "Vaping FAQs",
  intro: "Answers to common questions about vaping, products and responsible use.",
  categories: [],
  sections: [],
};

export default async function FaqPage() {
  const content = (await api.getGenericPageContent("vaping-faqs").catch(() => null)) as FaqContent | null;
  const page = content ?? DEFAULT_CONTENT;

  return <FaqBrowser title={page.title} intro={page.intro} categories={page.categories ?? []} sections={page.sections} />;
}
