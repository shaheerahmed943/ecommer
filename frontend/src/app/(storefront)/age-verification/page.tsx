import { api } from "@/lib/api";

interface AgeVerificationContent {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}

const DEFAULT_CONTENT: AgeVerificationContent = {
  title: "Age Restriction and Verification Policy",
  intro: "It is illegal to sell electronic cigarette products to individuals under 18.",
  sections: [],
};

function SectionBody({ body }: { body: string }) {
  const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bullets = lines.length > 0 && lines.every((line) => line.startsWith("- "));

  if (bullets) {
    return (
      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-700">
        {lines.map((line) => <li key={line}>{line.slice(2)}</li>)}
      </ul>
    );
  }

  return <p className="whitespace-pre-line text-base leading-7 text-neutral-700">{body}</p>;
}

export default async function AgeVerificationPage() {
  const content = (await api.getGenericPageContent("age-verification").catch(() => null)) as AgeVerificationContent | null;
  const page = content ?? DEFAULT_CONTENT;

  return (
    <article className="bg-white">
      <header className="border-b border-neutral-200 bg-neutral-100 px-4 py-5 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold text-[#111] sm:text-2xl">Age Verification</h1>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <h2 className="text-center text-[2.3rem] font-bold tracking-tight text-[#111]">
          {page.title}
        </h2>
        <p className="mt-3 text-base leading-6 text-[#111]">{page.intro}</p>
        <div className="mt-6 space-y-6">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="mb-2 text-[1.325rem] font-bold text-[#111]">{section.heading}</h3>
              <SectionBody body={section.body} />
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
