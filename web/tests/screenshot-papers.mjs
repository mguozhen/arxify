import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await c.newPage();
await p.goto("http://127.0.0.1:3000/mockup/dashboard-v2.html");
await p.waitForLoadState("networkidle");
await p.waitForTimeout(300);
await p.evaluate(() => document.getElementById("papers")?.scrollIntoView({ block: "start" }));
await p.waitForTimeout(300);
await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/shot-papers-final.png" });
console.log("✓ shot-papers-final.png");

// confirm PDF reachable
const r = await p.request.get("http://127.0.0.1:3000/papers/thesis-hku-final-ai-disclosure.pdf");
console.log(`thesis PDF: HTTP ${r.status()} · ${r.headers()["content-length"]} bytes`);
await browser.close();
