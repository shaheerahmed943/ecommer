import Link from "next/link";

export default function PageHero({ title }: { title: string }) {
  return (
    <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#0A2540]">
          <Link href="/" className="underline-offset-2 hover:underline">Home</Link>
          <span aria-hidden="true">›</span>
          <span>{title}</span>
        </nav>
        <h1 className="mt-4 text-2xl font-semibold text-[#111] sm:text-3xl">{title}</h1>
      </div>
    </section>
  );
}
