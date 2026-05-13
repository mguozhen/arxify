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
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
