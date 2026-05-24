// Capture screenshots for the 4 view modes of the mockup
import { chromium } from "playwright";

const URL = "http://127.0.0.1:3000/mockup/dashboard-v2.html";
const browser = await chromium.launch({ headless: true });
const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await c.newPage();
await p.goto(URL);
await p.waitForLoadState("networkidle");
await p.waitForTimeout(300);

// scroll to hypotheses section
await p.evaluate(() => document.getElementById("hypotheses")?.scrollIntoView({ block: "start" }));
await p.waitForTimeout(200);

await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/view-status.png" });
console.log("✓ view-status.png");

await p.evaluate(() => window.setView("source"));
await p.waitForTimeout(200);
await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/view-source.png" });
console.log("✓ view-source.png — grouped by Claude / Codex");

await p.evaluate(() => window.setView("feasibility"));
await p.waitForTimeout(200);
await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/view-feasibility.png" });
console.log("✓ view-feasibility.png — sorted high → low");

await p.evaluate(() => window.setView("difficulty"));
await p.waitForTimeout(200);
await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/view-difficulty.png" });
console.log("✓ view-difficulty.png — sorted easy → hard");

await browser.close();
