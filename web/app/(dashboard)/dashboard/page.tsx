// arxify.io — Dashboard
// Admin view: workspace with hypotheses + data sources + chat
// Waitlist view: queue position + referral

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale, LocaleSwitcher } from "@/lib/locale";
import { pickField, getDict } from "@/lib/i18n";

type T = ReturnType<typeof getDict>;
type Loc = "zh" | "en" | "ja" | "es";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const LAUNCH_TARGET = 100;

type Status = {
  email: string;
  position: number;
  total: number;
  referred_count: number;
  context: string | null;
  source: string | null;
  created_at: string;
};

type Hypothesis = {
  id: number;
  code: string;
  title: string;
  paradox: string;
  hypothesis: string;
  identification: string;
  theory_anchor: string;
  journal_target: string;
  feasibility_6mo: number;
  ab_test_difficulty: number;
  status: string;
  notes: string | null;
  content_zh?: Record<string, string> | null;
  content_en?: Record<string, string> | null;
  has_proposal?: boolean;
};

type DataSource = {
  id: number;
  name: string;
  kind: string;
  description: string | null;
  stats: string | null;
  notes: string | null;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  created_at: string;
};

type WorkspaceFull = {
  workspace: { id: number; title: string; description: string | null };
  hypotheses: Hypothesis[];
  data_sources: DataSource[];
  chat: ChatMessage[];
};

export default function DashboardPage() {
  const { t, locale } = useLocale();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceFull | null>(null);
  const [tab, setTab] = useState<"chat" | "hypotheses" | "data" | "queue">("hypotheses");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Capture token + initial tab from URL or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const urlToken = url.searchParams.get("token");
    const urlTab = url.searchParams.get("tab");
    if (urlToken) {
      localStorage.setItem("arxify_token", urlToken);
      // keep tab in URL if present
      const path = urlTab ? `/dashboard?tab=${urlTab}` : "/dashboard";
      window.history.replaceState({}, "", path);
    }
    if (urlTab && ["chat", "hypotheses", "data", "queue"].includes(urlTab)) {
      setTab(urlTab as any);
    }
    const t = localStorage.getItem("arxify_token");
    setToken(t);
  }, []);

  // Load status + workspace
  useEffect(() => {
    if (!token) {
      if (token === null) return; // not yet captured
      setLoading(false);
      return;
    }
    let alive = true;
    // honor ?tab= override; otherwise default to chat (or queue when no workspace)
    const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
    const urlTab = url?.searchParams.get("tab");
    Promise.all([
      fetch(`${API_URL}/api/waitlist/status?token=${encodeURIComponent(token)}`),
      fetch(`${API_URL}/api/workspace/me?token=${encodeURIComponent(token)}`),
    ])
      .then(async ([s, w]) => {
        if (!alive) return;
        if (s.ok) setStatus(await s.json());
        if (w.ok) {
          setWorkspace(await w.json());
          if (!urlTab) setTab("hypotheses");
        } else {
          if (!urlTab) setTab("queue");
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [token]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center ">
        <p className="italic text-[#4b5263]">{t.loading}</p>
      </main>
    );
  }

  if (!token || !status) {
    return <NoToken />;
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#0e1117] ">
      <Header email={status.email} t={t} />

      <div className="max-w-6xl mx-auto px-6 py-6">
        {workspace ? (
          <>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-1 leading-tight">
              {workspace.workspace.title}
            </h1>
            {workspace.workspace.description && (
              <p className="text-[#4b5263] italic mb-6">{workspace.workspace.description}</p>
            )}

            <Tabs
              tab={tab}
              setTab={setTab}
              hasWs={true}
              hypCount={workspace.hypotheses.length}
              dsCount={workspace.data_sources.length}
              t={t}
            />

            {tab === "chat" && <ChatTab token={token} initial={workspace.chat} t={t} />}
            {tab === "hypotheses" && <HypothesesTab items={workspace.hypotheses} locale={locale} t={t} />}
            {tab === "data" && <DataTab items={workspace.data_sources} />}
            {tab === "queue" && <QueueTab status={status} t={t} />}
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              {t.dash_in_line_a}<span className="italic text-[#0a8060]">{status.position}</span>{t.dash_in_line_b}
            </h1>
            <QueueTab status={status} t={t} />
          </>
        )}
      </div>
    </main>
  );
}

// ───────────────────────────────────────────────────────────────────────

function Tabs({
  tab, setTab, hasWs, hypCount, dsCount, t,
}: {
  tab: string;
  setTab: (t: any) => void;
  hasWs: boolean;
  hypCount: number;
  dsCount: number;
  t: T;
}) {
  const tabs = hasWs
    ? [
        { id: "hypotheses", label: `${t.dash_tab_hyps} · ${hypCount}` },
        { id: "data", label: `${t.dash_tab_data} · ${dsCount}` },
        { id: "chat", label: t.dash_tab_advisor },
        { id: "queue", label: t.dash_tab_queue },
      ]
    : [{ id: "queue", label: t.dash_tab_queue }];
  return (
    <div className="mb-6">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap ${
              tab === t.id
                ? "bg-white text-[#0a8060] border border-[#c2e5d8] shadow-mercury"
                : "bg-transparent text-[#4b5263] border border-transparent hover:bg-white hover:border-[#e6e8ec]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────

function ChatTab({ token, initial, t }: { token: string; initial: ChatMessage[]; t: T }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/workspace/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, message: input }),
      });
      if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
      const d = await r.json();
      setMessages((m) => [...m, d.user_message, d.assistant_message]);
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center text-[#4b5263] italic mt-12">
            {t.dash_chat_empty}
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} t={t} />
        ))}
        {sending && (
          <Bubble msg={{ id: -1, role: "assistant", content: t.dash_chat_thinking, model: null, created_at: "" }} t={t} />
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="text-sm text-red-700 mb-2 px-3 py-2 bg-red-50 rounded">{error}</div>
      )}

      <div className="flex gap-2 border-t border-[#e6e8ec] pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder={t.dash_chat_placeholder}
          className="flex-1 px-4 py-3 border border-[#e6e8ec] rounded-lg focus:border-[#0a8060] focus:outline-none text-sm resize-none"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="bg-[#0e1117] text-[#ffffff] px-6 rounded-lg font-medium hover:bg-[#0a8060] disabled:opacity-40 transition"
        >
          {sending ? "..." : t.dash_chat_send}
        </button>
      </div>
    </div>
  );
}

