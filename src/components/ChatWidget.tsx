"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatResponse, OrderCard, TranscriptResponse } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* types + constants                                                    */
/* ------------------------------------------------------------------ */

type WidgetRole = "user" | "assistant" | "agent" | "system";

type WidgetMsg = {
  key: string;
  id: number | null;
  role: WidgetRole;
  content: string;
  at: number;
  orderCard?: OrderCard | null;
};

const TOKEN_KEY = "trevolk-session-token";
const GREETING =
  "Hi! I'm Trevolk's support assistant. I can look up order status, explain shipping and returns, or answer product questions — all from the store's live data. What can I check for you?";
const GREETING_CHIPS = ["Track my order", "Shipping times", "Returns & refunds", "Product questions"];

function getToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = `s_${crypto.randomUUID()}`;
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ */
/* small pieces                                                         */
/* ------------------------------------------------------------------ */

function BotAvatar() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pine-700 text-cream shadow-sm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3c1.8 3.2 1.8 6.8 0 10-1.8-3.2-1.8-6.8 0-10Zm-7 6c3.6.4 6.4 2.3 8 5.6-3.6-.4-6.4-2.3-8-5.6Zm14 0c-1.6 3.3-4.4 5.2-8 5.6 1.6-3.3 4.4-5.2 8-5.6ZM12 13v8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function AgentAvatar() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-honey-300 font-display text-[11px] font-bold text-pine-950 shadow-sm">
      M
    </span>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot inline-block size-1.5 rounded-full bg-ink-soft"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

const STEP_LABELS = ["Ordered", "Packed", "In transit", "Delivered"];
const STEP_PROGRESS: Record<OrderCard["status"], number> = {
  processing: 1,
  in_transit: 3,
  delivered: 4,
};

