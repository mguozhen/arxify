// Shared site navigation with locale switcher + login entry.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, LocaleSwitcher } from "@/lib/locale";

export function Nav() {
  const { t } = useLocale();
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasToken(!!window.localStorage.getItem("arxify_token"));
  }, []);

  return (
    <header className="border-b border-[#e5e7eb] bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          arxify<span className="text-[#1e40af]">.io</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/try" className="text-[#64748b] hover:text-[#0a0a0a]">{t.nav_try}</Link>
          <Link href="/pricing" className="text-[#64748b] hover:text-[#0a0a0a]">{t.nav_pricing}</Link>
          <a
            href="https://github.com/mguozhen/arxify"
            target="_blank"
            rel="noreferrer"
            className="text-[#64748b] hover:text-[#0a0a0a]"
          >
            {t.nav_github}
          </a>
          <LocaleSwitcher />
          {hasToken ? (
            <Link
              href="/dashboard"
              className="bg-[#0a0a0a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1e40af] transition"
            >
              {t.nav_dashboard}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[#0a0a0a] font-medium hover:text-[#1e40af]"
              >
                {t.nav_login}
              </Link>
              <Link
                href="/signup"
                className="bg-[#0a0a0a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1e40af] transition"
              >
                {t.nav_signup}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
