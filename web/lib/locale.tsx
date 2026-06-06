// Locale context + provider — persists choice in localStorage, defaults to browser.

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Locale, EXPOSED_LOCALES, LOCALE_LABELS, getDict } from "./i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: ReturnType<typeof getDict>;
};

const LocaleCtx = createContext<Ctx | null>(null);

function detect(): Locale {
  if (typeof window === "undefined") return "zh";
  const stored = window.localStorage.getItem("arxify_locale") as Locale | null;
  // only honor a stored locale that is still exposed (avoids being stuck in ja/es
  // with no button to switch out)
  if (stored && EXPOSED_LOCALES.includes(stored)) return stored;
  const nav = (navigator.language || "zh").slice(0, 2).toLowerCase();
  if (nav.startsWith("en")) return "en";
  return "zh";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  useEffect(() => {
    setLocaleState(detect());
  }, []);
  function setLocale(l: Locale) {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("arxify_locale", l);
    }
  }
  return (
    <LocaleCtx.Provider value={{ locale, setLocale, t: getDict(locale) }}>
      {children}
    </LocaleCtx.Provider>
  );
}

export function useLocale() {
  const v = useContext(LocaleCtx);
  if (!v) throw new Error("useLocale must be inside LocaleProvider");
  return v;
}

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useContext(LocaleCtx) || { locale: "zh", setLocale: () => {} };
  return (
    <div className={`flex gap-1 items-center font-mono text-xs ${className}`}>
      {EXPOSED_LOCALES.map((l, i) => (
        <span key={l} className="contents">
          {i > 0 && <span className="text-[#cbd5e1]">·</span>}
          <button
            onClick={() => setLocale(l)}
            className={`px-1.5 py-0.5 transition ${
              l === locale
                ? "text-[#1e40af] font-bold"
                : "text-[#64748b] hover:text-[#0a0a0a]"
            }`}
            aria-label={`Switch to ${LOCALE_LABELS[l]}`}
          >
            {l === "zh" && "中"}
            {l === "en" && "EN"}
          </button>
        </span>
      ))}
    </div>
  );
}
