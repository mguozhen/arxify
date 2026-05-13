// arxify.io — Dashboard
// Admin view: workspace with hypotheses + data sources + chat
// Waitlist view: queue position + referral

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceFull | null>(null);
  const [tab, setTab] = useState<"chat" | "hypotheses" | "data" | "queue">("chat");
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
          if (!urlTab) setTab("chat");
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
      <main className="min-h-screen bg-[#fafaf7] flex items-center justify-center font-serif">
        <p className="italic text-[#6e6a5d]">Loading…</p>
      </main>
    );
  }

  if (!token || !status) {
    return <NoToken />;
  }

  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#1f1c17] font-serif">
      <Header email={status.email} />

      <div className="max-w-6xl mx-auto px-6 py-6">
        {workspace ? (
          <>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-1 leading-tight">
              {workspace.workspace.title}
            </h1>
            {workspace.workspace.description && (
              <p className="text-[#6e6a5d] italic mb-6">{workspace.workspace.description}</p>
            )}

            <Tabs tab={tab} setTab={setTab} hasWs={true} />

            {tab === "chat" && <ChatTab token={token} initial={workspace.chat} />}
            {tab === "hypotheses" && <HypothesesTab items={workspace.hypotheses} />}
            {tab === "data" && <DataTab items={workspace.data_sources} />}
            {tab === "queue" && <QueueTab status={status} />}
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              You&apos;re #<span className="italic text-[#b85a3a]">{status.position}</span> in line.
            </h1>
            <QueueTab status={status} />
          </>
        )}
      </div>
    </main>
  );
}

// ───────────────────────────────────────────────────────────────────────

