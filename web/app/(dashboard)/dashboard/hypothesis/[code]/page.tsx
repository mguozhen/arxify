// arxify.io — Hypothesis detail as 13-slide PPT-style deck
// Follows Hunter's 开题报告 proposal framework
// Keyboard nav: ← → space  · Full deck downloadable as PDF via print

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
  has_proposal: boolean;
};

type Proposal = {
  one_line_question: string;
  why_top_tier: string[];
  why_solvea_exclusive: string[];
  experiment_design: {
    approach: string;
    treatment_arms: string[];
    randomization_unit: string;
    randomization_logic: string;
    duration_weeks: number;
  };
  outcomes: { primary: string[]; secondary: string[]; mediators: string[] };
  pre_registered_hypotheses: { id: string; statement: string; direction?: string }[];
  sample_size: {
    per_arm: number; total: number; power: number; alpha: number; mde: string; weeks_to_collect: number;
  };
  implementation: { engineering_days: string; ops_steps: string[]; cost_usd: string; dependencies: string[] };
  journal_targets: { tier: string; journal: string; reason: string }[];
  theory_anchors: { theory: string; citation: string; role: string }[];
  risks: { risk: string; mitigation: string; severity: string }[];
  elevator_pitches: { lin: string; zhou: string; cai: string };
};

type Detail = {
  hypothesis: Hypothesis;
  proposal: Proposal | null;
  raw_paradox: string;
  raw_hypothesis: string;
  raw_identification: string;
  raw_theory_anchor: string;
  raw_journal_target: string;
  notes: string | null;
};

