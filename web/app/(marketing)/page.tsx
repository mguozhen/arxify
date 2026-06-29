// arxify.io — landing (academic/scientific design)

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useLocale } from "@/lib/locale";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://arxify-production.up.railway.app";

export default function LandingPage() {
  const { t } = useLocale();
  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <Nav />

      <section className="max-w-4xl mx-auto px-8 py-20 md:py-28 text-center">
        <div className="eyebrow mb-4">{t.hero_eyebrow}</div>

        <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight mb-6">
          {t.hero_title_a}{" "}
          <span className="line-through decoration-2 decoration-[#0a0a0a]">{t.hero_title_idea}</span>
          <br />
          {t.hero_title_b} <span className="text-[#1e40af]">{t.hero_title_paper}</span>.
        </h1>

        <p className="text-lg md:text-xl text-[#64748b] max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.hero_desc}
        </p>

        <div className="flex gap-3 justify-center mb-12 flex-wrap">
          <Link
            href="/try"
            className="bg-[#0a0a0a] text-white px-7 py-3.5 rounded-md font-medium hover:bg-[#1e40af] transition"
          >
            {t.hero_cta_start}
          </Link>
          <Link
            href="/pricing"
            className="border border-[#0a0a0a] px-7 py-3.5 rounded-md font-medium hover:bg-[#0a0a0a] hover:text-white transition"
          >
            {t.hero_cta_pricing}
          </Link>
        </div>

        <div className="font-mono text-xs text-[#64748b] flex justify-center gap-6 flex-wrap">
          {t.hero_perks.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>

        <AdminQuickLogin />
      </section>

      <section className="bg-[#f8fafc] border-y border-[#e5e7eb] py-20">
        <div className="max-w-5xl mx-auto px-8">
          <div className="eyebrow text-center mb-3">{t.how_eyebrow}</div>
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-2">{t.how_title}</h2>
          <p className="text-center text-[#64748b] mb-12">{t.how_subtitle}</p>

          <div className="grid md:grid-cols-4 gap-6">
            {t.how_steps.map((s) => (
              <Step key={s.n} {...s} />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-8 py-20">
        <blockquote className="border-l-2 border-[#1e40af] pl-6 text-xl text-[#0a0a0a]/90 mb-4 leading-relaxed">
          {t.testimonial_quote}
        </blockquote>
        <div className="font-mono text-xs text-[#64748b] uppercase tracking-widest">{t.testimonial_author}</div>
      </section>

      <section className="bg-[#0a0a0a] text-white py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.oss_title}</h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">{t.oss_desc}</p>
          <a
            href="https://github.com/mguozhen/ai-researcher"
            target="_blank"
            rel="noreferrer"
            className="inline-block border border-white px-6 py-3 rounded-md font-mono text-sm hover:bg-white hover:text-[#0a0a0a] transition"
          >
            {t.oss_cta}
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function AdminQuickLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasToken(!!window.localStorage.getItem("arxify_token"));
    }
  }, []);

  if (hasToken) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/auth/admin-magic`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!r.ok) {
        if (r.status === 401) throw new Error("Not an admin account · 该邮箱不是 admin");
        throw new Error(`HTTP ${r.status}`);
      }
      const d = await r.json();
      localStorage.setItem("arxify_token", d.token);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 border border-[#e5e7eb] rounded-xl bg-[#f8fafc] p-5 text-left">
      <div className="font-mono text-xs uppercase tracking-widest text-[#1e40af] mb-2">
        Admin · Quick Login
      </div>
      <p className="text-sm text-[#64748b] mb-4">
        管理员邮箱直接进 dashboard，查看 17 个研究假设、8 个数据源、聊天记录。
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mguozhen@gmail.com"
          className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md focus:border-[#1e40af] focus:outline-none text-sm bg-white"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="bg-[#0a0a0a] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#1e40af] transition disabled:opacity-40"
        >
          {loading ? "…" : "Enter →"}
        </button>
      </form>
      {error && (
        <div className="mt-3 text-xs text-red-700">{error}</div>
      )}
      <p className="text-xs text-[#94a3b8] mt-3">
        Not admin? <Link href="/login" className="text-[#1e40af] underline">Use password login</Link>
      </p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="border-t-2 border-[#1e40af] pt-4">
      <div className="font-mono text-xs uppercase tracking-widest text-[#1e40af] mb-2">{n}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[#64748b] leading-relaxed">{desc}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#e5e7eb] py-10 px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#64748b]">
        <div>arxify.io · From idea to paper</div>
        <div className="flex gap-6">
          <Link href="/pricing">Pricing</Link>
          <a href="https://github.com/mguozhen/arxify" target="_blank" rel="noreferrer">GitHub</a>
          <Link href="/login">Log in</Link>
        </div>
      </div>
    </footer>
  );
}
