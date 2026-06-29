// arxify.io — login: email+password (primary) + token paste (fallback)

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useLocale } from "@/lib/locale";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://arxify-production.up.railway.app";

type Mode = "password" | "token";

function LoginInner() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useSearchParams();

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSession, setExistingSession] = useState<{ token: string; email: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Explicit ?token=X in URL → autosubmit (e.g. waitlist email magic link)
    const urlToken = params.get("token");
    if (urlToken) {
      setMode("token");
      setTokenInput(urlToken);
      submitToken(urlToken);
      return;
    }
    // Already-logged-in: show banner, do NOT auto-redirect
    const existing = window.localStorage.getItem("arxify_token");
    if (existing) {
      setExistingSession({ token: existing, email: "" });
      fetch(`${API_URL}/api/waitlist/status?token=${encodeURIComponent(existing)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.email) setExistingSession({ token: existing, email: d.email });
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function signOut() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("arxify_token");
    }
    setExistingSession(null);
    setError(null);
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const msg = r.status === 401 ? "Invalid email or password" : `Error ${r.status}`;
        throw new Error(msg);
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

  async function submitToken(tk: string) {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/waitlist/status?token=${encodeURIComponent(tk)}`);
      if (!r.ok) throw new Error(r.status === 404 ? "Token not recognized" : `Error ${r.status}`);
      localStorage.setItem("arxify_token", tk);
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
        <h1 className="text-4xl font-bold tracking-tight mb-6">{t.login_title}</h1>

        {existingSession && (
          <div
            data-testid="existing-session-banner"
            className="border border-[#1e40af]/30 bg-[#eff6ff] rounded-md p-4 mb-6"
          >
            <p className="text-sm mb-3">
              Already logged in
              {existingSession.email ? (
                <> as <strong className="font-mono">{existingSession.email}</strong></>
              ) : null}
              .
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="bg-[#0a0a0a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1e40af] transition"
              >
                Go to dashboard →
              </button>
              <button
                type="button"
                onClick={signOut}
                className="border border-[#e5e7eb] text-[#0a0a0a] px-4 py-2 rounded-md text-sm font-medium hover:border-[#0a0a0a] transition"
              >
                Sign out & switch
              </button>
            </div>
          </div>
        )}

        <div className="flex border-b border-[#e5e7eb] mb-6 -mx-1">
          <button
            type="button"
            onClick={() => { setMode("password"); setError(null); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
              mode === "password"
                ? "border-[#1e40af] text-[#0a0a0a]"
                : "border-transparent text-[#64748b] hover:text-[#0a0a0a]"
            }`}
          >
            Email + Password
          </button>
          <button
            type="button"
            onClick={() => { setMode("token"); setError(null); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
              mode === "token"
                ? "border-[#1e40af] text-[#0a0a0a]"
                : "border-transparent text-[#64748b] hover:text-[#0a0a0a]"
            }`}
          >
            Token
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={submitPassword} className="space-y-4">
            <div>
              <label className="eyebrow block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                autoFocus
                className="w-full px-4 py-3 border border-[#e5e7eb] rounded-md focus:border-[#1e40af] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#e5e7eb] rounded-md focus:border-[#1e40af] focus:outline-none"
              />
            </div>
            {error && (
              <div className="border border-red-300 bg-red-50 text-red-800 rounded-md p-3 text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-[#0a0a0a] text-white py-3 rounded-md font-medium hover:bg-[#1e40af] transition disabled:opacity-40"
            >
              {loading ? "…" : t.login_submit}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); submitToken(tokenInput.trim()); }}
            className="space-y-4"
          >
            <p className="text-sm text-[#64748b] -mt-2 mb-2">{t.login_desc}</p>
            <div>
              <label className="eyebrow block mb-2">{t.login_token_label}</label>
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
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
              disabled={loading || !tokenInput.trim()}
              className="w-full bg-[#0a0a0a] text-white py-3 rounded-md font-medium hover:bg-[#1e40af] transition disabled:opacity-40"
            >
              {loading ? "…" : t.login_submit}
            </button>
          </form>
        )}

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
