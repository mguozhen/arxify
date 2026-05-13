// arxify.io — Try it now (public demo, no auth)

"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useLocale } from "@/lib/locale";

type IdeaCard = {
  title: string;
  paradox: string;
  hypothesis: string;
  identification: string;
  theory_anchor: string;
  journal_target: string;
  feasibility_6mo: number;
  ab_test_difficulty: number;
};

type DemoResponse = {
  ideas: IdeaCard[];
  model_used: string;
  cost_credits: number;
};

type Critique = {
  novelty_score: number;
  top_weaknesses: string[];
  missing_anchors: string[];
  reviewer2_kill_shot: string;
  improvement: string;
  verdict: "ACCEPT" | "MAJOR_REVISION" | "REJECT" | string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const EXAMPLE = `我是 HKU DBA 学生，研究 LLM 客服系统。我们公司有多租户 SaaS 平台，280 个企业客户、19 亿条客服对话、870 万次 AI→人工 handoff 事件，数据覆盖 2024 年至今。我想找一个能在 6 个月内做完的研究方向，目标顶刊（JM/MarkSci/MISQ）。已经写完一篇 H3 handoff agency paradox 的 paper。`;

export default function TryPage() {
  const { t } = useLocale();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DemoResponse | null>(null);

  async function handleSubmit() {
    if (input.trim().length < 20) {
      setError(t.try_error_short);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API_URL}/api/demo/ideation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`API ${r.status}: ${txt.slice(0, 200)}`);
      }
      const data = (await r.json()) as DemoResponse;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <Nav />

      <section className="max-w-3xl mx-auto px-8 py-12">
        <div className="eyebrow mb-3">{t.try_eyebrow}</div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-4">
          {t.try_title_a} <span className="text-[#1e40af]">{t.try_title_b}</span>.
        </h1>
        <p className="text-lg text-[#64748b] mb-8 leading-relaxed">
          {t.try_desc}
        </p>

        <div className="border border-[#e5e7eb] rounded-xl bg-white p-6 mb-6">
          <label className="eyebrow block mb-2">{t.try_label}</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.try_placeholder}
            rows={8}
            className="w-full px-4 py-3 border border-[#e5e7eb] rounded-md focus:border-[#1e40af] focus:outline-none resize-y text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setInput(EXAMPLE)}
              className="text-sm text-[#64748b] underline hover:text-[#1e40af]"
            >
              {t.try_example_btn}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || input.length < 20}
              className="bg-[#0a0a0a] text-white px-7 py-3 rounded-md font-medium hover:bg-[#1e40af] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? t.try_thinking : t.try_submit}
            </button>
          </div>
        </div>

        {error && (
          <div className="border border-red-300 bg-red-50 text-red-800 rounded-lg p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div>
            <div className="text-xs font-mono text-[#64748b] mb-4 uppercase tracking-widest">
              {result.ideas.length} ideas · {result.model_used} · {result.cost_credits} credits
            </div>
            <div className="space-y-4">
              {result.ideas.map((idea, i) => (
                <IdeaCardView idea={idea} key={i} index={i + 1} />
              ))}
            </div>

            <div className="mt-10 border-t border-[#e5e7eb] pt-8 text-center">
              <p className="text-[#64748b] mb-4">{t.try_cta_more}</p>
              <Link
                href="/pricing"
                className="inline-block bg-[#0a0a0a] text-white px-7 py-3 rounded-md font-medium hover:bg-[#1e40af] transition"
              >
                {t.try_cta_plans}
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function IdeaCardView({ idea, index }: { idea: IdeaCard; index: number }) {
  const { t } = useLocale();
  const [critique, setCritique] = useState<Critique | null>(null);
  const [critLoading, setCritLoading] = useState(false);
  const [critError, setCritError] = useState<string | null>(null);

  async function runCritique() {
    setCritLoading(true);
    setCritError(null);
    try {
      const r = await fetch(`${API_URL}/api/demo/critique`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(idea),
      });
      if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
      setCritique(await r.json());
    } catch (e) {
      setCritError(e instanceof Error ? e.message : String(e));
    } finally {
      setCritLoading(false);
    }
  }

  return (
    <div className="border border-[#e5e7eb] rounded-2xl bg-white p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af]">
          {String(index).padStart(2, "0")} · {idea.journal_target}
        </div>
        <div className="flex gap-3 text-xs font-mono text-[#64748b]">
          <span>Feasibility {"★".repeat(idea.feasibility_6mo)}{"☆".repeat(5 - idea.feasibility_6mo)}</span>
          <span>A/B {"★".repeat(6 - idea.ab_test_difficulty)}{"☆".repeat(idea.ab_test_difficulty - 1)}</span>
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2 leading-snug">{idea.title}</h3>
      <p className="italic text-[#1e40af] mb-4">&ldquo;{idea.paradox}&rdquo;</p>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-mono uppercase tracking-widest text-[#64748b]">Hypothesis</dt>
          <dd className="text-[#0a0a0a]">{idea.hypothesis}</dd>
        </div>
        <div>
          <dt className="text-xs font-mono uppercase tracking-widest text-[#64748b]">Identification</dt>
          <dd className="text-[#0a0a0a]">{idea.identification}</dd>
        </div>
        <div>
          <dt className="text-xs font-mono uppercase tracking-widest text-[#64748b]">Theory anchor</dt>
          <dd className="text-[#0a0a0a]">{idea.theory_anchor}</dd>
        </div>
      </dl>

      <div className="mt-5 pt-4 border-t border-[#f1f5f9]">
        {!critique && !critLoading && (
          <button
            onClick={runCritique}
            className="text-sm font-mono text-[#1e40af] hover:text-[#0a0a0a] uppercase tracking-widest"
          >
            {t.try_critique_btn}
          </button>
        )}
        {critLoading && (
          <div className="text-sm font-mono text-[#64748b] italic">
            {t.try_critique_loading}
          </div>
        )}
        {critError && (
          <div className="text-sm text-red-700">{critError}</div>
        )}
        {critique && (
          <CritiqueView c={critique} />
        )}
      </div>
    </div>
  );
}

function CritiqueView({ c }: { c: Critique }) {
  const verdictColor =
    c.verdict === "ACCEPT" ? "bg-green-100 text-green-900 border-green-300" :
    c.verdict === "REJECT" ? "bg-red-100 text-red-900 border-red-300" :
    "bg-amber-100 text-amber-900 border-amber-300";

  return (
    <div className="bg-[#eff6ff] rounded-xl p-5 mt-3 border border-[#f1f5f9]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono uppercase tracking-widest text-[#0a0a0a]">
          DEEP CRITIQUE
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#64748b]">Novelty</span>
          <span className="font-bold text-2xl text-[#1e40af]">
            {c.novelty_score}<span className="text-sm text-[#64748b]">/10</span>
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${verdictColor}`}>
            {c.verdict}
          </span>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1">Top Weaknesses</div>
          <ul className="list-decimal pl-5 space-y-1">
            {c.top_weaknesses.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1">Missing Anchors</div>
          <ul className="list-disc pl-5 space-y-1 text-[#0a0a0a]">
            {c.missing_anchors.map((a, i) => <li key={i} className="italic">{a}</li>)}
          </ul>
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1">Reviewer 2&apos;s Kill Shot</div>
          <p className="italic border-l-2 border-red-400 pl-3">{c.reviewer2_kill_shot}</p>
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1">One Concrete Fix</div>
          <p className="border-l-2 border-[#1e40af] pl-3">{c.improvement}</p>
        </div>
      </div>
    </div>
  );
}
