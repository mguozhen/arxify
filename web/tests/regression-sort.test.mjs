// Regression for sort/group toolbar fix
import { chromium } from "playwright";
const results = [];
const log = (n, ok, d="") => { results.push({n,ok,d}); console.log(`${ok?"✓":"✗"} ${n}${d?" · "+d:""}`); };

const browser = await chromium.launch({ headless: true });
const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await c.newPage();
await p.goto("http://127.0.0.1:3000/mockup/dashboard-v2.html");
await p.waitForLoadState("networkidle");
await p.waitForTimeout(300);
await p.evaluate(() => document.getElementById("hypotheses")?.scrollIntoView({ block: "start" }));
await p.waitForTimeout(200);

// Helper: get arrow text on chip (visible only when active sort)
async function arrowText(view) {
  return await p.evaluate(v => {
    const chip = document.querySelector(`.chip[data-view="${v}"] .chip-arrow`);
    if (!chip) return null;
    if (chip.style.display === "none") return "";
    return chip.textContent;
  }, view);
}

// 1) Default: Status active, no arrows shown anywhere
log("default: Status arrow hidden", (await arrowText("feasibility")) === "");
log("default: A/B difficulty arrow hidden", (await arrowText("difficulty")) === "");

// 2) Click Feasibility → arrow ↓ appears, A/B arrow stays hidden
await p.evaluate(() => window.setView("feasibility"));
await p.waitForTimeout(150);
log("after click Feasibility: arrow shows ↓", (await arrowText("feasibility")) === "↓");
log("after click Feasibility: A/B arrow hidden", (await arrowText("difficulty")) === "");
const feasLabel = await p.locator(".group-label:has-text('Feasibility')").innerText();
log("label says high → low", /high.*→.*low/i.test(feasLabel), feasLabel);

// 3) Click Feasibility AGAIN → arrow flips to ↑, ordering inverts
await p.evaluate(() => window.setView("feasibility"));
await p.waitForTimeout(150);
log("re-click Feasibility: arrow flips to ↑", (await arrowText("feasibility")) === "↑");
const feasLabel2 = await p.locator(".group-label:has-text('Feasibility')").innerText();
log("label says low → high", /low.*→.*high/i.test(feasLabel2));
// first card should now be lowest feasibility
const firstCardCode = await p.locator(".card .card-meta").first().innerText();
log("first card is low-feasibility", /D21/.test(firstCardCode) || /^D2[12]/.test(firstCardCode), firstCardCode);

// 4) Click A/B difficulty → only that chip shows arrow, Feasibility hides
await p.evaluate(() => window.setView("difficulty"));
await p.waitForTimeout(150);
log("after click A/B: arrow shows ↑", (await arrowText("difficulty")) === "↑");
log("after click A/B: Feasibility arrow hides", (await arrowText("feasibility")) === "");
const diffLabel = await p.locator(".group-label:has-text('difficulty')").innerText();
log("label says easy → hard", /easy.*→.*hard/i.test(diffLabel));

// 5) Re-click A/B difficulty → flips
await p.evaluate(() => window.setView("difficulty"));
await p.waitForTimeout(150);
log("re-click A/B: arrow flips to ↓", (await arrowText("difficulty")) === "↓");
log("label says hard → easy", /hard.*→.*easy/i.test(await p.locator(".group-label:has-text('difficulty')").innerText()));

// 6) Switch to Status → no arrows anywhere
await p.evaluate(() => window.setView("status"));
await p.waitForTimeout(150);
log("Status view: feasibility arrow hidden", (await arrowText("feasibility")) === "");
log("Status view: difficulty arrow hidden", (await arrowText("difficulty")) === "");

// screenshots
await p.evaluate(() => window.setView("status"));
await p.waitForTimeout(200);
await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/sort-1-status.png" });
await p.evaluate(() => window.setView("feasibility"));
await p.waitForTimeout(200);
await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/sort-2-feasibility-desc.png" });
await p.evaluate(() => window.setView("feasibility"));
await p.waitForTimeout(200);
await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/sort-3-feasibility-asc.png" });

await browser.close();
console.log("");
const pass = results.filter(r => r.ok).length;
console.log(`PASSED: ${pass}/${results.length}`);
if (pass !== results.length) process.exit(1);
