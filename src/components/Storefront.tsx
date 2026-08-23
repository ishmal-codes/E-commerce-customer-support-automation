"use client";

import { useState } from "react";
import { PRODUCTS } from "@/lib/catalog";

function openChat() {
  window.dispatchEvent(new CustomEvent("trevolk:open"));
}

function formatPrice(n: number) {
  return `$${n.toFixed(0)}`;
}

 const getImage = (id: string, fallback?: string) => {
  const cleanId = (id || '').toLowerCase();
  
  if (cleanId.includes('candle') || cleanId === '1') 
    return "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80&v=3";
    
  if (cleanId.includes('throw') || cleanId.includes('linen') || cleanId === '2') 
    return "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80&v=3";
    
  if (cleanId.includes('mug') || cleanId === '3') 
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80&v=3";
    
  if (cleanId.includes('board') || cleanId === '4') 
    return "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80&v=3";
    
  return fallback || "";
};

const DEMO_PROMPTS = [
  { q: "Where is my order TV-1042?", note: "live order lookup" },
  { q: "How long does shipping take?", note: "policy answer" },
  { q: "How do I care for the linen throw?", note: "product data" },
  { q: "Do you restock the throw in charcoal?", note: "honest fallback" },
  { q: "Talk to a human", note: "live handoff → then open /desk" },
];