function Tabs({
  tab, setTab, hasWs,
}: {
  tab: string;
  setTab: (t: any) => void;
  hasWs: boolean;
}) {
  const tabs = hasWs
    ? [
        { id: "chat", label: "💬 Chat" },
        { id: "hypotheses", label: "📋 17 Hypotheses" },
        { id: "data", label: "🗄️ Data sources" },
        { id: "queue", label: "📬 Waitlist" },
      ]
    : [{ id: "queue", label: "📬 Waitlist" }];
  return (
    <div className="border-b border-[#d3cdbe] mb-6">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              tab === t.id
                ? "border-[#b85a3a] text-[#1f1c17]"
                : "border-transparent text-[#6e6a5d] hover:text-[#1f1c17]"
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

function ChatTab({ token, initial }: { token: string; initial: ChatMessage[] }) {
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
          <div className="text-center text-[#6e6a5d] italic mt-12">
            Ask anything about your 17 directions, data sources, or advisor strategy.
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
        {sending && (
          <Bubble msg={{ id: -1, role: "assistant", content: "thinking…", model: null, created_at: "" }} />
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="text-sm text-red-700 mb-2 px-3 py-2 bg-red-50 rounded">{error}</div>
      )}

      <div className="flex gap-2 border-t border-[#d3cdbe] pt-3">
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
          placeholder="e.g. D8 vs D14 哪个更稳? ⌘+Enter to send"
          className="flex-1 px-4 py-3 border border-[#d3cdbe] rounded-lg focus:border-[#b85a3a] focus:outline-none text-sm resize-none"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="bg-[#1f1c17] text-[#fafaf7] px-6 rounded-lg font-medium hover:bg-[#b85a3a] disabled:opacity-40 transition"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#1f1c17] text-[#fafaf7]"
            : "bg-white border border-[#d3cdbe]"
        }`}
      >
        {!isUser && (
          <div className="text-xs font-mono uppercase tracking-widest text-[#b85a3a] mb-1">
            ai advisor · claude
          </div>
        )}
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  main: "bg-[#b85a3a] text-white",
  shortlisted: "bg-[#ece5d3] text-[#1f1c17]",
  candidate: "bg-white text-[#6e6a5d] border border-[#d3cdbe]",
  future: "bg-transparent text-[#6e6a5d] border border-dashed border-[#d3cdbe]",
};

function HypothesesTab({ items }: { items: Hypothesis[] }) {
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
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#6e6a5d] mb-3">
              {s} ({list.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {list.map((h) => (
                <HypCard key={h.id} h={h} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function HypCard({ h }: { h: Hypothesis }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#d3cdbe] rounded-2xl bg-white p-5">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#b85a3a]">
          {h.code} · {h.journal_target}
        </div>
        <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full ${STATUS_COLOR[h.status] || ""}`}>
          {h.status}
        </span>
      </div>
      <h3 className="font-bold leading-snug mb-2">{h.title}</h3>
      <p className="italic text-[#b85a3a] text-sm mb-3">&ldquo;{h.paradox}&rdquo;</p>
      <div className="flex gap-3 text-xs font-mono text-[#6e6a5d] mb-3">
        <span>Feasibility {"★".repeat(h.feasibility_6mo)}{"☆".repeat(5 - h.feasibility_6mo)}</span>
        <span>A/B {"★".repeat(6 - h.ab_test_difficulty)}{"☆".repeat(h.ab_test_difficulty - 1)}</span>
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs font-mono text-[#b85a3a] hover:text-[#1f1c17] uppercase tracking-widest"
      >
        {open ? "− less" : "+ more"}
      </button>
      {open && (
        <dl className="space-y-3 mt-3 text-sm border-t border-[#ece5d3] pt-3">
          <Row label="Hypothesis">{h.hypothesis}</Row>
          <Row label="Identification">{h.identification}</Row>
          <Row label="Theory anchor">{h.theory_anchor}</Row>
          {h.notes && <Row label="Notes">{h.notes}</Row>}
        </dl>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-mono uppercase tracking-widest text-[#6e6a5d]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────

function DataTab({ items }: { items: DataSource[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((d) => (
        <div key={d.id} className="border border-[#d3cdbe] rounded-2xl bg-white p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold">{d.name}</h3>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-[#f3eee2]">{d.kind}</span>
          </div>
          {d.description && <p className="text-sm text-[#1f1c17] mb-2">{d.description}</p>}
          {d.stats && (
            <p className="text-xs font-mono text-[#6e6a5d] mb-2 leading-relaxed">{d.stats}</p>
          )}
          {d.notes && (
            <p className="text-xs italic text-[#b85a3a]">{d.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────

function QueueTab({ status }: { status: Status }) {
  const pct = Math.min(100, Math.round((status.total / LAUNCH_TARGET) * 100));
  const remaining = Math.max(0, LAUNCH_TARGET - status.total);
  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/signup` : "";

  return (
    <div className="max-w-2xl">
      <div className="bg-[#f3eee2] rounded-2xl p-6 mb-6 border border-[#ece5d3]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#6e6a5d]">Launch progress</div>
          <div className="text-sm font-mono">
            <strong className="text-[#1f1c17] text-base">{status.total}</strong>
            <span className="text-[#6e6a5d]"> / {LAUNCH_TARGET}</span>
          </div>
        </div>
        <div className="w-full h-3 bg-white border border-[#d3cdbe] rounded-full overflow-hidden">
          <div className="h-full bg-[#b85a3a] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-[#6e6a5d] mt-3 italic">
          {remaining > 0 ? `${remaining} more to launch.` : "🎉 We hit target. Beta opening this week."}
        </p>
      </div>

      <div className="border border-[#d3cdbe] rounded-2xl bg-white p-5 mb-4">
        <h3 className="font-bold mb-2">Your signup info</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><dt className="text-[#6e6a5d] w-24">Position</dt><dd>#{status.position}</dd></div>
          <div className="flex gap-2"><dt className="text-[#6e6a5d] w-24">Email</dt><dd>{status.email}</dd></div>
          <div className="flex gap-2"><dt className="text-[#6e6a5d] w-24">Joined</dt><dd>{status.created_at}</dd></div>
          {status.source && <div className="flex gap-2"><dt className="text-[#6e6a5d] w-24">Source</dt><dd>{status.source}</dd></div>}
        </dl>
      </div>

      <div className="border border-[#d3cdbe] rounded-2xl bg-white p-5">
        <h3 className="font-bold mb-2">Refer friends</h3>
        <p className="text-sm text-[#6e6a5d] mb-3 italic">Referred: {status.referred_count}</p>
        <div className="flex gap-2">
          <input readOnly value={shareLink} onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 px-3 py-2 border border-[#d3cdbe] rounded-lg text-sm font-mono bg-[#fafaf7]" />
          <button
            onClick={() => { navigator.clipboard.writeText(shareLink); alert("Copied!"); }}
            className="bg-[#1f1c17] text-[#fafaf7] px-3 py-2 rounded-lg text-sm hover:bg-[#b85a3a] transition"
          >Copy</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────

function Header({ email }: { email: string }) {
  return (
    <header className="border-b border-[#d3cdbe]">
      <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          arxify<span className="text-[#b85a3a]">.io</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/try" className="text-[#6e6a5d] hover:text-[#1f1c17]">Try free</Link>
          <Link href="/pricing" className="text-[#6e6a5d] hover:text-[#1f1c17]">Pricing</Link>
          <span className="text-xs font-mono text-[#6e6a5d]">{email}</span>
        </div>
      </div>
    </header>
  );
}

function NoToken() {
  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#1f1c17] font-serif">
      <section className="max-w-xl mx-auto px-8 py-20 text-center">
        <h1 className="text-4xl font-extrabold mb-4">
          You&apos;re not <span className="italic text-[#b85a3a]">in</span> yet.
        </h1>
        <p className="text-[#6e6a5d] mb-8 italic">
          Either you haven&apos;t joined yet, or you&apos;re on a different device.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-[#1f1c17] text-[#fafaf7] px-8 py-4 rounded-full font-medium hover:bg-[#b85a3a] transition"
        >
          Join waitlist →
        </Link>
      </section>
    </main>
  );
}
