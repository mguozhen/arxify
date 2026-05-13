import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "arxify.ai — From idea to paper",
  description:
    "AI Researcher SaaS. Drop in your idea or data. Get a research plan, experiment design, and full paper draft. Built on AI-Scientist-v2 + MiroThinker.",
  keywords: ["AI researcher", "PhD", "research", "paper writing", "AI for science"],
  openGraph: {
    title: "arxify.ai — From idea to paper",
    description: "One person. One lab. Built on open-source ai-researcher pipeline.",
    url: "https://arxify.ai",
    siteName: "arxify",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
