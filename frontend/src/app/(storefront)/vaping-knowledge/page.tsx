import VapeContentPage from "@/components/content/VapeContentPage";
import { api } from "@/lib/api";

interface KnowledgePage {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}

export default async function VapingKnowledgePage() {
  const page = await api.getGenericPageContent("vaping-knowledge") as KnowledgePage;
  return (
    <VapeContentPage
      title={page.title}
      intro={page.intro}
      sections={page.sections}
      links={[{ label: "Read FAQs", href: "/faq" }, { label: "Shop accessories", href: "/collections/accessories" }]}
    />
  );
}
