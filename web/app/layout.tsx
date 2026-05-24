import type { Metadata } from "next";
import { LocaleProvider } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "arxify.io — From idea to paper",
  description:
    "AI Researcher SaaS. Drop in your idea or data. Get a research plan, experiment design, and full paper draft. Built on AI-Scientist-v2 + MiroThinker.",
  keywords: ["AI researcher", "PhD", "research", "paper writing", "AI for science"],
  openGraph: {
    title: "arxify.io — From idea to paper",
    description: "One person. One lab. Built on open-source ai-researcher pipeline.",
    url: "https://arxify.io",
    siteName: "arxify",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
