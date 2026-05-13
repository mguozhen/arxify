// arxify.ai — landing page

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#1f1c17] font-serif">
      <Header />

      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="text-xs font-mono uppercase tracking-widest text-[#6e6a5d] mb-4">
          VOL. 01 · BUILT ON OPEN-SOURCE AI-RESEARCHER
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold leading-[0.96] tracking-tight mb-6">
          From <span className="line-through decoration-2 decoration-[#1f1c17]">idea</span>
          <br />
          to <span className="italic text-[#b85a3a]">paper</span>.
        </h1>

        <p className="text-xl md:text-2xl italic text-[#6e6a5d] max-w-2xl mx-auto mb-10 leading-relaxed">
          Drop in your idea or data. Get a research plan, experiment design,
          and full paper draft. Built on SakanaAI <em>AI-Scientist-v2</em> +
          MiroMind <em>MiroThinker</em>.
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <Link
            href="/signup"
            className="bg-[#1f1c17] text-[#fafaf7] px-8 py-4 rounded-full font-medium hover:bg-[#b85a3a] transition"
          >
            Start free →
          </Link>
          <Link
            href="/pricing"
            className="border border-[#1f1c17] px-8 py-4 rounded-full font-medium hover:bg-[#1f1c17] hover:text-[#fafaf7] transition"
          >
            See pricing
          </Link>
        </div>

        <div className="font-mono text-xs text-[#6e6a5d] flex justify-center gap-6 flex-wrap">
          <span>⚡ 5 ideas in 15 min</span>
          <span>🔬 Brutal peer-review</span>
          <span>📄 LaTeX + PDF export</span>
          <span>🔐 No training on your data</span>
        </div>
      </section>

      <section className="bg-[#f3eee2] border-y border-[#d3cdbe] py-20">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="text-center text-3xl font-extrabold mb-2">How it works</h2>
          <p className="text-center text-[#6e6a5d] italic mb-12">Four steps, one afternoon.</p>

          <div className="grid md:grid-cols-4 gap-6">
            <Step n="01" title="Input" desc="Paste your idea, upload a PDF proposal, or drop a CSV of data." />
            <Step n="02" title="Plan" desc="AI drafts 5 candidate directions + DeepCritique peer review + tournament ranking." />
            <Step n="03" title="Data" desc="Upload experiment results. We map them to the chosen plan." />
            <Step n="04" title="Paper" desc="LaTeX + PDF draft, ready to hand to your advisor or submit." />
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-8 py-24">
        <div className="border-l-2 border-[#b85a3a] pl-6 italic text-xl text-[#1f1c17]/90 mb-4">
          "Used it to pick my HKU DBA dissertation topic. 17 candidate
          directions, brutal peer review, automated email to three advisors. Three days, one person."
        </div>
        <div className="font-mono text-xs text-[#6e6a5d] uppercase tracking-widest">
          — Hunter, HKU DBA Candidate · first paying customer
        </div>
      </section>

      <section className="bg-[#1f1c17] text-[#fafaf7] py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-4">Built on open source</h2>
          <p className="text-[#fafaf7]/70 mb-8 max-w-2xl mx-auto">
            The core pipeline is MIT-licensed and on GitHub. Run it locally for
            free. We just make it easy.
          </p>
          <a
            href="https://github.com/mguozhen/ai-researcher"
            target="_blank"
            rel="noreferrer"
            className="inline-block border border-[#fafaf7] px-6 py-3 rounded-full font-mono text-sm hover:bg-[#fafaf7] hover:text-[#1f1c17] transition"
          >
            github.com/mguozhen/ai-researcher →
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="border-t-2 border-[#b85a3a] pt-4">
      <div className="font-mono text-xs uppercase tracking-widest text-[#b85a3a] mb-2">{n}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-[#6e6a5d] leading-relaxed">{desc}</p>
    </div>
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