function Bubble({ msg, t }: { msg: ChatMessage; t: T }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#0e1117] text-[#ffffff]"
            : "bg-white border border-[#e6e8ec]"
        }`}
      >
        {!isUser && (
          <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-1">
            {t.dash_chat_advisor_label}
          </div>
        )}
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  main: "bg-[#0a8060] text-white",
  shortlisted: "bg-[#ecf4f0] text-[#0a8060]",
  candidate: "bg-[#f3f4f7] text-[#4b5263]",
  future: "bg-transparent text-[#8b94a3] border border-dashed border-[#e6e8ec]",
};

function HypothesesTab({ items, locale, t }: { items: Hypothesis[]; locale: Loc; t: T }) {
  const grouped = items.reduce<Record<string, Hypothesis[]>>((acc, h) => {
    (acc[h.status] ||= []).push(h);
    return acc;
  }, {});
  const order = ["main", "shortlisted", "candidate", "future"];

  return (
    <div className="space-y-8">
      {order.map((s) => {
        const list = grouped[s] || [];
        if (!list.length) return null;
        return (
          <section key={s}>
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-3">
              {s} ({list.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {list.map((h) => (
                <HypCard key={h.id} h={h} locale={locale} t={t} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function HypCard({ h, locale, t }: { h: Hypothesis; locale: Loc; t: T }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#e6e8ec] rounded-xl bg-white p-6 hover:border-[#c2e5d8] shadow-mercury transition group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#ecf4f0] text-[#0a8060] tracking-wide">{h.code}</span>
          <span className="text-[11px] font-medium text-[#8b94a3] uppercase tracking-wider">{pickField(h, locale, "journal_target")}</span>
        </div>
        <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLOR[h.status] || ""}`}>
          {h.status}
        </span>
      </div>
      <h3 className="font-semibold text-[17px] leading-snug mb-2 text-[#0e1117] tracking-tight">{pickField(h, locale, "title")}</h3>
      <p className="text-[#2a3441] text-[14px] mb-4 leading-relaxed">{pickField(h, locale, "paradox")}</p>
      <div className="flex gap-4 text-[11px] font-mono text-[#4b5263] mb-3 tabular">
        <span>{t.dash_feas} <span className="text-[#0a8060]">{"★".repeat(h.feasibility_6mo)}</span>{"☆".repeat(5 - h.feasibility_6mo)}</span>
        <span>{t.dash_ab} <span className="text-[#0a8060]">{"★".repeat(6 - h.ab_test_difficulty)}</span>{"☆".repeat(h.ab_test_difficulty - 1)}</span>
      </div>
      <div className="flex items-center justify-between border-t border-[#e6e8ec] pt-3">
        <button
          onClick={() => setOpen(!open)}
          className="text-xs font-mono text-[#4b5263] hover:text-[#0e1117] uppercase tracking-widest"
        >
          {open ? t.dash_less : t.dash_more}
        </button>
        <Link
          href={`/dashboard/hypothesis/${h.code}`}
          className="text-xs font-mono text-[#0a8060] hover:text-[#0e1117] uppercase tracking-widest font-bold"
        >
          {h.has_proposal ? t.dash_view_ppt : t.dash_expand_ppt}
        </Link>
      </div>
      {open && (
        <dl className="space-y-3 mt-3 text-sm border-t border-[#f3f4f7] pt-3">
          <Row label={t.dash_row_hypothesis}>{pickField(h, locale, "hypothesis")}</Row>
          <Row label={t.dash_row_identification}>{pickField(h, locale, "identification")}</Row>
          <Row label={t.dash_row_theory}>{pickField(h, locale, "theory_anchor")}</Row>
          {pickField(h, locale, "notes") && <Row label={t.dash_row_notes}>{pickField(h, locale, "notes")}</Row>}
        </dl>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-mono uppercase tracking-widest text-[#4b5263]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────

function DataTab({ items }: { items: DataSource[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((d) => (
        <div key={d.id} className="border border-[#e6e8ec] rounded-2xl bg-white p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold">{d.name}</h3>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-[#e7f4ee]">{d.kind}</span>
          </div>
          {d.description && <p className="text-sm text-[#0e1117] mb-2">{d.description}</p>}
          {d.stats && (
            <p className="text-xs font-mono text-[#4b5263] mb-2 leading-relaxed">{d.stats}</p>
          )}
          {d.notes && (
            <p className="text-xs italic text-[#0a8060]">{d.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────

function QueueTab({ status, t }: { status: Status; t: T }) {
  const pct = Math.min(100, Math.round((status.total / LAUNCH_TARGET) * 100));
  const remaining = Math.max(0, LAUNCH_TARGET - status.total);
  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/signup` : "";

  return (
    <div className="max-w-2xl">
      <div className="bg-[#e7f4ee] rounded-2xl p-6 mb-6 border border-[#f3f4f7]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263]">{t.queue_launch_progress}</div>
          <div className="text-sm font-mono">
            <strong className="text-[#0e1117] text-base">{status.total}</strong>
            <span className="text-[#4b5263]"> / {LAUNCH_TARGET}</span>
          </div>
        </div>
        <div className="w-full h-3 bg-white border border-[#e6e8ec] rounded-full overflow-hidden">
          <div className="h-full bg-[#0a8060] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-[#4b5263] mt-3 italic">
          {remaining > 0 ? t.queue_more_to_launch.replace("{n}", String(remaining)) : t.queue_hit_target}
        </p>
      </div>

      <div className="border border-[#e6e8ec] rounded-2xl bg-white p-5 mb-4">
        <h3 className="font-bold mb-2">{t.queue_signup_info}</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><dt className="text-[#4b5263] w-24">{t.queue_position}</dt><dd>#{status.position}</dd></div>
          <div className="flex gap-2"><dt className="text-[#4b5263] w-24">{t.queue_email}</dt><dd>{status.email}</dd></div>
          <div className="flex gap-2"><dt className="text-[#4b5263] w-24">{t.queue_joined}</dt><dd>{status.created_at}</dd></div>
          {status.source && <div className="flex gap-2"><dt className="text-[#4b5263] w-24">{t.queue_source}</dt><dd>{status.source}</dd></div>}
        </dl>
      </div>

      <div className="border border-[#e6e8ec] rounded-2xl bg-white p-5">
        <h3 className="font-bold mb-2">{t.queue_refer}</h3>
        <p className="text-sm text-[#4b5263] mb-3 italic">{t.queue_referred}{status.referred_count}</p>
        <div className="flex gap-2">
          <input readOnly value={shareLink} onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 px-3 py-2 border border-[#e6e8ec] rounded-lg text-sm font-mono bg-[#f7f8fa]" />
          <button
            onClick={() => { navigator.clipboard.writeText(shareLink); alert(t.queue_copied); }}
            className="bg-[#0e1117] text-[#ffffff] px-3 py-2 rounded-lg text-sm hover:bg-[#0a8060] transition"
          >{t.queue_copy}</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────

function Header({ email, t }: { email: string; t: T }) {
  return (
    <header className="border-b border-[#e6e8ec]">
      <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          arxify<span className="text-[#0a8060]">.io</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <LocaleSwitcher />
          <Link href="/try" className="text-[#4b5263] hover:text-[#0e1117]">{t.nav_try}</Link>
          <Link href="/pricing" className="text-[#4b5263] hover:text-[#0e1117]">{t.nav_pricing}</Link>
          <span className="text-xs font-mono text-[#4b5263]">{email}</span>
        </div>
      </div>
    </header>
  );
}

function NoToken() {
  const { t } = useLocale();
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#0e1117] ">
      <section className="max-w-xl mx-auto px-8 py-20 text-center">
        <h1 className="text-4xl font-extrabold mb-4">
          {t.notoken_title_a}<span className="italic text-[#0a8060]">{t.notoken_title_em}</span>
        </h1>
        <p className="text-[#4b5263] mb-8 italic">
          {t.notoken_desc}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/login"
            className="inline-block border border-[#0e1117] px-7 py-3.5 rounded-md font-medium hover:bg-[#0e1117] hover:text-white transition"
          >
            {t.notoken_login}
          </Link>
          <Link
            href="/signup"
            className="inline-block bg-[#0e1117] text-[#ffffff] px-7 py-3.5 rounded-md font-medium hover:bg-[#0a8060] transition"
          >
            {t.notoken_join}
          </Link>
        </div>
      </section>
    </main>
  );
}
