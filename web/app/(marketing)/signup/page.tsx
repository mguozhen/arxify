// arxify.io — Waitlist signup (pre-launch, no Stripe)

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [context, setContext] = useState("");
  const [source, setSource] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/waitlist/count`)
      .then((r) => r.json())
      .then((d) => setTotalCount(d.count))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/waitlist/signup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, context, source }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`${r.status}: ${txt.slice(0, 200)}`);
      }
      const data = await r.json();
      setPosition(data.position);
      // store token for /dashboard access
      if (typeof window !== "undefined" && data.token) {
        localStorage.setItem("arxify_token", data.token);
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#1f1c17] font-serif">
      <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          arxify<span className="text-[#b85a3a]">.io</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/try" className="hover:text-[#b85a3a]">Try free</Link>
          <Link href="/pricing" className="hover:text-[#b85a3a]">Pricing</Link>
          <a href="https://github.com/mguozhen/ai-researcher" target="_blank" rel="noreferrer" className="hover:text-[#b85a3a]">
            GitHub
          </a>
        </nav>
      </header>

      <section className="max-w-xl mx-auto px-8 py-16">
        <div className="text-xs font-mono uppercase tracking-widest text-[#6e6a5d] mb-3">
          WAITLIST · LAUNCHING WHEN WE HIT 100
        </div>
        <h1 className="text-5xl font-extrabold leading-[0.96] tracking-tight mb-4">
          Get on the <span className="italic text-[#b85a3a]">waitlist</span>.
        </h1>
        <p className="text-lg italic text-[#6e6a5d] mb-8">
          First 10 signups get 90 days of Scholar free in exchange for a
          testimonial. We&apos;re launching when 100 people are in.{" "}
          {totalCount !== null && (
            <span className="font-mono not-italic text-[#1f1c17]">
              · <strong>{totalCount}</strong> already in
            </span>
          )}
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#6e6a5d] mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full px-4 py-3 border border-[#d3cdbe] rounded-lg focus:border-[#b85a3a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#6e6a5d] mb-2">
                What would you use arxify for? (optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                placeholder="e.g. 我是 PhD 在读，做 LLM 教学相关研究..."
                className="w-full px-4 py-3 border border-[#d3cdbe] rounded-lg focus:border-[#b85a3a] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#6e6a5d] mb-2">
                How did you find us? (optional)
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="xiaohongshu / github / twitter / friend"
                className="w-full px-4 py-3 border border-[#d3cdbe] rounded-lg focus:border-[#b85a3a] focus:outline-none"
              />
            </div>

            {error && (
              <div className="border border-red-300 bg-red-50 text-red-800 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-[#1f1c17] text-[#fafaf7] py-4 rounded-full font-medium hover:bg-[#b85a3a] transition disabled:opacity-40"
            >
              {loading ? "Joining…" : "Reserve my spot →"}
            </button>

            <p className="text-xs text-[#6e6a5d] text-center mt-2">
              We&apos;ll email you the moment beta opens. Cancel anytime; no
              card on file.
            </p>
          </form>
        ) : (
          <div className="border border-[#b85a3a] bg-[#f3eee2] rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="text-3xl font-bold mb-2">
              You&apos;re #{position} on the list.
            </h2>
            <p className="text-[#6e6a5d] mb-6 italic">
              We&apos;ll email <strong>{email}</strong> when beta opens.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/dashboard"
                className="bg-[#1f1c17] text-[#fafaf7] px-6 py-3 rounded-full font-medium hover:bg-[#b85a3a] transition"
              >
                Go to dashboard →
              </Link>
              <Link
                href="/try"
                className="border border-[#1f1c17] px-6 py-3 rounded-full font-medium hover:bg-[#1f1c17] hover:text-[#fafaf7] transition"
              >
                Try the demo
              </Link>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Just joined the @arxify.io waitlist — AI researcher that gets you from idea to paper draft. github.com/mguozhen/ai-researcher")}`}
                target="_blank"
                rel="noreferrer"
                className="border border-[#1f1c17] px-6 py-3 rounded-full font-medium hover:bg-[#1f1c17] hover:text-[#fafaf7] transition"
              >
                Share on X
              </a>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
