// arxify.io — pricing
"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useLocale } from "@/lib/locale";

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
    code: "spark", name: "Spark", tagline: "Your first paper",
    monthly: 0, yearly: 0, credits: 300,
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
    code: "scholar", name: "Scholar", tagline: "Your dissertation",
    monthly: 39, yearly: 33, credits: 5000,
    features: [
      "Unlimited projects",
      "Unlimited ideation + ranking + tournament",
      "Full experiment design",
      "Paper draft 2K words",
      "Data upload UI",
      "Zotero sync",
      "DeepCritique unlimited",
      "Priority queue",
    ],
    highlight: true,
    cta: "Start 14-day trial",
  },
  {
    code: "lab", name: "Lab", tagline: "Your team",
    monthly: 99, yearly: 84, credits: 15000,
    features: [
      "Everything in Scholar",
      "Team — 3 seats",
      "Full paper writeup (8K words)",
      "Sandbox experiment execution",
      "REST API access",
      "Institutional SSO",
      "Priority human support",
      "Slack collaboration",
    ],
    cta: "Talk to founder",
  },
];

const FAQS = [
  { q: "What's a credit?", a: "Roughly 1 LLM call. Ideation ~500. Tournament ~800. Full writeup ~1500. Free 300/mo lets you try most operations." },
  { q: "Can I bring my own API keys?", a: "Yes — Lab tier supports BYOK (Anthropic, MiroMind). Platform overhead only (~10%)." },
  { q: "Do you train on my data?", a: "Never. Inputs, ideas, papers stay private. We use vendor LLM APIs under no-training agreements." },
  { q: "What if my paper isn't usable?", a: "Refund unused credits within 30 days, no questions. We're a draft generator, not a magic wand." },
  { q: "Open source?", a: "Core pipeline yes (MIT, GitHub). SaaS layer is source-available." },
  { q: "Can I use this for my thesis?", a: "We were built for this. The first paying customer used it for their HKU DBA dissertation." },
];

export default function PricingPage() {
  const { t } = useLocale();
  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <Nav />
      <section className="max-w-5xl mx-auto px-8 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
          {t.pricing_title_a} <span className="text-[#1e40af]">{t.pricing_title_b}</span>
        </h1>
        <p className="text-lg text-[#64748b] mb-12 max-w-2xl mx-auto">{t.pricing_subtitle}</p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {PLANS.map((p) => <PlanCard plan={p} key={p.code} />)}
        </div>

        <p className="mt-10 text-sm text-[#64748b]">
          {t.pricing_annual_note}{" "}
          <a href="mailto:hello@arxify.io" className="text-[#1e40af] underline">{t.pricing_contact}</a>.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold mb-8">{t.faq_title}</h2>
        <dl className="space-y-7">
          {FAQS.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-lg mb-2">{f.q}</dt>
              <dd className="text-[#64748b] leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const isPaid = plan.monthly > 0;
  return (
    <div className={`rounded-xl p-7 border ${plan.highlight ? "border-[#1e40af] bg-[#eff6ff]" : "border-[#e5e7eb] bg-white"} flex flex-col`}>
      <div className="eyebrow mb-1">{plan.name}</div>
      <div className="text-sm text-[#64748b] mb-4">{plan.tagline}</div>

      <div className="mb-6">
        <div className="text-5xl font-bold leading-none tabular">
          ${plan.monthly}
          <span className="text-base font-normal text-[#64748b]"> /mo</span>
        </div>
        {isPaid && (
          <div className="text-sm text-[#64748b] mt-1">${plan.yearly}/mo billed yearly</div>
        )}
      </div>

      <div className="text-sm font-mono text-[#0a0a0a] mb-4 tabular">
        {plan.credits.toLocaleString()} credits / mo
      </div>

      <ul className="space-y-2 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <span className="text-[#1e40af] mt-1">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.code === "lab" ? "mailto:hello@arxify.io" : `/signup?plan=${plan.code}`}
        className={`block text-center py-3 rounded-md font-medium transition ${
          plan.highlight
            ? "bg-[#0a0a0a] text-white hover:bg-[#1e40af]"
            : "border border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white"
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}
