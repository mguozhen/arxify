// Integration regression for dashboard v2 mockup
// Covers: data source add (5 types) + paper generation pipeline + PDF download
import { chromium } from "playwright";

const URL = "http://127.0.0.1:3000/mockup/dashboard-v2.html";
const results = [];
const log = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " · " + detail : ""}`);
};

const browser = await chromium.launch({ headless: true });
const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await c.newPage();

// ─── Load page ─────────────────────────────────────────────
await p.goto(URL);
await p.waitForLoadState("networkidle");
await p.waitForTimeout(300);

// Verify initial state
const initialDsCount = await p.locator(".ds-card").count();
log("initial 8 data sources rendered", initialDsCount === 8, `${initialDsCount}`);

const initialPaperCount = await p.locator(".paper-card").count();
log("initial 2 papers rendered (demo)", initialPaperCount === 2, `${initialPaperCount}`);

const pdfPreview = await p.locator('.paper-btn[href$="h3-handoff-agency-paradox.pdf"]').count();
log("H3 demo paper has PDF link", pdfPreview >= 1);

// ─── 1. Add MySQL data source ──────────────────────────────
await p.evaluate(() => document.getElementById("data")?.scrollIntoView());
await p.waitForTimeout(200);
await p.evaluate(() => window.openDsModal());
await p.waitForSelector(".ds-type", { timeout: 2000 });
const typeCount = await p.locator(".ds-type").count();
log("modal opens with 5 connector types", typeCount === 5, `${typeCount}`);

await p.locator('.ds-type:has-text("MySQL")').click();
await p.waitForSelector("#ds_host");
await p.fill("#ds_name", "acme_orders_test");
await p.fill("#ds_host", "db.acme.test");
await p.fill("#ds_db", "orders");
await p.locator("button.btn-primary:has-text('Add data source')").click();
await p.waitForTimeout(400);
const afterMySQL = await p.locator(".ds-card").count();
log("MySQL ds added → count 9", afterMySQL === 9, `${afterMySQL}`);
const hasNew = await p.locator(".ds-card:has-text('acme_orders_test')").count();
log("MySQL ds row visible with name", hasNew === 1);

// ─── 2. Add File upload ─────────────────────────────────────
await p.evaluate(() => window.openDsModal());
await p.waitForSelector(".ds-type");
await p.locator('.ds-type:has-text("Upload file")').click();
await p.waitForSelector("#ds_name");
await p.fill("#ds_name", "survey_q1_csv");
await p.locator("button.btn-primary:has-text('Add data source')").click();
await p.waitForTimeout(300);
log("File upload ds added → count 10", (await p.locator(".ds-card").count()) === 10);

// ─── 3. Add S3 ──────────────────────────────────────────────
await p.evaluate(() => window.openDsModal());
await p.waitForSelector(".ds-type");
await p.locator('.ds-type:has-text("S3")').click();
await p.waitForSelector("#ds_bucket");
await p.fill("#ds_name", "analytics_lake_v3");
await p.fill("#ds_bucket", "acme-analytics");
await p.fill("#ds_region", "us-east-1");
await p.locator("button.btn-primary:has-text('Add data source')").click();
await p.waitForTimeout(300);
log("S3 ds added → count 11", (await p.locator(".ds-card").count()) === 11);

// ─── 4. Add HTTP API ───────────────────────────────────────
await p.evaluate(() => window.openDsModal());
await p.waitForSelector(".ds-type");
await p.locator('.ds-type:has-text("HTTP API")').click();
await p.waitForSelector("#ds_url");
await p.fill("#ds_name", "stripe_events");
await p.fill("#ds_url", "https://api.stripe.com/v1/events");
await p.locator("button.btn-primary:has-text('Add data source')").click();
await p.waitForTimeout(300);
log("HTTP API ds added → count 12", (await p.locator(".ds-card").count()) === 12);

// ─── 5. Add Google Sheets ──────────────────────────────────
await p.evaluate(() => window.openDsModal());
await p.waitForSelector(".ds-type");
await p.locator('.ds-type:has-text("Google Sheets")').click();
await p.waitForSelector("#ds_url");
await p.fill("#ds_name", "exec_okrs_q2");
await p.fill("#ds_url", "https://docs.google.com/spreadsheets/d/abc/edit");
await p.locator("button.btn-primary:has-text('Add data source')").click();
await p.waitForTimeout(300);
log("Google Sheets ds added → count 13", (await p.locator(".ds-card").count()) === 13);

// ─── 6. Modal closes cleanly ───────────────────────────────
const modalOpen = await p.locator("#dsModalOverlay.is-open").count();
log("ds modal closes after each submit", modalOpen === 0);

// ─── 7. Generate paper flow ────────────────────────────────
await p.evaluate(() => document.getElementById("papers")?.scrollIntoView());
await p.waitForTimeout(200);
await p.evaluate(() => window.openPaperModal());
await p.waitForSelector("#paper_hyp");
await p.selectOption("#paper_hyp", "H3");
await p.selectOption("#paper_depth", "chapter");
await p.locator("button.btn-primary:has-text('Start writeup →')").click();
await p.waitForTimeout(400);
const generatingShown = await p.locator(".paper-status.generating").count();
log("generating paper row appears", generatingShown === 1);

// Wait for full pipeline (5 stages × 1.1s = 5.5s)
await p.waitForTimeout(6500);
const afterGen = await p.locator(".paper-card").count();
log("paper count → 3 after generation", afterGen === 3, `${afterGen}`);
const draftBadges = await p.locator(".paper-status.draft").count();
log("new paper finishes as draft (status)", draftBadges >= 1);

// ─── 8. PDFs are served ────────────────────────────────────
const r1 = await p.request.get("http://127.0.0.1:3000/papers/h3-handoff-agency-paradox.pdf");
log("H3 PDF served", r1.status() === 200 && r1.headers()["content-type"]?.includes("pdf"), `HTTP ${r1.status()}`);
const r2 = await p.request.get("http://127.0.0.1:3000/papers/dba-dissertation-8-candidates.pdf");
log("DBA proposal PDF served", r2.status() === 200, `HTTP ${r2.status()}`);

// ─── 9. View modes still work after data churn ─────────────
await p.evaluate(() => window.setView("source"));
await p.waitForTimeout(200);
const sourceGroups = await p.locator(".group-label").count();
log("Source view groups (Claude / Codex)", sourceGroups === 2, `${sourceGroups}`);
await p.evaluate(() => window.setView("feasibility"));
await p.waitForTimeout(200);
const feasGroup = await p.locator(".group-label:has-text('Feasibility')").count();
log("Feasibility view label visible", feasGroup === 1);

// Screenshot the final composed state
await p.evaluate(() => window.setView("status"));
await p.evaluate(() => document.getElementById("papers")?.scrollIntoView());
await p.waitForTimeout(300);
await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/shot-final-papers.png" });
console.log("✓ shot-final-papers.png");

await p.evaluate(() => document.getElementById("data")?.scrollIntoView());
await p.waitForTimeout(300);
await p.screenshot({ path: "/Users/hunter/arxify/web/public/mockup/shot-final-data.png" });
console.log("✓ shot-final-data.png");

await browser.close();

console.log("\n════════════════════════════════════");
const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok);
console.log(`PASSED: ${passed}/${results.length}`);
if (failed.length) {
  console.log("FAILED:"); failed.forEach(r => console.log(`  ✗ ${r.name} · ${r.detail}`));
  process.exit(1);
}
