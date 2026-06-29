// arxify.io — Hypothesis detail as 13-slide PPT-style deck
// Follows Hunter's 开题报告 proposal framework
// Keyboard nav: ← → space  · Full deck downloadable as PDF via print

"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, LocaleSwitcher } from "@/lib/locale";
import { pickField, getDict } from "@/lib/i18n";

type T = ReturnType<typeof getDict>;
type Loc = "zh" | "en" | "ja" | "es";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://arxify-production.up.railway.app";

type ProposalModelProvider = "flatkey-claude-4-8" | "flatkey-gpt-5-5" | "apodex-deepresearch" | "flatkey-glm-5-2";

const PROPOSAL_MODELS: { id: ProposalModelProvider; label: string; source: string }[] = [
  { id: "flatkey-claude-4-8", label: "Claude Opus 4.8", source: "Flatkey" },
  { id: "flatkey-gpt-5-5", label: "GPT 5.5", source: "Flatkey" },
  { id: "apodex-deepresearch", label: "DeepResearch", source: "Apodex" },
  { id: "flatkey-glm-5-2", label: "GLM-5.2", source: "Flatkey" },
];

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
  content_zh?: Record<string, string> | null;
  content_en?: Record<string, string> | null;
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
  causal_identification?: {
    causal_question: string;
    estimand: string;
    preferred_design: string;
    assignment_mechanism: string;
    control_or_counterfactual: string;
    unit_of_analysis: string;
    identifying_assumption: string;
    balance_checks: string[];
    manipulation_checks: string[];
    threats_to_causality: { threat: string; test: string; fix: string }[];
    decision_rule: string;
  } | null;
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

type ProposalVariant = {
  provider_id: ProposalModelProvider;
  label: string;
  source: string;
  proposal: Proposal;
  proposal_zh?: Proposal | null;
  proposal_en?: Proposal | null;
  generated_at: string;
};

