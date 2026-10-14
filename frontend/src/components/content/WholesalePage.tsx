import PageHero from "@/components/layout/PageHero";

export default function WholesalePage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <main>
      <PageHero title={title} />
      <div className="mx-auto max-w-7xl px-8 py-9 sm:px-12 sm:py-10">
        <p className="text-sm text-[#111]">{intro}</p>
        <div className="mt-4 space-y-8">
          {sections.map((section, index) => (
            <section key={`${section.heading}-${index}`}>
              <h2 className="text-2xl font-semibold leading-tight text-[#111] sm:text-3xl">
                {section.heading}
              </h2>
              {section.body && (
                <p className="mt-8 whitespace-pre-line text-sm leading-7 text-[#111]">
                  {section.body}
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