export default function Storefront() {
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);

  const addToCart = (id: string) => {
    setCartCount((c) => c + 1);
    setAddedId(id);
    window.setTimeout(() => setAddedId((cur) => (cur === id ? null : cur)), 1400);
  };

  return (
    <div className="min-h-dvh">
      {/* announcement bar */}
      <div className="bg-pine-900 px-4 py-2 text-center text-[11px] font-medium tracking-wide text-pine-100">
        Free standard shipping over $75 · 30-day returns · Support answers in seconds
      </div>

      {/* header */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
          <a href="#" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-pine-700 text-cream">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3c1.8 3.2 1.8 6.8 0 10-1.8-3.2-1.8-6.8 0-10Zm-7 6c3.6.4 6.4 2.3 8 5.6-3.6-.4-6.4-2.3-8-5.6Zm14 0c-1.6 3.3-4.4 5.2-8 5.6 1.6-3.3 4.4-5.2 8-5.6Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="font-display text-lg font-bold tracking-tight">Aurel Home</span>
          </a>
          <nav className="hidden items-center gap-5 text-sm font-medium text-ink-soft md:flex">
            <a href="#shop" className="transition hover:text-ink">Shop</a>
            <a href="#shop" className="transition hover:text-ink">Collections</a>
            <a href="#values" className="transition hover:text-ink">Our promise</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={openChat}
              className="hidden items-center gap-1.5 rounded-full border border-pine-200 bg-cream px-3.5 py-2 text-xs font-semibold text-pine-800 transition hover:border-pine-400 hover:bg-pine-50 sm:flex"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Need help?
            </button>
            <button
              type="button"
              aria-label={`Cart, ${cartCount} items`}
              className="relative grid size-10 place-items-center rounded-full border border-line bg-cream text-ink transition hover:border-pine-300"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-pine-700 text-[10px] font-bold text-cream">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-12 pb-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-honey-200 bg-honey-50 px-3 py-1 text-[11px] font-bold tracking-wide text-honey-700">
            NEW BATCH · POURED 4 JUNE
          </p>
          <h1 className="font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">
            Objects for slower living.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Small-batch home goods — poured, woven and turned by hand. Made to be used daily and
            kept for years, with support that actually answers.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#shop"
              className="rounded-lg bg-pine-700 px-5 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-pine-800"
            >
              Shop the collection
            </a>
            <button
              type="button"
              onClick={openChat}
              className="rounded-lg border border-line bg-cream px-5 py-3 text-sm font-semibold text-ink transition hover:border-pine-300 hover:bg-pine-50"
            >
              Ask about an order →
            </button>
          </div>
          <p className="mt-4 text-xs text-ink-soft">
            Order tracking, returns and product questions — answered by the assistant in the corner,
            with a human one click away.
          </p>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-line shadow-[0_20px_50px_-20px_rgba(20,46,35,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80"
              alt="Styled shelf with Aurel Home candles, linen throw and stoneware"
              className="aspect-[4/3] w-full object-cover"
              loading="eager"
            />
          </div>
          <div className="absolute -bottom-4 -left-3 hidden rounded-lg border border-line bg-cream px-4 py-3 shadow-lg sm:block">
            <p className="text-[11px] font-semibold text-ink-soft">Average support reply</p>
            <p className="font-display text-xl font-bold text-pine-700">&lt; 3 seconds</p>
          </div>
        </div>
      </section>

      {/* products */}
      <section id="shop" className="border-t border-line bg-cream/60 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">The collection</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Four pieces. Ask the assistant about any of them.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-line bg-cream transition-shadow hover:shadow-[0_16px_40px_-18px_rgba(20,46,35,0.35)]"
              >
                <div className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                   src={getImage(p.name || p.id, p.image)}
                    alt={p.name}
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {p.tag && (
                    <span className="absolute top-3 left-3 rounded-full bg-pine-900/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-cream">
                      {p.tag.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-sm font-semibold">{p.name}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-soft">{p.blurb}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display text-base font-bold">{formatPrice(p.price)}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(p.id)}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                        addedId === p.id
                          ? "bg-pine-100 text-pine-800"
                          : "bg-pine-700 text-cream hover:bg-pine-800"
                      }`}
                    >
                      {addedId === p.id ? "Added ✓" : "Add to cart"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* values */}
      <section id="values" className="border-t border-line py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
          {[
            {
              title: "Free shipping over $75",
              body: "3–5 business days standard, express in 1–2. Out the same day before 3pm CET.",
            },
            {
              title: "30-day returns",
              body: "Free return labels, refunds in 3–5 business days. Start one right in the chat.",
            },
            {
              title: "Support that answers",
              body: "Order answers in seconds from live store data — and a human specialist whenever you want one.",
            },
          ].map((v) => (
            <div key={v.title} className="rounded-xl border border-line bg-cream p-5">
              <p className="font-display text-sm font-bold text-pine-800">{v.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-line bg-pine-950 py-10 text-pine-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-sm font-bold text-cream">Aurel Home</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-pine-300">
              A demo storefront for the Trevolk support automation. Order data is sample data —
              try TV-1042, TV-1051 or TV-1038 in the chat.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a href="/desk" className="rounded-lg border border-pine-700 px-3.5 py-2 font-semibold text-pine-100 transition hover:bg-pine-900">
              Agent console (/desk) →
            </a>
          </div>
        </div>
      </footer>

      {/* demo guide */}
      {guideOpen && (
        <aside className="fixed bottom-5 left-5 z-40 hidden w-[264px] md:block">
          <div className="rounded-xl border border-line bg-cream/95 p-4 shadow-[0_16px_44px_-18px_rgba(20,46,35,0.4)] backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-xs font-bold tracking-wide text-pine-800">
                DEMO GUIDE — TRY THESE
              </p>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label="Dismiss demo guide"
                className="text-xs text-ink-soft transition hover:text-ink"
              >
                ✕
              </button>
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {DEMO_PROMPTS.map((d) => (
                <li key={d.q}>
                  <button
                    type="button"
                    onClick={openChat}
                    className="group w-full rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-line hover:bg-paper"
                  >
                    <span className="block text-[11.5px] font-semibold text-ink">“{d.q}”</span>
                    <span className="block text-[10px] text-ink-soft">{d.note}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 border-t border-line pt-2 text-[10px] leading-relaxed text-ink-soft">
              After triggering a handoff, open{" "}
              <a href="/desk" className="font-bold text-pine-700 underline underline-offset-2">
                the agent console
              </a>{" "}
              in another tab and reply — the customer sees it live.
            </p>
          </div>
        </aside>
      )}
      {!guideOpen && (
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="fixed bottom-5 left-5 z-40 hidden rounded-full border border-line bg-cream px-4 py-2 text-xs font-semibold text-ink-soft shadow-md transition hover:text-ink md:block"
        >
          Show demo guide
        </button>
      )}
    </div>
  );
}
