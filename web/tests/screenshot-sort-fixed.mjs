import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

// Fresh load each shot to start from clean state.
for (const [state, ops, name] of [
  ["default · Status active, no arrows",       () => {},                              "sort-default"],
  ["Feasibility ↓ (high → low)",                async (p) => p.evaluate(() => window.setView("feasibility")), "sort-feas-desc"],
  ["Feasibility ↑ (toggled, low → high)",       async (p) => { await p.evaluate(() => window.setView("feasibility")); await p.evaluate(() => window.setView("feasibility")); }, "sort-feas-asc"],
  ["A/B difficulty ↑ (easy → hard)",            async (p) => p.evaluate(() => window.setView("difficulty")), "sort-diff-asc"],
]) {
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:3000/mockup/dashboard-v2.html");
  await p.waitForLoadState("networkidle");
  await p.waitForTimeout(200);
  await ops(p);
  await p.waitForTimeout(200);
  await p.evaluate(() => document.getElementById("hypotheses")?.scrollIntoView({ block: "start" }));
  await p.waitForTimeout(150);
  await p.screenshot({ path: `/Users/hunter/arxify/web/public/mockup/${name}.png`, clip: { x: 240, y: 0, width: 1200, height: 700 } });
  console.log(`✓ ${name}.png — ${state}`);
  await p.close();
}
await browser.close();