type Detail = {
  hypothesis: Hypothesis;
  proposal: Proposal | null;
  proposal_zh?: Proposal | null;
  proposal_en?: Proposal | null;
  proposal_variants?: Partial<Record<ProposalModelProvider, ProposalVariant>>;
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
  const { t, locale } = useLocale();
  const code = String(params?.code || "");

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingMode, setGeneratingMode] = useState<"single" | "all" | null>(null);
  const [genProvider, setGenProvider] = useState<ProposalModelProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [modelProvider, setModelProvider] = useState<ProposalModelProvider>("flatkey-claude-4-8");

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

  useEffect(() => {
    const variants = detail?.proposal_variants || {};
    if (!variants[modelProvider]) {
      const first = PROPOSAL_MODELS.find((model) => variants[model.id]);
      if (first) setModelProvider(first.id);
    }
  }, [detail, modelProvider]);

  async function generate(mode: "single" | "all" = "single", providerOverride?: ProposalModelProvider) {
    const token = localStorage.getItem("arxify_token");
    if (!token) return;
    const provider = providerOverride || modelProvider;
    setGenerating(true);
    setGeneratingMode(mode);
    setGenProvider(mode === "single" ? provider : null);
    setError(null);
    try {
      const r = await fetch(
        `${API_URL}/api/workspace/hypotheses/${code}/generate-proposal?token=${encodeURIComponent(token)}&force=true`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ model_provider: provider, mode }),
        }
      );
      if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
      setDetail(await r.json());
      // switch the view to the model we just (re)generated
      if (mode === "single") setModelProvider(provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
      setGeneratingMode(null);
      setGenProvider(null);
    }
  }

  // Keyboard nav
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      setSlideIdx((i) => Math.min(14, i + 1));
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
    return <Loading text={t.ppt_loading_proposal} />;
  }
  if (!detail) {
    const isNotFound = error?.includes("404") || error?.toLowerCase().includes("not found");
    return (
      <main className="min-h-screen bg-[#f7f8fa] text-[#0e1117]">
        <Header h={{ code, journal_target: "" } as Hypothesis} t={t} locale={locale} />
        <section className="max-w-xl mx-auto px-8 py-24 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-3">
            {isNotFound ? t.ppt_404 : "ERROR"}
          </div>
          <h1 className="text-3xl font-bold mb-4">
            {isNotFound ? t.ppt_not_exist.replace("{code}", code) : t.ppt_load_fail}
          </h1>
          <p className="text-[#4b5263] mb-8 leading-relaxed">
            {isNotFound
              ? "Check the code in the URL, or pick from your dashboard."
              : (error || "Unknown error")}
          </p>
          <Link
            href="/dashboard?tab=hypotheses"
            className="inline-block bg-[#0e1117] text-white px-6 py-3 rounded-full font-medium hover:bg-[#0a8060] transition"
          >
            {t.ppt_back_dash}
          </Link>
        </section>
      </main>
    );
  }

  // If no proposal yet, show "generate" CTA
  const variantCount = Object.keys(detail.proposal_variants || {}).length;

  if (!detail.proposal && variantCount === 0) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] text-[#0e1117] ">
        <Header h={detail.hypothesis} t={t} locale={locale} />
        <section className="max-w-3xl mx-auto px-8 py-16 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-3">
            {detail.hypothesis.code} · {pickField(detail.hypothesis, locale, "journal_target")} · {detail.hypothesis.status}
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-3">{pickField(detail.hypothesis, locale, "title")}</h1>
          <p className="italic text-[#0a8060] text-lg mb-10">&ldquo;{pickField(detail.hypothesis, locale, "paradox")}&rdquo;</p>

          <div className="border border-[#e6e8ec] bg-white rounded-2xl p-8 max-w-xl mx-auto">
            <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-2">
              {t.ppt_expand_eyebrow}
            </div>
            <p className="text-sm text-[#4b5263] mb-6 italic">
              {t.ppt_expand_desc}
            </p>
            <ModelPicker
              value={modelProvider}
              onChange={setModelProvider}
              disabled={generating}
            />
            <button
              onClick={() => generate("single")}
              disabled={generating}
              className="mt-5 w-full bg-[#0e1117] text-[#ffffff] px-8 py-4 rounded-full font-medium hover:bg-[#0a8060] disabled:opacity-40 transition"
            >
              {generating && generatingMode === "single" ? t.ppt_generating : t.ppt_generate_current}
            </button>
            <button
              onClick={() => generate("all")}
              disabled={generating}
              className="mt-3 w-full border border-[#0e1117] px-8 py-4 rounded-full font-medium hover:bg-[#0e1117] hover:text-white disabled:opacity-40 transition"
            >
              {generating && generatingMode === "all" ? t.ppt_generating_all : t.ppt_generate_all}
            </button>
            {error && <div className="text-sm text-red-700 mt-4">{error}</div>}
          </div>
        </section>
      </main>
    );
  }

  // pick the proposal in the active locale, falling back to the canonical one
  const activeVariant = detail.proposal_variants?.[modelProvider] || null;
  const p = activeVariant
    ? ((locale === "en" ? activeVariant.proposal_en : activeVariant.proposal_zh) || activeVariant.proposal)
    : ((locale === "en" ? detail.proposal_en : detail.proposal_zh) || detail.proposal);
  if (!p) {
    return <Loading text={t.ppt_load_fail} error />;
  }
  const h = detail.hypothesis;

  const slides: { title: string; body: ReactNode }[] = [
    // SLIDE 0 · Cover
    {
      title: "Cover",
      body: (
        <CoverSlide h={h} t={t} locale={locale} />
      ),
    },
    // SLIDE 1 · One-line question
    {
      title: t.ppt_slide_question,
      body: (
        <BigQuote
          eyebrow={t.ppt_slide_question}
          quote={p.one_line_question}
          footer={`${t.ppt_theory_anchors}: ${pickField(h, locale, "theory_anchor")}`}
        />
      ),
    },
    // SLIDE 2 · Why Solvea-exclusive
    {
      title: t.ppt_h_why_solvea,
      body: (
        <NumberedList
          eyebrow="DATA UNIQUENESS"
          heading={t.ppt_h_why_solvea}
          items={p.why_solvea_exclusive}
        />
      ),
    },
    // SLIDE 4 · Experiment design
    {
      title: t.ppt_design,
      body: (
        <ExperimentSlide design={p.experiment_design} identification={pickField(h, locale, "identification")} t={t} />
      ),
    },
    // SLIDE 5 · Causal identification
    {
      title: t.ppt_causal_plan,
      body: (
        <CausalSlide causal={p.causal_identification} fallbackIdentification={pickField(h, locale, "identification")} t={t} />
      ),
    },
    // SLIDE 6 · Outcomes
    {
      title: t.ppt_outcomes,
      body: (
        <OutcomesSlide outcomes={p.outcomes} t={t} />
      ),
    },
    // SLIDE 7 · Pre-registered hypotheses
    {
      title: t.ppt_hypotheses,
      body: (
        <HypothesesSlide items={p.pre_registered_hypotheses} t={t} />
      ),
    },
    // SLIDE 8 · Sample size & power
    {
      title: t.ppt_sample_power,
      body: (
        <SampleSizeSlide s={p.sample_size} t={t} />
      ),
    },
    // SLIDE 9 · Implementation cost
    {
      title: t.ppt_implementation,
      body: (
        <ImplementationSlide impl={p.implementation} t={t} />
      ),
    },
    // SLIDE 10 · Journal targets
    {
      title: t.ppt_journals,
      body: (
        <JournalsSlide targets={p.journal_targets} t={t} />
      ),
    },
    // SLIDE 11 · Theory anchors
    {
      title: t.ppt_theory_anchors,
      body: (
        <TheorySlide anchors={p.theory_anchors} t={t} />
      ),
    },
    // SLIDE 12 · Risks
    {
      title: t.ppt_risks,
      body: (
        <RisksSlide risks={p.risks} t={t} />
      ),
    },
    // SLIDE 13 · Elevator pitches
    {
      title: t.ppt_pitches,
      body: (
        <PitchesSlide pitches={p.elevator_pitches} t={t} />
      ),
    },
    // SLIDE 14 (last) · Why top-tier — moved to the end per request
    {
      title: t.ppt_h_why_top,
      body: (
        <NumberedList
          eyebrow="WHY TOP-TIER"
          heading={t.ppt_h_why_top}
          items={p.why_top_tier}
        />
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#0e1117]  flex flex-col">
      <Header
        h={h}
        onRegenerate={() => generate("single")}
        onGenerateAll={() => generate("all")}
        generating={generating}
        generatingMode={generatingMode}
        t={t}
        locale={locale}
        modelPicker={
          <ModelPicker
            value={modelProvider}
            onChange={setModelProvider}
            disabled={generating}
            compact
          />
        }
      />

      <div className="flex-1 flex flex-col px-8 py-6 max-w-5xl mx-auto w-full">
        <ProposalModelTabs
          value={modelProvider}
          onChange={setModelProvider}
          variants={detail.proposal_variants || {}}
          onGenerate={(prov) => generate("single", prov)}
          genProvider={genProvider}
          generating={generating}
          t={t}
        />
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263]">
            {slides[slideIdx].title}
          </div>
          <div className="text-xs font-mono text-[#4b5263]">
            <span className="text-[#0e1117] font-bold">{slideIdx + 1}</span>
            <span> / {slides.length}</span>
          </div>
        </div>

        {/* SLIDE BODY */}
        <div className="flex-1 border border-[#e6e8ec] rounded-2xl bg-white p-10 md:p-14 min-h-[60vh]">
          {slides[slideIdx].body}
        </div>

        {/* NAV */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
            disabled={slideIdx === 0}
            className="px-5 py-2 border border-[#0e1117] rounded-full font-medium disabled:opacity-30 hover:bg-[#0e1117] hover:text-[#ffffff] transition"
          >
            {t.ppt_prev}
          </button>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIdx(i)}
                className={`h-2 w-6 rounded-full transition ${
                  i === slideIdx ? "bg-[#0a8060]" : "bg-[#e6e8ec]"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
            disabled={slideIdx === slides.length - 1}
            className="px-5 py-2 bg-[#0e1117] text-[#ffffff] rounded-full font-medium disabled:opacity-30 hover:bg-[#0a8060] transition"
          >
            {t.ppt_next}
          </button>
        </div>

        <div className="text-center text-xs font-mono text-[#4b5263] mt-3 italic">
          {t.ppt_nav_hint}
        </div>
      </div>
    </main>
  );
}

// ═══════════ SLIDE COMPONENTS ═══════════

function CoverSlide({ h, t, locale }: { h: Hypothesis; t: T; locale: Loc }) {
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-4">
        {h.code} · {pickField(h, locale, "journal_target")} · {h.status}
      </div>
      <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
        {pickField(h, locale, "title")}
      </h1>
      <p className="italic text-2xl text-[#0a8060] mb-8 leading-relaxed border-l-4 border-[#0a8060] pl-4">
        &ldquo;{pickField(h, locale, "paradox")}&rdquo;
      </p>
      <div className="flex gap-6 text-sm font-mono text-[#4b5263]">
        <span>{t.dash_feas} {"★".repeat(h.feasibility_6mo)}{"☆".repeat(5 - h.feasibility_6mo)}</span>
        <span>{t.dash_ab} {"★".repeat(6 - h.ab_test_difficulty)}{"☆".repeat(h.ab_test_difficulty - 1)}</span>
      </div>
      <div className="mt-12 text-sm text-[#4b5263] font-mono">
        郭振 · HKU DBA · arxify.io
      </div>
    </div>
  );
}

function BigQuote({ eyebrow, quote, footer }: { eyebrow: string; quote: string; footer?: string }) {
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-6">{eyebrow}</div>
      <blockquote className="text-3xl md:text-4xl font-extrabold leading-tight border-l-4 border-[#0a8060] pl-6 mb-6">
        {quote}
      </blockquote>
      {footer && <div className="text-sm text-[#4b5263] italic mt-4">{footer}</div>}
    </div>
  );
}

function NumberedList({ eyebrow, heading, items }: { eyebrow: string; heading: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{eyebrow}</div>
      <h2 className="text-3xl font-extrabold mb-8">{heading}</h2>
      <ol className="space-y-4">
        {items.map((s, i) => (
          <li key={i} className="flex gap-4 items-start">
            <span className="font-mono text-[#0a8060] font-bold text-lg w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-lg leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ExperimentSlide({ design, identification, t }: { design: any; identification: string; t: T }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_design}</div>
      <h2 className="text-3xl font-extrabold mb-6">{design.approach}</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <KV k={t.ppt_rand_unit} v={design.randomization_unit} />
        <KV k={t.ppt_duration} v={`${design.duration_weeks}${t.ppt_weeks_unit}`} />
        <KV k={t.ppt_logic} v={design.randomization_logic} span="md:col-span-2" />
      </div>

      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-3">{t.ppt_treatment_arms}</div>
        <ol className="space-y-2">
          {design.treatment_arms.map((arm: string, i: number) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="font-mono text-[#0a8060] font-bold w-6 shrink-0">T{i}</span>
              <span>{arm}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-[#e7f4ee] border-l-2 border-[#0a8060] p-4 text-sm italic">
        <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-1 not-italic">{t.ppt_identification}</div>
        {identification}
      </div>
    </div>
  );
}

function CausalSlide({
  causal,
  fallbackIdentification,
  t,
}: {
  causal?: Proposal["causal_identification"];
  fallbackIdentification: string;
  t: T;
}) {
  if (!causal) {
    return (
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_causal_plan}</div>
        <h2 className="text-3xl font-extrabold mb-6">{t.ppt_h_causal}</h2>
        <div className="bg-[#fff7ed] border-l-2 border-[#ea580c] p-5 text-base leading-relaxed">
          <div className="text-xs font-mono uppercase tracking-widest text-[#9a3412] mb-2">{t.ppt_old_proposal_note}</div>
          {fallbackIdentification}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_causal_plan}</div>
      <h2 className="text-3xl font-extrabold mb-6">{causal.preferred_design}</h2>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <KV k={t.ppt_causal_question} v={causal.causal_question} span="md:col-span-2" />
        <KV k={t.ppt_estimand} v={causal.estimand} />
        <KV k={t.ppt_unit_analysis} v={causal.unit_of_analysis} />
        <KV k={t.ppt_assignment} v={causal.assignment_mechanism} span="md:col-span-2" />
        <KV k={t.ppt_counterfactual} v={causal.control_or_counterfactual} span="md:col-span-2" />
      </div>

      <div className="bg-[#e7f4ee] border-l-2 border-[#0a8060] p-4 mb-5 text-sm leading-relaxed">
        <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-1">{t.ppt_identifying_assumption}</div>
        {causal.identifying_assumption}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <CheckList title={t.ppt_balance_checks} items={causal.balance_checks} />
        <CheckList title={t.ppt_manipulation_checks} items={causal.manipulation_checks} />
      </div>

      <div className="border border-[#e6e8ec] rounded-xl p-4">
        <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-3">{t.ppt_threats}</div>
        <div className="space-y-3">
          {causal.threats_to_causality.map((threat, i) => (
            <div key={i} className="text-sm leading-relaxed">
              <strong>{threat.threat}</strong>
              <span className="text-[#4b5263]"> · {threat.test} · {threat.fix}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm font-medium text-[#0a8060]">{causal.decision_rule}</div>
    </div>
  );
}

function OutcomesSlide({ outcomes, t }: { outcomes: any; t: T }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_outcomes}</div>
      <h2 className="text-3xl font-extrabold mb-6">{t.ppt_h_outcomes}</h2>

      <div className="grid md:grid-cols-3 gap-5">
        <OutcomeCol label={t.ppt_primary} items={outcomes.primary} highlight />
        <OutcomeCol label={t.ppt_secondary} items={outcomes.secondary} />
        <OutcomeCol label={t.ppt_mediators} items={outcomes.mediators} />
      </div>
    </div>
  );
}

function CheckList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-[#e6e8ec] rounded-xl p-4">
      <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-3">{title}</div>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => <li key={i} className="leading-snug">· {it}</li>)}
      </ul>
    </div>
  );
}

function OutcomeCol({ label, items, highlight }: { label: string; items: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "border-2 border-[#0a8060] bg-[#e7f4ee]" : "border border-[#e6e8ec]"}`}>
      <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-3">{label}</div>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => <li key={i} className="leading-snug">· {it}</li>)}
      </ul>
    </div>
  );
}