function OrderCardView({ card }: { card: OrderCard }) {
  const done = STEP_PROGRESS[card.status];
  return (
    <div className="mt-2 w-full rounded-lg border border-line bg-paper p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-xs font-semibold tracking-wide">{card.orderNumber}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            card.status === "delivered"
              ? "bg-pine-100 text-pine-800"
              : card.status === "in_transit"
                ? "bg-honey-100 text-honey-700"
                : "bg-line/60 text-ink-soft"
          }`}
        >
          {card.statusLabel}
        </span>
      </div>

      {/* stepper */}
      <div className="mt-3 flex items-center">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className={`flex items-center ${i > 0 ? "flex-1" : ""}`}>
            {i > 0 && (
              <span className={`h-px flex-1 ${i < done ? "bg-pine-500" : "bg-line"}`} />
            )}
            <span
              className={`mx-1 grid size-4 place-items-center rounded-full text-[8px] font-bold ${
                i < done ? "bg-pine-600 text-cream" : "border border-line bg-cream text-ink-soft"
              }`}
            >
              {i < done ? "✓" : ""}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-ink-soft">
        <span>Ordered</span>
        <span>Packed</span>
        <span>In transit</span>
        <span>Delivered</span>
      </div>

      <dl className="mt-3 space-y-1 text-[11px]">
        {card.carrier && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Carrier</dt>
            <dd className="text-right font-medium">{card.carrier}</dd>
          </div>
        )}
        {card.tracking && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Tracking</dt>
            <dd className="text-right font-medium tracking-wide">{card.tracking}</dd>
          </div>
        )}
        {card.eta && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">{card.status === "delivered" ? "Delivered" : "Expected"}</dt>
            <dd className="text-right font-medium">{card.eta}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-ink-soft">Items</dt>
          <dd className="text-right font-medium">
            {card.items.map((it) => `${it.name} ×${it.qty}`).join(", ")}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-line pt-1.5">
          <dt className="text-ink-soft">Total</dt>
          <dd className="font-display font-semibold">{card.total}</dd>
        </div>
      </dl>
    </div>
  );
}

function HandoffBanner({ content }: { content: string }) {
  return (
    <div className="animate-msg-in mx-auto my-2 w-full rounded-lg border border-honey-200 bg-honey-50 px-3.5 py-3 text-center">
      <span className="mx-auto mb-1.5 grid size-7 place-items-center rounded-full bg-honey-300/60 text-honey-700">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.8-3 3.4-5 7-5s6.2 2 7 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <p className="font-display text-xs font-semibold text-honey-700">Human handoff</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-honey-700/90">{content}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the widget                                                           */
/* ------------------------------------------------------------------ */

export default function ChatWidget() {
  const [token, setToken] = useState(getToken);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [escalationRef, setEscalationRef] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [teaser, setTeaser] = useState(false);
  const [unread, setUnread] = useState(0);

  const sendingRef = useRef(false);
  const restoredRef = useRef(false);
  const openRef = useRef(false);
  const lastFailedRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef(0);

  const nextKey = () => `m_${++keyRef.current}_${Date.now()}`;

  const append = useCallback((msg: Omit<WidgetMsg, "key">) => {
    setMessages((prev) => {
      if (msg.id !== null && prev.some((p) => p.id === msg.id)) {
        return prev;
      }
      const last = prev[prev.length - 1];
      if (last && last.role === msg.role && last.content === msg.content) {
        return prev;
      }
      const key = msg.id != null ? `msg_${msg.id}` : nextKey();
      return [...prev, { ...msg, key }];
    });
  }, []);

  const restore = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("restore failed");
      const data = (await res.json()) as TranscriptResponse;
      setEscalated(data.escalated);
      if (data.escalationRef) setEscalationRef(data.escalationRef);
      if (data.messages.length > 0) {
        const seenIds = new Set<number>();
        const uniqueMessages: WidgetMsg[] = [];
        for (const m of data.messages) {
          if (m.id !== null && seenIds.has(m.id)) continue;
          if (m.id !== null) seenIds.add(m.id);
          uniqueMessages.push({
            key: m.id != null ? `msg_${m.id}` : nextKey(),
            id: m.id,
            role: m.role,
            content: m.content,
            at: new Date(m.createdAt).getTime(),
            orderCard: m.orderCard ?? null,
          });
        }
        setMessages(uniqueMessages);
        setQuickReplies(["Track my order", "Shipping times", "Returns & refunds"]);
      } else {
        append({ id: null, role: "assistant", content: GREETING, at: Date.now() });
        setQuickReplies(GREETING_CHIPS);
      }
    } catch {
      append({ id: null, role: "assistant", content: GREETING, at: Date.now() });
      setQuickReplies(GREETING_CHIPS);
    }
  }, [token, append]);

  const openWidget = useCallback(() => {
    openRef.current = true;
    setOpen(true);
    setTeaser(false);
    setUnread(0);
    if (!restoredRef.current) {
      restoredRef.current = true;
      void restore();
    }
  }, [restore]);

  /* teaser bubble a moment after page load */
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!openRef.current) {
        setTeaser(true);
        setUnread(1);
      }
    }, 2600);
    return () => window.clearTimeout(t);
  }, []);

  /* external "open the chat" events (header button, demo guide, hero) */
  useEffect(() => {
    const handler = () => openWidget();
    window.addEventListener("trevolk:open", handler);
    return () => window.removeEventListener("trevolk:open", handler);
  }, [openWidget]);

  /* escape to close, autofocus input */
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* keep scrolled to the latest message */
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  /* poll for agent replies while the window is open */
  const pull = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(token)}`);
      if (!res.ok) return;
      const data = (await res.json()) as TranscriptResponse;
      setEscalated(data.escalated);
      if (data.escalationRef) setEscalationRef(data.escalationRef);
      setMessages((prev) => {
        const knownIds = new Set(prev.map((m) => m.id).filter((x): x is number => x !== null));
        const additions: WidgetMsg[] = [];
        for (const m of data.messages) {
          if (m.role === "user") continue;
          if (m.id !== null && knownIds.has(m.id)) continue;
          const alreadyExists = prev.some(
            (p) => (m.id !== null && p.id === m.id) || (p.role === m.role && p.content === m.content),
          );
          if (!alreadyExists) {
            if (m.id !== null) knownIds.add(m.id);
            additions.push({
              key: m.id != null ? `msg_${m.id}` : nextKey(),
              id: m.id,
              role: m.role as WidgetRole,
              content: m.content,
              at: new Date(m.createdAt).getTime(),
              orderCard: m.orderCard ?? null,
            });
          }
        }
        return additions.length === 0 ? prev : [...prev, ...additions];
      });
    } catch {
      /* silent — polling must never disturb the customer */
    }
  }, [token]);

  /* smart poll for agent replies — pauses when tab hidden, slows to 10 s when idle */
  const [isVisible, setIsVisible] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    const bump = () => { lastActivityRef.current = Date.now(); setIsIdle(false); };
    window.addEventListener("mousemove", bump, { passive: true });
    window.addEventListener("keydown", bump, { passive: true });
    window.addEventListener("touchstart", bump, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("touchstart", bump);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > 30_000) setIsIdle(true);
    }, 5_000);
    return () => window.clearInterval(id);
  }, [isVisible]);

  const pollMs = isIdle ? 10_000 : 4_000;
  useEffect(() => {
    if (!open || !isVisible) return;
    void pull();
    const t = window.setInterval(() => void pull(), pollMs);
    return () => window.clearInterval(t);
  }, [open, isVisible, pollMs, pull]);

  /* the actual request; separated so Retry can re-run without duplicating */
  const request = useCallback(
    async (text: string, appendUser: boolean) => {
      if (sendingRef.current || isSubmitting) return;
      sendingRef.current = true;
      setIsSubmitting(true);
      setErrorText(null);
      setQuickReplies([]);
      if (appendUser) append({ id: null, role: "user", content: text, at: Date.now() });
      setTyping(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, sessionId: token }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ChatResponse;
        append({
          id: null,
          role: "assistant",
          content: data.response,
          at: Date.now(),
          orderCard: data.orderCard ?? null,
        });
        if (data.handoffJustHappened) {
          setEscalated(true);
          if (data.escalationRef) setEscalationRef(data.escalationRef);
          append({
            id: null,
            role: "system",
            content: `A human specialist has joined (reference ${data.escalationRef ?? ""}). Everything you type now goes to the care team.`,
            at: Date.now(),
          });
        } else if (data.escalated) {
          setEscalated(true);
        }
        setQuickReplies(data.quickReplies ?? []);
        lastFailedRef.current = null;
      } catch {
        setErrorText(
          "I couldn't reach the support service just now. Your message is still here — try again?",
        );
        lastFailedRef.current = text;
      } finally {
        setTyping(false);
        sendingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [append, token, isSubmitting],
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || sendingRef.current || isSubmitting) return;
      setInput("");
      void request(text, true);
    },
    [request, isSubmitting],
  );

  const retry = () => {
    if (sendingRef.current || isSubmitting || !lastFailedRef.current) return;
    void request(lastFailedRef.current, false);
  };

  /* start a fresh conversation: rotate the browser token so the backend
     creates a new session, then reset all widget state */
  const startNewConversation = useCallback(() => {
    if (sendingRef.current || isSubmitting) return;
    if (
      escalated &&
      !window.confirm(
        "A human specialist is handling this conversation. Start a new conversation anyway?",
      )
    ) {
      return;
    }
    const fresh = `s_${crypto.randomUUID()}`;
    window.localStorage.setItem(TOKEN_KEY, fresh);
    setToken(fresh);
    setMessages([]);
    setEscalated(false);
    setEscalationRef(null);
    setQuickReplies(GREETING_CHIPS);
    setInput("");
    setErrorText(null);
    setTyping(false);
    setUnread(0);
    lastFailedRef.current = null;
    append({ id: null, role: "assistant", content: GREETING, at: Date.now() });
    inputRef.current?.focus();
  }, [escalated, isSubmitting, append]);

  /* -------------------------------------------------------------- */
  /* render                                                          */
  /* -------------------------------------------------------------- */

  return (
    <>
      {/* chat window */}
      {open && (
        <section
          aria-label="Trevolk support chat"
          className="animate-window-in fixed inset-0 z-50 flex sm:inset-auto sm:right-5 sm:bottom-[92px] sm:h-[min(640px,calc(100dvh-120px))] sm:w-[396px]"
        >
          <div className="flex h-full w-full flex-col overflow-hidden border border-line bg-paper shadow-[0_24px_60px_-16px_rgba(20,46,35,0.35)] sm:rounded-xl">
            {/* header */}
            <header className="bg-pine-900 px-4 py-3.5 text-cream">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <BotAvatar />
                  <AgentAvatar />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold leading-tight">Trevolk Care</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-pine-200">
                    <span
                      className={`inline-block size-1.5 rounded-full ${
                        escalated ? "bg-honey-300" : "bg-pine-300"
                      } animate-soft-pulse`}
                    />
                    {escalated
                      ? `Human specialist active${escalationRef ? ` · ${escalationRef}` : ""}`
                      : "Online — typically replies in seconds"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startNewConversation}
                  disabled={isSubmitting || typing}
                  aria-label="Start new conversation"
                  title="Start new conversation"
                  className="grid size-8 place-items-center rounded-lg text-pine-200 transition hover:bg-pine-800 hover:text-cream disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Minimize chat"
                  className="grid size-8 place-items-center rounded-lg text-pine-200 transition hover:bg-pine-800 hover:text-cream"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </header>

            {/* persistent escalation strip */}
            {escalated && (
              <div className="flex items-center gap-2 border-b border-honey-200 bg-honey-50 px-4 py-2 text-[11px] text-honey-700">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                A human specialist can see this whole conversation and will reply here.
              </div>
            )}

            {/* messages */}
            <div
              ref={listRef}
              aria-live="polite"
              className="chat-scroll flex-1 space-y-2 overflow-y-auto px-3.5 py-4"
            >
              <div className="flex justify-center">
                <span className="rounded-full border border-line bg-cream px-2.5 py-0.5 text-[10px] font-medium text-ink-soft">
                  Today
                </span>
              </div>

              {messages.map((m, i) => {
                const next = messages[i + 1];
                const lastOfGroup = !next || next.role !== m.role;
                if (m.role === "system") return <HandoffBanner key={m.key} content={m.content} />;

                if (m.role === "user") {
                  return (
                    <div key={m.key} className="animate-msg-in flex justify-end">
                      <div className="max-w-[82%]">
                        <div className="whitespace-pre-line rounded-xl rounded-br-sm bg-pine-700 px-3.5 py-2.5 text-[13px] leading-relaxed text-cream">
                          {m.content}
                        </div>
                        <p className="mt-1 text-right text-[10px] text-ink-soft">{formatTime(m.at)}</p>
                      </div>
                    </div>
                  );
                }

                const isAgent = m.role === "agent";
                return (
                  <div key={m.key} className="animate-msg-in flex items-end gap-2">
                    {lastOfGroup ? (isAgent ? <AgentAvatar /> : <BotAvatar />) : <span className="w-7" />}
                    <div className="max-w-[82%]">
                      {isAgent && lastOfGroup && (
                        <p className="mb-0.5 ml-1 text-[10px] font-semibold text-honey-600">
                          Maya · Care Team
                        </p>
                      )}
                      <div
                        className={`whitespace-pre-line rounded-xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-relaxed ${
                          isAgent
                            ? "border border-honey-200 bg-honey-50 text-ink"
                            : "border border-line bg-cream text-ink"
                        }`}
                      >
                        {m.content}
                        {m.orderCard && <OrderCardView card={m.orderCard} />}
                      </div>
                      {lastOfGroup && (
                        <p className="mt-1 ml-1 text-[10px] text-ink-soft">{formatTime(m.at)}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {typing && (
                <div className="animate-msg-in flex items-end gap-2">
                  <BotAvatar />
                  <div className="rounded-xl rounded-bl-sm border border-line bg-cream px-3.5 py-3">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>

            {/* quick replies */}
            {quickReplies.length > 0 && !typing && (
              <div className="flex flex-wrap gap-1.5 px-3.5 pb-2">
                {quickReplies.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={isSubmitting || typing}
                    onClick={() => {
                      if (isSubmitting || sendingRef.current) return;
                      send(chip);
                    }}
                    className="rounded-full border border-pine-200 bg-cream px-3 py-1.5 text-[11px] font-semibold text-pine-800 transition hover:border-pine-400 hover:bg-pine-50 disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* error strip */}
            {errorText && (
              <div className="mx-3.5 mb-2 flex items-center gap-2 rounded-lg border border-rust-500/30 bg-rust-50 px-3 py-2 text-[11px] text-rust-600">
                <span className="flex-1">{errorText}</span>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={retry}
                  className="rounded-md bg-rust-500 px-2.5 py-1 font-bold text-cream transition hover:bg-rust-600 disabled:opacity-50"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => setErrorText(null)}
                  aria-label="Dismiss error"
                  className="font-bold opacity-60 transition hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            )}

            {/* composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isSubmitting || sendingRef.current || !input.trim()) return;
                send(input);
              }}
              className="border-t border-line bg-cream p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={1500}
                  placeholder={
                    escalated ? "Write to the care team…" : "Ask about an order, shipping…"
                  }
                  aria-label="Type your message"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13px] text-ink placeholder:text-ink-soft/70 focus:border-pine-500 focus:ring-2 focus:ring-pine-500/25 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={typing || isSubmitting || !input.trim()}
                  aria-label="Send message"
                  className={`grid size-10 shrink-0 place-items-center rounded-lg text-cream transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    escalated ? "bg-honey-500 hover:bg-honey-600" : "bg-pine-700 hover:bg-pine-800"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 12 20 4l-3 8 3 8-16-8Zm4 0h12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <p className="mt-2 flex items-center justify-between text-[10px] text-ink-soft">
                <span className="font-semibold tracking-wide">Powered by Trevolk</span>
                <span>Answers come from live store data</span>
              </p>
            </form>
          </div>
        </section>
      )}

      {/* teaser bubble */}
      {teaser && !open && (
        <div className="animate-teaser-in fixed right-5 bottom-[92px] z-40 hidden max-w-[240px] sm:block">
          <div className="relative rounded-xl rounded-br-sm border border-line bg-cream px-4 py-3 shadow-lg">
            <button
              type="button"
              onClick={() => setTeaser(false)}
              aria-label="Dismiss"
              className="absolute -top-2 -left-2 grid size-5 place-items-center rounded-full border border-line bg-paper text-[10px] text-ink-soft hover:text-ink"
            >
              ✕
            </button>
            <p className="text-[12px] leading-snug text-ink">
              <span className="font-semibold">Questions about an order?</span> I can look it up in
              seconds — try <span className="font-semibold">#10240</span>.
            </p>
          </div>
        </div>
      )}

      {/* launcher */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openWidget())}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className={`group fixed right-5 bottom-5 z-50 grid size-14 place-items-center rounded-full text-cream shadow-[0_10px_30px_-8px_rgba(20,46,35,0.55)] transition-transform duration-200 hover:scale-105 active:scale-95 ${
          open ? "bg-pine-800" : "launcher-ring bg-pine-700"
        }`}
      >
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-honey-400 text-[10px] font-bold text-pine-950 ring-2 ring-paper">
            {unread}
          </span>
        )}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`absolute transition-all duration-200 ${open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
        >
          <path
            d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9.5" cy="12" r="1" fill="currentColor" />
          <circle cx="13.5" cy="12" r="1" fill="currentColor" />
        </svg>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`absolute transition-all duration-200 ${open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}
        >
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
