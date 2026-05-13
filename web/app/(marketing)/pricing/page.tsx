// arxify.ai — pricing page
// Anchored to Manus tiers but priced for academic output (paper > task).

import Link from "next/link";

export const metadata = {
  title: "Pricing — arxify.ai",
  description: "Free tier ships every week. Scholar $39/mo. Lab $99/mo.",
};

type Plan = {
  code: "spark" | "scholar" | "lab";
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  credits: number;
  features: string[];
  highlight?: boolean;
  cta: string;
};

const PLANS: Plan[] = [
  {
    code: "spark",
    name: "Spark",
    tagline: "Your first paper",
    monthly: 0,
    yearly: 0,
    credits: 300,
    features: [
      "1 active project",
      "1 ideation run / mo (5 directions)",
      "Lit search up to 100 papers / mo",
      "Outline + executive summary",
      "DeepCritique sample (1 / mo)",
      "Community Discord access",
    ],
    cta: "Start free",
  },
  {
    code: "scholar",
    name: "Scholar",
    tagline: "Your dissertation",
    monthly: 39,
    yearly: 33, // ~15% off
    credits: 5000,
    features: [
      "Unlimited projects",
      "Unlimited ideation + ranking + tournament",
      "Full experiment design",
      "Paper draft 2K words",
      "Data upload UI (CSV / PDF / experiment logs)",
      "Zotero sync",
      "DeepCritique unlimited",
      "Priority queue",
    ],
    highlight: true,
    cta: "Start 14-day trial",
  },
  {
    code: "lab",
    name: "Lab",
    tagline: "Your team",
    monthly: 99,
    yearly: 84,
    credits: 15000,
    features: [
      "Everything in Scholar",
      "Team — 3 seats",
      "Full paper writeup (8K words)",
      "Sandbox experiment execution (Modal)",
      "REST API access",
      "Institutional SSO",
      "Priority human support",
      "Slack collaboration",
    ],
    cta: "Talk to founder",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#1f1c17] font-serif">
      <Header />
      <section className="max-w-5xl mx-auto px-8 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
          Pricing for <span className="italic text-[#b85a3a]">researchers</span>
        </h1>
        <p className="text-xl text-[#6e6a5d] mb-12 max-w-2xl mx-auto">
          Start free. Upgrade when you ship your first paper. Cancel anytime.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {PLANS.map((p) => (
            <PlanCard plan={p} key={p.code} />
          ))}
        </div>

        <p className="mt-10 text-sm text-[#6e6a5d]">
          Annual billing saves <strong>~15%</strong>. Need more credits or seats?{" "}
          <a href="mailto:hello@arxify.ai" className="text-[#b85a3a] underline">
            Contact us
          </a>
          .
        </p>
      </section>

      <FAQ />
      <Footer />
    </main>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const isPaid = plan.monthly > 0;
  return (
    <div
      className={`rounded-2xl p-8 border ${
        plan.highlight
          ? "border-[#b85a3a] bg-[#f3eee2] shadow-lg"
          : "border-[#d3cdbe]"
      } flex flex-col`}
    >
      <div className="text-xs font-mono uppercase tracking-widest text-[#6e6a5d] mb-2">{plan.name}</div>
      <div className="text-sm text-[#6e6a5d] italic mb-4">{plan.tagline}</div>

      <div className="mb-6">
        <div className="text-5xl font-extrabold leading-none">
          ${plan.monthly}
          <span className="text-base font-normal text-[#6e6a5d]"> / mo</span>
        </div>
        {isPaid && (
          <div className="text-sm text-[#6e6a5d] mt-1">
            ${plan.yearly}/mo billed yearly
          </div>
        )}
      </div>

      <div className="text-sm font-mono text-[#1f1c17] mb-4">
        {plan.credits.toLocaleString()} credits / mo
      </div>

      <ul className="space-y-2 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <span className="text-[#b85a3a] mt-1">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.code === "lab" ? "mailto:hello@arxify.ai" : `/signup?plan=${plan.code}`}
        className={`block text-center py-3 rounded-full font-medium ${
          plan.highlight
            ? "bg-[#1f1c17] text-[#fafaf7] hover:bg-[#b85a3a]"
            : "border border-[#1f1c17] hover:bg-[#1f1c17] hover:text-[#fafaf7]"
        } transition`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

function FAQ() {
  const faqs = [
    { q: "What's a credit?", a: "Roughly 1 LLM call. Ideation runs ~500 credits. Tournament ~800. Full paper writeup ~1500. Free 300/mo lets you try most operations." },
    { q: "Can I bring my own API keys?", a: "Yes, Lab tier supports BYOK (Anthropic, MiroMind). Credit consumption falls to platform overhead only (~10%)." },
    { q: "Do you train on my data?", a: "Never. Your inputs, ideas, and papers are private. We use vendor LLM APIs (Anthropic, MiroMind) under their no-training agreements." },
    { q: "What if my generated paper isn't usable?", a: "Refund any unused credits within 30 days, no questions. We're a draft generator, not a magic wand." },
    { q: "Is it really open source?", a: "Core pipeline yes (AGPL ai-researcher fork on GitHub). SaaS layer (this site, auth, billing, UI) is source-available but not open license." },
    { q: "Can I use this for my thesis?", a: "We were built for this. The first paying customer used it for their HKU DBA dissertation." },
  ];

  return (
    <section className="max-w-3xl mx-auto px-8 py-20">
      <h2 className="text-3xl font-extrabold mb-10">Frequently asked</h2>
      <dl className="space-y-8">
        {faqs.map((f) => (
          <div key={f.q}>
            <dt className="font-bold text-lg mb-2">{f.q}</dt>
            <dd className="text-[#6e6a5d] leading-relaxed">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
      <Link href="/" className="text-xl font-bold tracking-tight">
        arxify<span className="text-[#b85a3a]">.ai</span>
      </Link>
      <nav className="flex items-center gap-6 text-sm font-medium">
        <Link href="/pricing" className="hover:text-[#b85a3a]">Pricing</Link>
        <a href="https://github.com/mguozhen/ai-researcher" target="_blank" rel="noreferrer" className="hover:text-[#b85a3a]">
          GitHub
        </a>
        <Link
          href="/signup"
          className="bg-[#1f1c17] text-[#fafaf7] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#b85a3a] transition"
        >
          Start free
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#d3cdbe] py-10 px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#6e6a5d]">
        <div>arxify.ai · From idea to paper</div>
        <div className="flex gap-6">
          <Link href="/pricing">Pricing</Link>
          <a href="https://github.com/mguozhen/ai-researcher" target="_blank" rel="noreferrer">GitHub</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
