// arxify.io — Token-based login (interim, until magic-link email)

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useLocale } from "@/lib/locale";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function LoginInner() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // already logged in? redirect to dashboard
    const stored = window.localStorage.getItem("arxify_token");
    if (stored) {
      router.replace("/dashboard");
      return;
    }
    // ?token=X autosubmit
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      submit(urlToken);
    }
  }, []);

  async function submit(t: string) {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/waitlist/status?token=${encodeURIComponent(t)}`);
      if (!r.ok) throw new Error(r.status === 404 ? "Token not recognized" : `Error ${r.status}`);
      localStorage.setItem("arxify_token", t);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <Nav />
      <section className="max-w-md mx-auto px-8 py-16">
        <div className="eyebrow mb-3">{t.login_eyebrow}</div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">{t.login_title}</h1>
        <p className="text-[#64748b] mb-8 leading-relaxed">{t.login_desc}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(token.trim());
          }}
          className="space-y-4"
        >
          <div>
            <label className="eyebrow block mb-2">{t.login_token_label}</label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t.login_token_placeholder}
              autoFocus
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-md focus:border-[#1e40af] focus:outline-none font-mono text-sm"
            />
          </div>
          {error && (
            <div className="border border-red-300 bg-red-50 text-red-800 rounded-md p-3 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full bg-[#0a0a0a] text-white py-3 rounded-md font-medium hover:bg-[#1e40af] transition disabled:opacity-40"
          >
            {loading ? "…" : t.login_submit}
          </button>
        </form>

        <p className="text-sm text-[#64748b] mt-8 text-center">
          {t.login_alt}{" "}
          <Link href="/signup" className="text-[#1e40af] underline">
            {t.login_alt_link}
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