export default function HypothesisPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params?.code || "");

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);

  // Load detail
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("arxify_token");
    if (!token) {
      router.push("/signup");
      return;
    }
    fetch(`${API_URL}/api/workspace/hypotheses/${code}?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
        return r.json();
      })
      .then(setDetail)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [code, router]);

  async function generate() {
    const token = localStorage.getItem("arxify_token");
    if (!token) return;
    setGenerating(true);
    setError(null);
    try {
      const r = await fetch(
        `${API_URL}/api/workspace/hypotheses/${code}/generate-proposal?token=${encodeURIComponent(token)}&force=true`,
        { method: "POST" }
      );
      if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
      setDetail(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  // Keyboard nav
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      setSlideIdx((i) => Math.min(12, i + 1));
    } else if (e.key === "ArrowLeft") {
      setSlideIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Escape") {
      router.push("/dashboard?tab=hypotheses");
    } else if (/^[0-9]$/.test(e.key)) {
      const n = parseInt(e.key);
      if (n >= 0 && n <= 9) setSlideIdx(n);
    }
  }, [router]);
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  if (loading) {
    return <Loading text="Loading proposal…" />;
  }
  if (!detail) {
    return <Loading text={error || "Not found"} error />;
  }

  // If no proposal yet, show "generate" CTA
  if (!detail.proposal) {
    return (
      <main className="min-h-screen bg-[#ffffff] text-[#0a0a0a] ">
        <Header h={detail.hypothesis} />
        <section className="max-w-3xl mx-auto px-8 py-16 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-3">
            {detail.hypothesis.code} · {detail.hypothesis.journal_target} · {detail.hypothesis.status}
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-3">{detail.hypothesis.title}</h1>
          <p className="italic text-[#1e40af] text-lg mb-10">&ldquo;{detail.hypothesis.paradox}&rdquo;</p>

          <div className="border border-[#e5e7eb] bg-white rounded-2xl p-8 max-w-xl mx-auto">
            <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-2">
              ⚡ EXPAND TO PPT
            </div>
            <p className="text-sm text-[#64748b] mb-6 italic">
              Hunter&apos;s 开题报告 framework. 13 sections: 一句话问题 / 为什么顶刊 / 为什么 Solvea 独家 /
              实验设计 / Outcome / Hypotheses / Sample power / 实施成本 / 期刊 / 文献锚 / 风险 / 三位老师的电梯演讲。
            </p>
            <button
              onClick={generate}
              disabled={generating}
              className="bg-[#0a0a0a] text-[#ffffff] px-8 py-4 rounded-full font-medium hover:bg-[#1e40af] disabled:opacity-40 transition"
            >
              {generating ? "Generating proposal (~30s)…" : "Generate full proposal →"}
            </button>
            {error && <div className="text-sm text-red-700 mt-4">{error}</div>}
          </div>
        </section>
      </main>
    );
  }

  const p = detail.proposal;
  const h = detail.hypothesis;

  const slides: { title: string; body: React.ReactNode }[] = [
    // SLIDE 0 · Cover
    {
      title: "Cover",
      body: (
        <CoverSlide h={h} />
      ),
    },
    // SLIDE 1 · One-line question
    {
      title: "一句话研究问题",
      body: (
        <BigQuote
          eyebrow="ONE-LINE QUESTION"
          quote={p.one_line_question}
          footer={`Theory anchor: ${h.theory_anchor}`}
        />
      ),
    },
    // SLIDE 2 · Why top-tier
    {
      title: "为什么是顶刊级",
      body: (
        <NumberedList
          eyebrow="WHY TOP-TIER"
          heading="Why this lands at top-tier journals"
          items={p.why_top_tier}
        />
      ),
    },
    // SLIDE 3 · Why Solvea-exclusive
    {
      title: "为什么 Solvea 独家",
      body: (
        <NumberedList
          eyebrow="DATA UNIQUENESS"
          heading="Why only Solvea can answer this"
          items={p.why_solvea_exclusive}
        />
      ),
    },
    // SLIDE 4 · Experiment design
    {
      title: "实验设计",
      body: (
        <ExperimentSlide design={p.experiment_design} identification={h.identification} />
      ),
    },
    // SLIDE 5 · Outcomes
    {
      title: "Outcome Variables",
      body: (
        <OutcomesSlide outcomes={p.outcomes} />
      ),
    },
    // SLIDE 6 · Pre-registered hypotheses
    {
      title: "Pre-registered Hypotheses",
      body: (
        <HypothesesSlide items={p.pre_registered_hypotheses} />
      ),
    },
    // SLIDE 7 · Sample size & power
    {
      title: "Sample Size & Power",
      body: (
        <SampleSizeSlide s={p.sample_size} />
      ),
    },
    // SLIDE 8 · Implementation cost
    {
      title: "实施路径与成本",
      body: (
        <ImplementationSlide impl={p.implementation} />
      ),
    },
    // SLIDE 9 · Journal targets
    {
      title: "顶刊投稿目标",
      body: (
        <JournalsSlide targets={p.journal_targets} />
      ),
    },
    // SLIDE 10 · Theory anchors
    {
      title: "文献框架",
      body: (
        <TheorySlide anchors={p.theory_anchors} />
      ),
    },
    // SLIDE 11 · Risks
    {
      title: "Risks & Mitigations",
      body: (
        <RisksSlide risks={p.risks} />
      ),
    },
    // SLIDE 12 · Elevator pitches
    {
      title: "三位老师的电梯演讲",
      body: (
        <PitchesSlide pitches={p.elevator_pitches} />
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#ffffff] text-[#0a0a0a]  flex flex-col">
      <Header h={h} onRegenerate={generate} />

      <div className="flex-1 flex flex-col px-8 py-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#64748b]">
            {slides[slideIdx].title}
          </div>
          <div className="text-xs font-mono text-[#64748b]">
            <span className="text-[#0a0a0a] font-bold">{slideIdx + 1}</span>
            <span> / {slides.length}</span>
          </div>
        </div>

        {/* SLIDE BODY */}
        <div className="flex-1 border border-[#e5e7eb] rounded-2xl bg-white p-10 md:p-14 min-h-[60vh]">
          {slides[slideIdx].body}
        </div>

        {/* NAV */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
            disabled={slideIdx === 0}
            className="px-5 py-2 border border-[#0a0a0a] rounded-full font-medium disabled:opacity-30 hover:bg-[#0a0a0a] hover:text-[#ffffff] transition"
          >
            ← Prev
          </button>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIdx(i)}
                className={`h-2 w-6 rounded-full transition ${
                  i === slideIdx ? "bg-[#1e40af]" : "bg-[#e5e7eb]"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
            disabled={slideIdx === slides.length - 1}
            className="px-5 py-2 bg-[#0a0a0a] text-[#ffffff] rounded-full font-medium disabled:opacity-30 hover:bg-[#1e40af] transition"
          >
            Next →
          </button>
        </div>

        <div className="text-center text-xs font-mono text-[#64748b] mt-3 italic">
          ← → space to navigate · Esc to exit · 0-9 to jump
        </div>
      </div>
    </main>
  );
}

// ═══════════ SLIDE COMPONENTS ═══════════

function CoverSlide({ h }: { h: Hypothesis }) {
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-4">
        {h.code} · {h.journal_target} · {h.status}
      </div>
      <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
        {h.title}
      </h1>
      <p className="italic text-2xl text-[#1e40af] mb-8 leading-relaxed border-l-4 border-[#1e40af] pl-4">
        &ldquo;{h.paradox}&rdquo;
      </p>
      <div className="flex gap-6 text-sm font-mono text-[#64748b]">
        <span>Feasibility {"★".repeat(h.feasibility_6mo)}{"☆".repeat(5 - h.feasibility_6mo)}</span>
        <span>A/B {"★".repeat(6 - h.ab_test_difficulty)}{"☆".repeat(h.ab_test_difficulty - 1)}</span>
      </div>
      <div className="mt-12 text-sm text-[#64748b] font-mono">
        郭振 · HKU DBA · arxify.io
      </div>
    </div>
  );
}

