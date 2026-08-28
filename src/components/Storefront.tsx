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
  const cleanId = (id || "").toLowerCase();

  if (cleanId.includes("airpods-pro"))
    return "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80";

  if (cleanId.includes("airpods"))
    return "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80";

  if (cleanId.includes("case") || cleanId.includes("magsafe"))
    return "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80";

  if (cleanId.includes("charger") || cleanId.includes("adapter") || cleanId.includes("cable") || cleanId.includes("lightning"))
    return "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80";

  if (cleanId.includes("iphone"))
    return "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80";

  return fallback || "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80";
};

const DEMO_PROMPTS = [
  { q: "Where is my order #10240?", note: "live order lookup" },
  { q: "How long does shipping take?", note: "policy answer" },
  { q: "What are the specs of the iPhone 15 Pro?", note: "product data" },
  { q: "Can I return my iPhone after activating it?", note: "FAQ answer" },
  { q: "Talk to a human", note: "live handoff \u2192 then open /desk" },
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
        Free standard shipping over $500 · 14-day returns · AI support answers in seconds
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
            <span className="font-display text-lg font-bold tracking-tight">Trevolk</span>
          </a>
          <nav className="hidden items-center gap-5 text-sm font-medium text-ink-soft md:flex">
            <a href="#shop" className="transition hover:text-ink">iPhones</a>
            <a href="#shop" className="transition hover:text-ink">Accessories</a>
            <a href="#values" className="transition hover:text-ink">Why Trevolk</a>
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
            AUTHORIZED APPLE RESELLER
          </p>
          <h1 className="font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">
            The latest iPhones &amp; Apple accessories.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Genuine Apple products with real-time order tracking, shipping updates and instant answers
            to your product questions — all powered by AI support.
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
              src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=80"
              alt="iPhone with wireless earbuds on a wooden surface against a deep green background"
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
              <h2 className="font-display text-2xl font-bold tracking-tight">Shop iPhones &amp; accessories</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Browse the full Apple catalog. Ask the assistant about any product.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              title: "Free standard shipping over $500",
              body: "Domestic standard $9.99 (3–5 days), express $19.99 (1–2 days). Orders processed within 1–2 business days.",
            },
            {
              title: "14-day returns",
              body: "Return within 14 calendar days in original condition. Refunds issued within 5–7 business days after inspection.",
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
            <p className="font-display text-sm font-bold text-cream">Trevolk</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-pine-300">
              A demo Apple storefront for the Trevolk support automation. Order data is sample —
              try #10234, #10240 or #10246 in the chat.
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
