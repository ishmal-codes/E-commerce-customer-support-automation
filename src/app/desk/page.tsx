"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DeskResponse } from "@/lib/types";

type Selected = DeskResponse["sessions"][number] | null;

const DESK_SECRET_KEY = "trevolk-desk-secret";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}d ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DeskPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [data, setData] = useState<DeskResponse | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // Restore stored secret on mount
  useEffect(() => {
    const stored = window.localStorage.getItem(DESK_SECRET_KEY);
    if (stored) setSecret(stored);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const val = loginInput.trim();
    if (!val) return;
    window.localStorage.setItem(DESK_SECRET_KEY, val);
    setSecret(val);
    setLoginInput("");
    setLoginError(false);
  };

  const logout = () => {
    window.localStorage.removeItem(DESK_SECRET_KEY);
    setSecret(null);
    setData(null);
  };

  const authHeaders = useCallback(
    (extra?: Record<string, string>) => ({
      ...extra,
      "x-desk-secret": secret ?? "",
    }),
    [secret],
  );

  const load = useCallback(async () => {
    if (!secret) return;
    try {
      const res = await fetch("/api/desk", {
        cache: "no-store",
        headers: authHeaders(),
      });
      if (res.status === 401) { logout(); setLoginError(true); return; }
      if (!res.ok) return;
      const next = (await res.json()) as DeskResponse;
      setData(next);
      setSelectedId((cur) => {
        if (cur !== null && next.sessions.some((s) => s.sessionId === cur)) return cur;
        const openOne = next.sessions.find((s) => s.escalated && s.escalationStatus === "open");
        return openOne ? openOne.sessionId : (next.sessions[0]?.sessionId ?? null);
      });
    } catch {
      /* keep showing stale data */
    }
  }, [secret, authHeaders]);

  // Smart polling — pauses when tab hidden, slows to 10 s when idle
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

  const pollMs = isIdle ? 10_000 : 3_000;
  useEffect(() => {
    if (!isVisible) return;
    void load();
    const t = window.setInterval(() => void load(), pollMs);
    return () => window.clearInterval(t);
  }, [load, isVisible, pollMs]);

  const selected: Selected =
    data?.sessions.find((s) => s.sessionId === selectedId) ?? null;

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selected?.messages.length, selectedId]);

  const sendReply = async () => {
    const text = draft.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/desk/reply", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ sessionId: selected.sessionId, message: text }),
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error("reply failed");
      setDraft("");
      await load();
    } catch {
      setNotice("Could not send the reply — try again.");
      window.setTimeout(() => setNotice(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const resolve = async () => {
    if (!selected) return;
    try {
      const res = await fetch("/api/desk/resolve", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ sessionId: selected.sessionId }),
      });
      if (res.status === 401) { logout(); return; }
      await load();
    } catch {
      setNotice("Could not resolve — try again.");
      window.setTimeout(() => setNotice(null), 3000);
    }
  };

  const canReply = selected?.escalated && selected.escalationStatus === "open";

  // ── Login gate ──────────────────────────────────────────────────────────
  if (!secret) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-pine-950 text-pine-100">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-pine-800 bg-pine-900/40 p-8 shadow-xl"
        >
          <div className="mb-6 text-center">
            <span className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-pine-700 text-cream">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <p className="font-display text-lg font-bold text-cream">Trevolk Desk</p>
            <p className="mt-1 text-xs text-pine-300">Enter the desk password to continue</p>
          </div>
          <input
            type="password"
            value={loginInput}
            onChange={(e) => { setLoginInput(e.target.value); setLoginError(false); }}
            placeholder="Desk password"
            autoFocus
            className="mb-3 w-full rounded-lg border border-pine-700 bg-pine-900/60 px-4 py-3 text-sm text-cream placeholder:text-pine-400 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/25 focus:outline-none"
          />
          {loginError && (
            <p className="mb-3 text-xs text-rust-500">Wrong password — try again.</p>
          )}
          <button
            type="submit"
            disabled={!loginInput.trim()}
            className="w-full rounded-lg bg-honey-400 py-3 text-sm font-bold text-pine-950 transition hover:bg-honey-300 disabled:opacity-40"
          >
            Unlock desk
          </button>
          <p className="mt-4 text-center">
            <Link href="/" className="text-xs text-pine-400 transition hover:text-pine-200">
              ← Back to storefront
            </Link>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-pine-950 text-pine-100">
      {/* top bar */}
      <header className="border-b border-pine-800 bg-pine-900/60 px-5 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-pine-700 text-cream">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 13h4l2-6 3 10 2.5-4H20"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="font-display text-sm font-bold text-cream">Trevolk Desk</p>
              <p className="text-[10px] text-pine-300">Agent console · demo environment</p>
            </div>
          </div>
          <span className="ml-2 flex items-center gap-1.5 rounded-full bg-pine-800 px-2.5 py-1 text-[10px] font-bold text-pine-200">
            <span className="size-1.5 animate-soft-pulse rounded-full bg-pine-300" /> LIVE
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[11px] text-pine-300 sm:block">
              Replying as <span className="font-bold text-honey-300">Maya · Care Team</span>
            </span>
            <Link
              href="/"
              className="rounded-lg border border-pine-700 px-3 py-1.5 text-xs font-semibold text-pine-100 transition hover:bg-pine-800"
            >
              Open storefront ↗
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-pine-700 px-3 py-1.5 text-xs font-semibold text-pine-300 transition hover:border-pine-500 hover:text-cream"
              title="Lock the desk"
            >
              🔒 Lock
            </button>
          </div>
        </div>
      </header>

      {/* KPI row */}
      <div className="border-b border-pine-800 px-5 py-3">
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-3">
          {[
            { label: "Conversations", value: data?.stats.totalConversations ?? 0 },
            { label: "Open escalations", value: data?.stats.openEscalations ?? 0, hot: true },
            { label: "Resolved", value: data?.stats.resolved ?? 0 },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border border-pine-800 bg-pine-900/40 px-4 py-2.5">
              <p className="text-[10px] font-semibold tracking-wide text-pine-300 uppercase">
                {k.label}
              </p>
              <p className={`font-display text-xl font-bold ${k.hot && (data?.stats.openEscalations ?? 0) > 0 ? "text-honey-300" : "text-cream"}`}>
                {k.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-4 lg:grid-cols-[320px_1fr]">
        {/* queue */}
        <aside className="flex min-h-[200px] flex-col overflow-hidden rounded-xl border border-pine-800 bg-pine-900/30">
          <p className="border-b border-pine-800 px-4 py-3 text-[11px] font-bold tracking-wide text-pine-300 uppercase">
            Conversations
          </p>
          <div className="chat-scroll flex-1 space-y-2 overflow-y-auto p-3">
            {!data && <p className="px-2 py-4 text-xs text-pine-300">Loading queue…</p>}
            {data && data.sessions.length === 0 && (
              <div className="px-3 py-6 text-xs leading-relaxed text-pine-300">
                No conversations yet. Open the storefront and chat with the assistant — escalated
                ones land here with full context.
              </div>
            )}
            {data?.sessions.map((s) => {
              const last = s.messages.at(-1);
              const isSel = s.sessionId === selectedId;
              return (
                <button
                  key={s.sessionId}
                  type="button"
                  onClick={() => setSelectedId(s.sessionId)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                    isSel
                      ? "border-pine-500 bg-pine-800/70"
                      : "border-pine-800 bg-pine-900/40 hover:border-pine-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-cream">
                      {s.escalationRef ?? `Chat #${s.sessionId}`}
                    </span>
                    <span className="text-[10px] text-pine-300">{timeAgo(s.lastMessageAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {s.escalated ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          s.escalationStatus === "open"
                            ? "bg-honey-300 text-pine-950"
                            : "bg-pine-700 text-pine-100"
                        }`}
                      >
                        {s.escalationStatus === "open" ? "OPEN" : "RESOLVED"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-pine-800 px-1.5 py-0.5 text-[9px] font-bold text-pine-300">
                        BOT ONLY
                      </span>
                    )}
                    <span className="truncate text-[10px] text-pine-300">
                      {last ? `${last.role === "user" ? "Customer" : last.role === "agent" ? "You" : "Bot"}: ${last.content}` : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* transcript */}
        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-pine-800 bg-pine-900/30">
          {!selected ? (
            <div className="grid flex-1 place-items-center p-8">
              <div className="max-w-sm text-center">
                <p className="font-display text-sm font-bold text-cream">No conversation selected</p>
                <p className="mt-2 text-xs leading-relaxed text-pine-300">
                  Trigger a handoff from the storefront (say “talk to a human” or ask something the
                  bot doesn&apos;t know twice) and it will appear here instantly.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-pine-800 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-cream">
                    {selected.escalationRef ?? `Chat #${selected.sessionId}`}
                  </p>
                  <p className="truncate text-[11px] text-pine-300">
                    {selected.escalationReason ?? "Started with the assistant — not escalated."}
                  </p>
                </div>
                {selected.escalated && selected.escalationStatus === "open" && (
                  <button
                    type="button"
                    onClick={() => void resolve()}
                    className="rounded-lg bg-pine-600 px-3.5 py-2 text-xs font-bold text-cream transition hover:bg-pine-500"
                  >
                    Mark resolved
                  </button>
                )}
                {selected.escalated && selected.escalationStatus === "resolved" && (
                  <span className="rounded-full bg-pine-700 px-2.5 py-1 text-[10px] font-bold text-pine-100">
                    RESOLVED
                  </span>
                )}
              </div>

              <div className="chat-scroll flex-1 space-y-2.5 overflow-y-auto p-4">
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                        m.role === "user"
                          ? "rounded-bl-sm bg-pine-800 text-pine-50"
                          : m.role === "agent"
                            ? "rounded-br-sm bg-honey-300 text-pine-950"
                            : "rounded-br-sm border border-pine-700 bg-pine-900/60 text-pine-100"
                      }`}
                    >
                      <p className="mb-0.5 text-[9px] font-bold tracking-wide uppercase opacity-60">
                        {m.role === "user" ? "Customer" : m.role === "agent" ? "Maya (you)" : "Assistant"}
                        {" · "}
                        {formatClock(m.createdAt)}
                      </p>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={listEndRef} />
              </div>

              <div className="border-t border-pine-800 p-3">
                {notice && (
                  <p className="mb-2 rounded-lg bg-rust-500/15 px-3 py-1.5 text-[11px] text-rust-500">
                    {notice}
                  </p>
                )}
                {canReply ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void sendReply();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Reply as Maya — appears in the customer's widget within seconds…"
                      aria-label="Reply to customer"
                      className="min-w-0 flex-1 rounded-lg border border-pine-700 bg-pine-900/60 px-3.5 py-2.5 text-[13px] text-cream placeholder:text-pine-400 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/25 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="rounded-lg bg-honey-400 px-4 py-2.5 text-xs font-bold text-pine-950 transition hover:bg-honey-300 disabled:opacity-40"
                    >
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </form>
                ) : (
                  <p className="px-1 text-[11px] text-pine-400">
                    {selected.escalated
                      ? "This escalation is resolved — the assistant handles new messages again."
                      : "This conversation is still handled by the assistant. It will appear here the moment the customer asks for a human."}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