function HypothesesSlide({ items, t }: { items: any[]; t: T }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_pre_registered}</div>
      <h2 className="text-3xl font-extrabold mb-6">{t.ppt_hypotheses}</h2>
      <ol className="space-y-4">
        {items.map((h, i) => (
          <li key={i} className="border-l-2 border-[#0a8060] pl-4 py-1">
            <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-1">
              {h.id}{h.direction ? ` · ${h.direction}` : ""}
            </div>
            <div className="text-base leading-relaxed">{h.statement}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SampleSizeSlide({ s, t }: { s: any; t: T }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_sample_power}</div>
      <h2 className="text-3xl font-extrabold mb-8">{t.ppt_h_sample}</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <BigStat label={t.ppt_per_arm} value={s.per_arm?.toLocaleString?.() || s.per_arm} />
        <BigStat label={t.ppt_total_n} value={s.total?.toLocaleString?.() || s.total} />
        <BigStat label={t.ppt_power} value={`${(s.power * 100).toFixed(0)}%`} />
        <BigStat label="α" value={String(s.alpha)} />
      </div>
      <div className="space-y-3 text-sm">
        <KV k={t.ppt_mde} v={s.mde} />
        <KV k={t.ppt_weeks_collect} v={`${s.weeks_to_collect}`} />
      </div>
    </div>
  );
}

function ImplementationSlide({ impl, t }: { impl: any; t: T }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_implementation}</div>
      <h2 className="text-3xl font-extrabold mb-6">{t.ppt_h_impl}</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <BigStat label={t.ppt_engineering} value={`${impl.engineering_days} d`} />
        <BigStat label={t.ppt_compute_cost} value={impl.cost_usd} />
        <BigStat label={t.ppt_ops_needed} value={`${impl.ops_steps.length}`} />
      </div>
      <div className="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-2">{t.ppt_ops_steps}</div>
          <ul className="space-y-1">{impl.ops_steps.map((s: string, i: number) => <li key={i}>· {s}</li>)}</ul>
        </div>
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-2">{t.ppt_dependencies}</div>
          <ul className="space-y-1">{impl.dependencies.map((d: string, i: number) => <li key={i}>· {d}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function JournalsSlide({ targets, t }: { targets: any[]; t: T }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_journals}</div>
      <h2 className="text-3xl font-extrabold mb-6">{t.ppt_h_journals}</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {targets.map((tg, i) => (
          <div key={i} className={`rounded-xl p-5 ${tg.tier === "primary" ? "border-2 border-[#0a8060] bg-[#e7f4ee]" : "border border-[#e6e8ec]"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-xl">{tg.journal}</div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#4b5263]">{tg.tier}</span>
            </div>
            <div className="text-sm text-[#4b5263] italic">{tg.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TheorySlide({ anchors, t }: { anchors: any[]; t: T }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_theory_anchors}</div>
      <h2 className="text-3xl font-extrabold mb-6">{t.ppt_h_theory}</h2>
      <div className="space-y-4">
        {anchors.map((a, i) => (
          <div key={i} className="border-l-2 border-[#0a8060] pl-4 py-1">
            <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-1">{a.role}</div>
            <div className="font-bold mb-1">{a.theory}</div>
            <div className="text-sm text-[#4b5263] italic">{a.citation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RisksSlide({ risks, t }: { risks: any[]; t: T }) {
  const sev = (s: string) =>
    s === "high" ? "bg-red-100 text-red-900 border-red-300" :
    s === "low" ? "bg-green-100 text-green-900 border-green-300" :
    "bg-amber-100 text-amber-900 border-amber-300";
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_risks}</div>
      <h2 className="text-3xl font-extrabold mb-6">{t.ppt_h_risks}</h2>
      <div className="space-y-3">
        {risks.map((r, i) => (
          <div key={i} className="border border-[#e6e8ec] rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="font-bold text-base flex-1">{r.risk}</div>
              <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${sev(r.severity)}`}>{r.severity}</span>
            </div>
            <div className="text-sm text-[#4b5263]"><strong className="text-[#0e1117]">{t.ppt_mitigation}</strong>{r.mitigation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PitchesSlide({ pitches, t }: { pitches: any; t: T }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060] mb-2">{t.ppt_pitches}</div>
      <h2 className="text-3xl font-extrabold mb-6">{t.ppt_h_pitches}</h2>
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
    <div className="border border-[#e6e8ec] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold">{advisor}</div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#4b5263]">{flavor}</span>
      </div>
      <p className="text-sm italic text-[#0e1117] leading-relaxed">&ldquo;{content}&rdquo;</p>
    </div>
  );
}

// ─── shared bits ───────────────────────────────────────────

function KV({ k, v, span }: { k: string; v: string; span?: string }) {
  return (
    <div className={span}>
      <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-1">{k}</div>
      <div className="text-base">{v}</div>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#e6e8ec] rounded-xl p-4">
      <div className="text-xs font-mono uppercase tracking-widest text-[#4b5263] mb-1">{label}</div>
      <div className="font-extrabold text-3xl text-[#0a8060]">{value}</div>
    </div>
  );
}

function Header({
  h,
  onRegenerate,
  onGenerateAll,
  generating,
  generatingMode,
  t,
  locale,
  modelPicker,
}: {
  h: Hypothesis;
  onRegenerate?: () => void;
  onGenerateAll?: () => void;
  generating?: boolean;
  generatingMode?: "single" | "all" | null;
  t: T;
  locale: Loc;
  modelPicker?: ReactNode;
}) {
  return (
    <header className="border-b border-[#e6e8ec]">
      <div className="flex items-center justify-between px-6 py-3 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/dashboard?tab=hypotheses" className="text-xs font-mono uppercase tracking-widest text-[#4b5263] hover:text-[#0e1117]">
            {t.ppt_back}
          </Link>
          <div className="text-xs font-mono uppercase tracking-widest text-[#0a8060]">
            {h.code} · {pickField(h, locale, "journal_target")}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {modelPicker}
          <LocaleSwitcher />
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={generating}
              className="text-xs font-mono text-[#4b5263] hover:text-[#0e1117] disabled:opacity-40"
            >
              {generating && generatingMode === "single" ? t.ppt_generating : t.ppt_generate_current}
            </button>
          )}
          {onGenerateAll && (
            <button
              onClick={onGenerateAll}
              disabled={generating}
              className="text-xs font-mono text-[#0a8060] hover:text-[#0e1117] disabled:opacity-40"
            >
              {generating && generatingMode === "all" ? t.ppt_generating_all : t.ppt_generate_all}
            </button>
          )}
          <Link href="/" className="text-xl font-bold tracking-tight">
            arxify<span className="text-[#0a8060]">.io</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProposalModelTabs({
  value,
  onChange,
  variants,
  onGenerate,
  genProvider,
  generating,
  t,
}: {
  value: ProposalModelProvider;
  onChange: (value: ProposalModelProvider) => void;
  variants: Partial<Record<ProposalModelProvider, ProposalVariant>>;
  onGenerate: (provider: ProposalModelProvider) => void;
  genProvider: ProposalModelProvider | null;
  generating: boolean;
  t: T;
}) {
  const total = PROPOSAL_MODELS.length;
  const done = Object.keys(variants).length;

  return (
    <div className="mb-5 border border-[#e6e8ec] bg-white rounded-xl p-2">
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#4b5263]">
          {t.ppt_model_compare}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#0a8060]">
          {done}/{total}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {PROPOSAL_MODELS.map((model) => {
          const variant = variants[model.id];
          const active = value === model.id;
          const busy = genProvider === model.id;
          return (
            <div
              key={model.id}
              onClick={() => variant && onChange(model.id)}
              className={[
                "rounded-lg border px-3 py-2 transition flex flex-col gap-2",
                active && variant ? "border-[#0a8060] bg-[#e7f4ee]" : "border-[#e6e8ec]",
                variant ? "cursor-pointer hover:border-[#0a8060]" : "",
              ].join(" ")}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{model.label}</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#4b5263]">
                    {model.source}
                  </span>
                </div>
                <div className={[
                  "mt-1 text-[10px] font-mono uppercase tracking-widest",
                  variant ? "text-[#0a8060]" : "text-[#9aa1ad]",
                ].join(" ")}>
                  {busy ? t.ppt_generating : variant ? t.ppt_generated : t.ppt_not_generated}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onGenerate(model.id); }}
                disabled={generating}
                className={[
                  "text-[11px] font-medium rounded-md px-2 py-1.5 transition disabled:opacity-40",
                  variant
                    ? "border border-[#d7dbe3] text-[#4b5263] hover:border-[#0a8060] hover:text-[#0a8060]"
                    : "bg-[#0e1117] text-white hover:bg-[#0a8060]",
                ].join(" ")}
              >
                {busy ? "…" : variant ? t.ppt_regenerate : t.ppt_generate}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModelPicker({
  value,
  onChange,
  disabled,
  compact = false,
}: {
  value: ProposalModelProvider;
  onChange: (value: ProposalModelProvider) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <label className={compact ? "flex items-center gap-2" : "block text-left"}>
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#4b5263]">
        Model
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as ProposalModelProvider)}
        className={[
          "border border-[#d7dbe3] bg-white text-[#0e1117] font-mono text-xs outline-none",
          "focus:border-[#0a8060] disabled:opacity-50",
          compact ? "h-8 rounded-md px-2" : "mt-2 h-11 w-full rounded-lg px-3",
        ].join(" ")}
      >
        {PROPOSAL_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label} · {model.source}
          </option>
        ))}
      </select>
    </label>
  );
}

function Loading({ text, error }: { text: string; error?: boolean }) {
  return (
    <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center ">
      <p className={`italic ${error ? "text-red-700" : "text-[#4b5263]"}`}>{text}</p>
    </main>
  );
}
