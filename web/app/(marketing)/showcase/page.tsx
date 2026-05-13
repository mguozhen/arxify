// Static showcase page — hardcoded example ideas + critique for screenshots / xhs.
// No API calls. Pure render. Use this for marketing material.

import Link from "next/link";

const IDEAS = [
  {
    title: "The Handoff Paradox: Why Seamless AI-Human Transfers Reduce Customer Satisfaction",
    paradox: "Making AI-to-human handoffs faster paradoxically decreases satisfaction — seamless transitions signal the AI was hiding its inability.",
    hypothesis: "Customers handed off in <30s rate the experience lower than those handed off in 60-120s, controlling for resolution success.",
    identification: "Difference-in-differences using a platform-wide change to handoff threshold timing (treated tenants vs untreated).",
    theory_anchor: "Buell & Norton (2011) Operational Transparency, Mgmt Sci.",
    journal_target: "MISQ",
    feasibility_6mo: 5,
    ab_test_difficulty: 1,
  },
  {
    title: "The Transparency Tax: How Disclosing AI Limitations Increases Escalation Rates",
    paradox: "Explicitly telling customers when AI cannot help increases immediate handoff requests but improves long-term trust — a short-term cost for long-term value.",
    hypothesis: "Tenants displaying AI confidence/uncertainty scores have 30% higher handoff rates but 15% higher NPS after 90 days.",
    identification: "Tenant fixed effects + event study around staged rollout of confidence-disclosure feature.",
    theory_anchor: "Kim et al. (2024) verbalized uncertainty, FAccT.",
    journal_target: "Mgmt Sci",
    feasibility_6mo: 4,
    ab_test_difficulty: 1,
  },
  {
    title: "The Expertise Trap: Why Routing Complex Queries to Expert Agents Backfires",
    paradox: "Routing high-complexity conversations to the most expert human agents decreases resolution rates because experts are over-allocated and under-empathetic.",
    hypothesis: "Conversations routed to top-tier agents have lower CSAT than those routed to median agents in the same complexity tier.",
    identification: "RDD around the platform's complexity-score routing threshold.",
    theory_anchor: "Acemoglu-Restrepo (2018) Task Framework, AER.",
    journal_target: "Org Sci",
    feasibility_6mo: 4,
    ab_test_difficulty: 2,
  },
];

const CRITIQUE = {
  novelty_score: 6,
  top_weaknesses: [
    "Selection on unobservables: tenants choosing to enable transparency are likely already higher-quality.",
    "30/120s threshold is arbitrary — needs theoretical justification or pre-registration.",
    "Confounding by AI quality: better AI both handles handoffs faster AND has higher CSAT.",
  ],
  missing_anchors: [
    "Dietvorst, Simmons & Massey (2015) Algorithm Aversion, JEPG",
    "Logg, Minson & Moore (2019) Algorithm Appreciation, OBHDP",
    "Longoni, Bonezzi & Morewedge (2019) Resistance to Medical AI, JCR",
  ],
  reviewer2_kill_shot: "This paper commits the cardinal sin of confusing an empirical pattern with a theoretical mechanism. Even if your DID identification holds, you have not explained WHY customers infer 'hiding inability' from speed rather than 'efficiency.' Without a clean theoretical story, this is just an effect-hunting paper.",
  improvement: "Add a 2x2 vignette experiment (Study 2) crossing handoff speed × disclosure language to isolate the inference mechanism. This converts a 'find an effect' paper into a 'identify a mechanism' paper.",
  verdict: "MAJOR_REVISION",
};

export const metadata = {
  title: "Showcase — arxify.io",
  description: "What arxify generates in 30 seconds.",
};

export default function ShowcasePage() {
  return (
    <main className="min-h-screen bg-[#ffffff] text-[#0a0a0a] ">
      <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          arxify<span className="text-[#1e40af]">.io</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/try" className="hover:text-[#1e40af]">Try free</Link>
          <Link href="/pricing" className="hover:text-[#1e40af]">Pricing</Link>
          <Link href="/signup" className="bg-[#0a0a0a] text-[#ffffff] px-4 py-2 rounded-full">Join waitlist</Link>
        </nav>
      </header>

      <section className="max-w-3xl mx-auto px-8 py-12">
        <div className="text-xs font-mono uppercase tracking-widest text-[#1e40af] mb-3">
          ⚡ EXAMPLE OUTPUT · 30 SECOND GENERATION
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
          One prompt. <span className="italic text-[#1e40af]">Five directions.</span><br />
          Brutal peer review.
        </h1>
        <p className="text-lg italic text-[#64748b] mb-10">
          Input: &ldquo;I study LLM customer service with 1.9B conversations and 8.7M handoff
          events across 280 tenants. Want a 6-month feasible direction targeting MISQ.&rdquo;
        </p>

        <div className="space-y-5">
          {IDEAS.map((idea, i) => (
            <IdeaShowcase key={i} idea={idea} index={i + 1} showCritique={i === 0} />
          ))}
          <div className="text-center text-sm font-mono text-[#64748b] italic py-4">
            … plus 2 more ideas (truncated for showcase)
          </div>
        </div>

        <div className="mt-12 border-t border-[#e5e7eb] pt-10 text-center">
          <h2 className="text-2xl font-bold mb-3">Generate yours →</h2>
          <p className="text-[#64748b] mb-5">Free. No signup. ~30 seconds.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/try" className="bg-[#0a0a0a] text-[#ffffff] px-8 py-3 rounded-full font-medium hover:bg-[#1e40af] transition">
              Try with your context →
            </Link>
            <Link href="/signup" className="border border-[#0a0a0a] px-8 py-3 rounded-full font-medium hover:bg-[#0a0a0a] hover:text-[#ffffff] transition">
              Join waitlist
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function IdeaShowcase({ idea, index, showCritique }: { idea: typeof IDEAS[0]; index: number; showCritique: boolean }) {
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
          <dd>{idea.hypothesis}</dd>
        </div>
        <div>
          <dt className="text-xs font-mono uppercase tracking-widest text-[#64748b]">Identification</dt>
          <dd>{idea.identification}</dd>
        </div>
        <div>
          <dt className="text-xs font-mono uppercase tracking-widest text-[#64748b]">Theory anchor</dt>
          <dd>{idea.theory_anchor}</dd>
        </div>
      </dl>

      {showCritique && (
        <div className="mt-5 pt-4 border-t border-[#f1f5f9]">
          <div className="bg-[#eff6ff] rounded-xl p-5 border border-[#f1f5f9]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-mono uppercase tracking-widest text-[#0a0a0a]">
                ⚡ DEEP CRITIQUE
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#64748b]">Novelty</span>
                <span className="font-bold text-2xl text-[#1e40af]">
                  {CRITIQUE.novelty_score}<span className="text-sm text-[#64748b]">/10</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold border bg-amber-100 text-amber-900 border-amber-300">
                  {CRITIQUE.verdict}
                </span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1">Top Weaknesses</div>
                <ul className="list-decimal pl-5 space-y-1">
                  {CRITIQUE.top_weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1">Reviewer 2&apos;s Kill Shot</div>
                <p className="italic border-l-2 border-red-400 pl-3">{CRITIQUE.reviewer2_kill_shot}</p>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#64748b] mb-1">One Concrete Fix</div>
                <p className="border-l-2 border-[#1e40af] pl-3">{CRITIQUE.improvement}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
