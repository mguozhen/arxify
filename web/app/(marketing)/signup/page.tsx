// arxify.io — Waitlist signup (pre-launch, no Stripe)

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useLocale } from "@/lib/locale";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://arxify-production.up.railway.app";

export default function SignupPage() {
  const { t } = useLocale();
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
      if (!r.ok) throw new Error(`${r.status}: ${(await r.text()).slice(0, 200)}`);
      const data = await r.json();
      setPosition(data.position);
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
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <Nav />
      <section className="max-w-xl mx-auto px-8 py-16">
        <div className="eyebrow mb-3">{t.signup_eyebrow}</div>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4">
          {t.signup_title_a} <span className="text-[#1e40af]">{t.signup_title_b}</span>
        </h1>
        <p className="text-[#64748b] mb-8 leading-relaxed">
          {t.signup_desc}
          {totalCount !== null && (
            <span className="font-mono not-italic text-[#0a0a0a] tabular">
              {" · "}<strong>{totalCount}</strong> joined
            </span>
          )}
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="eyebrow block mb-2">{t.signup_email_label}</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full px-4 py-3 border border-[#e5e7eb] rounded-md focus:border-[#1e40af] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">{t.signup_context_label}</label>
              <textarea
                value={context} onChange={(e) => setContext(e.target.value)} rows={3}
                className="w-full px-4 py-3 border border-[#e5e7eb] rounded-md focus:border-[#1e40af] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">{t.signup_source_label}</label>
              <input
                value={source} onChange={(e) => setSource(e.target.value)}
                placeholder="xiaohongshu / github / twitter / friend"
                className="w-full px-4 py-3 border border-[#e5e7eb] rounded-md focus:border-[#1e40af] focus:outline-none"
              />
            </div>
            {error && (
              <div className="border border-red-300 bg-red-50 text-red-800 rounded-md p-3 text-sm">{error}</div>
            )}
            <button
              type="submit" disabled={loading || !email}
              className="w-full bg-[#0a0a0a] text-white py-3 rounded-md font-medium hover:bg-[#1e40af] transition disabled:opacity-40"
            >
              {loading ? t.signup_submit_loading : t.signup_submit}
            </button>
            <p className="text-xs text-[#64748b] text-center mt-2">{t.signup_disclaimer}</p>
          </form>
        ) : (
          <div className="border-2 border-[#1e40af] bg-[#eff6ff] rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="text-3xl font-bold mb-2 tabular">
              {t.signup_success_title.replace("X", String(position ?? "?")).replace("#", "#")}
            </h2>
            <p className="text-[#64748b] mb-6">{t.signup_success_will_email}: <strong>{email}</strong></p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/dashboard"
                className="bg-[#0a0a0a] text-white px-6 py-3 rounded-md font-medium hover:bg-[#1e40af] transition"
              >
                {t.signup_to_dashboard}
              </Link>
              <Link
                href="/try"
                className="border border-[#0a0a0a] px-6 py-3 rounded-md font-medium hover:bg-[#0a0a0a] hover:text-white transition"
              >
                {t.signup_try_demo}
              </Link>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Just joined the @arxify.io waitlist — AI researcher that gets you from idea to paper draft.")}`}
                target="_blank" rel="noreferrer"
                className="border border-[#0a0a0a] px-6 py-3 rounded-md font-medium hover:bg-[#0a0a0a] hover:text-white transition"
              >
                {t.signup_share_x}
              </a>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