function BigQuote({ eyebrow, quote, footer }: { eyebrow: string; quote: string; footer?: string }) {
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-6">{eyebrow}</div>
      <blockquote className="text-3xl md:text-4xl font-extrabold leading-tight border-l-4 border-[#1e40af] pl-6 mb-6">
        {quote}
      </blockquote>
      {footer && <div className="text-sm text-[#64748b] italic mt-4">{footer}</div>}
    </div>
  );
}

function NumberedList({ eyebrow, heading, items }: { eyebrow: string; heading: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">{eyebrow}</div>
      <h2 className="text-3xl font-extrabold mb-8">{heading}</h2>
      <ol className="space-y-4">
        {items.map((s, i) => (
          <li key={i} className="flex gap-4 items-start">
            <span className="font-mono text-[#1e40af] font-bold text-lg w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-lg leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ExperimentSlide({ design, identification }: { design: any; identification: string }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">EXPERIMENT DESIGN</div>
      <h2 className="text-3xl font-extrabold mb-6">{design.approach}</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <KV k="Randomization unit" v={design.randomization_unit} />
        <KV k="Duration" v={`${design.duration_weeks} weeks`} />
        <KV k="Logic" v={design.randomization_logic} span="md:col-span-2" />
      </div>

      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-3">Treatment arms</div>
        <ol className="space-y-2">
          {design.treatment_arms.map((arm: string, i: number) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="font-mono text-[#1e40af] font-bold w-6 shrink-0">T{i}</span>
              <span>{arm}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-[#eff6ff] border-l-2 border-[#1e40af] p-4 text-sm italic">
        <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1 not-italic">Identification</div>
        {identification}
      </div>
    </div>
  );
}

function OutcomesSlide({ outcomes }: { outcomes: any }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">OUTCOMES</div>
      <h2 className="text-3xl font-extrabold mb-6">What we measure</h2>

      <div className="grid md:grid-cols-3 gap-5">
        <OutcomeCol label="Primary" items={outcomes.primary} highlight />
        <OutcomeCol label="Secondary" items={outcomes.secondary} />
        <OutcomeCol label="Mediators" items={outcomes.mediators} />
      </div>
    </div>
  );
}

function OutcomeCol({ label, items, highlight }: { label: string; items: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "border-2 border-[#1e40af] bg-[#eff6ff]" : "border border-[#e5e7eb]"}`}>
      <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-3">{label}</div>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => <li key={i} className="leading-snug">· {it}</li>)}
      </ul>
    </div>
  );
}

function HypothesesSlide({ items }: { items: any[] }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">PRE-REGISTERED</div>
      <h2 className="text-3xl font-extrabold mb-6">Hypotheses</h2>
      <ol className="space-y-4">
        {items.map((h, i) => (
          <li key={i} className="border-l-2 border-[#1e40af] pl-4 py-1">
            <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-1">
              {h.id}{h.direction ? ` · ${h.direction}` : ""}
            </div>
            <div className="text-base leading-relaxed">{h.statement}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SampleSizeSlide({ s }: { s: any }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">SAMPLE & POWER</div>
      <h2 className="text-3xl font-extrabold mb-8">How big? How long?</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <BigStat label="Per arm" value={s.per_arm?.toLocaleString?.() || s.per_arm} />
        <BigStat label="Total N" value={s.total?.toLocaleString?.() || s.total} />
        <BigStat label="Power" value={`${(s.power * 100).toFixed(0)}%`} />
        <BigStat label="α" value={String(s.alpha)} />
      </div>
      <div className="space-y-3 text-sm">
        <KV k="MDE" v={s.mde} />
        <KV k="Weeks to collect" v={`${s.weeks_to_collect}`} />
      </div>
    </div>
  );
}

function ImplementationSlide({ impl }: { impl: any }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">IMPLEMENTATION</div>
      <h2 className="text-3xl font-extrabold mb-6">Cost & timeline</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <BigStat label="Engineering" value={`${impl.engineering_days} d`} />
        <BigStat label="Compute cost" value={impl.cost_usd} />
        <BigStat label="Ops needed" value={`${impl.ops_steps.length} steps`} />
      </div>
      <div className="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-2">Ops Steps</div>
          <ul className="space-y-1">{impl.ops_steps.map((s: string, i: number) => <li key={i}>· {s}</li>)}</ul>
        </div>
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-2">Dependencies</div>
          <ul className="space-y-1">{impl.dependencies.map((d: string, i: number) => <li key={i}>· {d}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function JournalsSlide({ targets }: { targets: any[] }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">JOURNAL TARGETS</div>
      <h2 className="text-3xl font-extrabold mb-6">Where this lands</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {targets.map((t, i) => (
          <div key={i} className={`rounded-xl p-5 ${t.tier === "primary" ? "border-2 border-[#1e40af] bg-[#eff6ff]" : "border border-[#e5e7eb]"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-xl">{t.journal}</div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748b]">{t.tier}</span>
            </div>
            <div className="text-sm text-[#64748b] italic">{t.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TheorySlide({ anchors }: { anchors: any[] }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">THEORY ANCHORS</div>
      <h2 className="text-3xl font-extrabold mb-6">文献框架</h2>
      <div className="space-y-4">
        {anchors.map((a, i) => (
          <div key={i} className="border-l-2 border-[#1e40af] pl-4 py-1">
            <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-1">{a.role}</div>
            <div className="font-bold mb-1">{a.theory}</div>
            <div className="text-sm text-[#64748b] italic">{a.citation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RisksSlide({ risks }: { risks: any[] }) {
  const sev = (s: string) =>
    s === "high" ? "bg-red-100 text-red-900 border-red-300" :
    s === "low" ? "bg-green-100 text-green-900 border-green-300" :
    "bg-amber-100 text-amber-900 border-amber-300";
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">RISKS</div>
      <h2 className="text-3xl font-extrabold mb-6">What could kill this</h2>
      <div className="space-y-3">
        {risks.map((r, i) => (
          <div key={i} className="border border-[#e5e7eb] rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="font-bold text-base flex-1">{r.risk}</div>
              <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${sev(r.severity)}`}>{r.severity}</span>
            </div>
            <div className="text-sm text-[#64748b]"><strong className="text-[#0a0a0a]">Mitigation: </strong>{r.mitigation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PitchesSlide({ pitches }: { pitches: any }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-2">ELEVATOR PITCHES</div>
      <h2 className="text-3xl font-extrabold mb-6">三位导师的 30 秒 pitch</h2>
      <div className="space-y-4">
        <PitchCard advisor="林晨 · HKU (主导师)" content={pitches.lin} flavor="商科 / 识别" />
        <PitchCard advisor="周黎安 · PKU" content={pitches.zhou} flavor="制度经济学" />
        <PitchCard advisor="蔡靖 · UMD (J-PAL)" content={pitches.cai} flavor="Field RCT / Firms" />
      </div>
    </div>
  );
}

function PitchCard({ advisor, content, flavor }: { advisor: string; content: string; flavor: string }) {
  return (
    <div className="border border-[#e5e7eb] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold">{advisor}</div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748b]">{flavor}</span>
      </div>
      <p className="text-sm italic text-[#0a0a0a] leading-relaxed">&ldquo;{content}&rdquo;</p>
    </div>
  );
}

// ─── shared bits ───────────────────────────────────────────

function KV({ k, v, span }: { k: string; v: string; span?: string }) {
  return (
    <div className={span}>
      <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1">{k}</div>
      <div className="text-base">{v}</div>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#e5e7eb] rounded-xl p-4">
      <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1">{label}</div>
      <div className="font-extrabold text-3xl text-[#1e40af]">{value}</div>
    </div>
  );
}

function Header({ h, onRegenerate }: { h: Hypothesis; onRegenerate?: () => void }) {
  return (
    <header className="border-b border-[#e5e7eb]">
      <div className="flex items-center justify-between px-6 py-3 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/dashboard?tab=hypotheses" className="text-xs font-mono uppercase tracking-widest text-[#64748b] hover:text-[#0a0a0a]">
            ← back
          </Link>
          <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af]">
            {h.code} · {h.journal_target}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onRegenerate && (
            <button onClick={onRegenerate} className="text-xs font-mono text-[#64748b] hover:text-[#0a0a0a]">
              ↻ regenerate
            </button>
          )}
          <Link href="/" className="text-xl font-bold tracking-tight">
            arxify<span className="text-[#1e40af]">.io</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Loading({ text, error }: { text: string; error?: boolean }) {
  return (
    <main className="min-h-screen bg-[#ffffff] flex items-center justify-center ">
      <p className={`italic ${error ? "text-red-700" : "text-[#64748b]"}`}>{text}</p>
    </main>
  );
}
