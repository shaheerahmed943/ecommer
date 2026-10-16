"use client";

import { FormEvent, useState } from "react";

interface BlackFridaySection {
  heading: string;
  body: string;
}

export default function BlackFridayPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: BlackFridaySection[];
}) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  }

  return (
    <main>
      <section className="border-t-2 border-[#00a651] bg-[radial-gradient(circle_at_center,_#4b111b_0%,_#18090d_72%)] px-4 py-12 text-white sm:py-14">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <div className="mx-auto mt-5 max-w-md rounded-sm bg-white/15 p-3">
            <p className="mb-2 text-[11px] font-semibold">Subscribe to our newsletter</p>
            <form onSubmit={handleSubmit} className="flex gap-1.5">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                className="min-w-0 flex-1 rounded-sm px-2 py-2 text-[10px] text-neutral-900 outline-none"
                aria-label="Email address"
              />
              <button type="submit" className="site-action px-3 py-2">
                Subscribe
              </button>
            </form>
            {subscribed && <p className="mt-2 text-[10px] text-[#c5dc3b]">Thanks — you are subscribed.</p>}
          </div>
          <p className="sr-only">{intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <h2 className="mb-6 text-xl font-semibold text-[#0A2540]">Frequently Asked Questions.</h2>
        <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
          {sections.map((section, index) => (
            <details key={`${section.heading}-${index}`} className="group border-b border-neutral-300 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-medium text-[#111] [&::-webkit-details-marker]:hidden">
                <span>{section.heading}</span>
                <span className="text-sm transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="whitespace-pre-line pt-3 text-[10px] leading-4 text-neutral-600">{section.body}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
