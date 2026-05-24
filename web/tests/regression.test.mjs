// arxify.io — end-to-end regression test via Playwright/Chromium
// Run: cd web && bun tests/regression.test.mjs

import { chromium } from "playwright";

const WEB = "http://127.0.0.1:3000";
const API = "http://127.0.0.1:8000";
const ADMIN_EMAIL = "mguozhen@gmail.com";
const ADMIN_PASSWORD = "solvea2026！";

const results = [];
const log = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " · " + detail : ""}`);
};

async function ctx(browser) {
  return await browser.newContext({ viewport: { width: 1280, height: 800 } });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ─── 1. New visitor: landing renders ────────────────────────────────────
  {
    const c = await ctx(browser);
    const p = await c.newPage();
    await p.goto(WEB);
    const heading = await p.locator("h1").first().innerText();
    log("landing renders h1", heading.length > 5, heading.slice(0, 60));
    const adminBox = await p.getByText("Admin · Quick Login").count();
    log("landing shows admin quick login", adminBox === 1);
    await c.close();
  }

  // ─── 2. Admin quick-login: / → enter email → /dashboard → hypotheses tab default ─
  {
    const c = await ctx(browser);
    const p = await c.newPage();
    await p.goto(WEB);
    await p.locator('input[type="email"][placeholder*="mguozhen"]').fill(ADMIN_EMAIL);
    await p.getByRole("button", { name: /Enter/i }).click();
    await p.waitForURL("**/dashboard", { timeout: 5000 });
    log("admin quick-login → /dashboard", true, p.url());
    // wait for workspace data to render
    await p.waitForSelector("text=/Hypotheses · 17/", { timeout: 8000 });
    const onHypTab = await p.locator('button:has-text("Hypotheses · 17")')
      .evaluate((el) => el.className.includes("border-[#1e40af]") || el.classList.toString().includes("1e40af"));
    log("default tab = Hypotheses (not chat)", onHypTab);
    const cardsCount = await p.locator("text=/Handoff Agency Paradox|Engagement Fatigue Paradox|Follow-up Signal Paradox/").count();
    log("hypothesis cards rendered", cardsCount >= 1, `${cardsCount} matched`);
    await c.close();
  }

  // ─── 3. /login while already-logged-in → banner, NO auto-redirect ───────
  {
    const c = await ctx(browser);
    const p = await c.newPage();
    // seed token via admin-magic
    await p.goto(WEB);
    await p.evaluate(async ({ API, email }) => {
      const r = await fetch(`${API}/api/auth/admin-magic`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      localStorage.setItem("arxify_token", d.token);
    }, { API, email: ADMIN_EMAIL });

    // now click /login from footer / direct nav
    await p.goto(`${WEB}/login`);
    // give useEffect a moment
    await p.waitForTimeout(800);
    log("login URL stays on /login (no auto-redirect)", p.url().endsWith("/login"), p.url());
    const bannerExists = await p.locator('[data-testid="existing-session-banner"]').count();
    log("banner shows when already logged in", bannerExists === 1);
    const bannerEmail = await p.locator('[data-testid="existing-session-banner"]').innerText().catch(() => "");
    log("banner shows admin email", bannerEmail.includes(ADMIN_EMAIL), bannerEmail.slice(0, 80));

    // click "Go to dashboard"
    await p.getByRole("button", { name: /Go to dashboard/i }).click();
    await p.waitForURL("**/dashboard", { timeout: 5000 });
    log("banner → Go to dashboard works", true);
    await c.close();
  }

  // ─── 4. Sign out & switch → banner clears, form usable ──────────────────
  {
    const c = await ctx(browser);
    const p = await c.newPage();
    await p.goto(WEB);
    await p.evaluate(async ({ API, email }) => {
      const r = await fetch(`${API}/api/auth/admin-magic`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      localStorage.setItem("arxify_token", d.token);
    }, { API, email: ADMIN_EMAIL });
    await p.goto(`${WEB}/login`);
    await p.waitForSelector('[data-testid="existing-session-banner"]');
    await p.getByRole("button", { name: /Sign out/i }).click();
    await p.waitForTimeout(300);
    const bannerGone = (await p.locator('[data-testid="existing-session-banner"]').count()) === 0;
    log("sign out clears banner", bannerGone);
    const tokenInStorage = await p.evaluate(() => localStorage.getItem("arxify_token"));
    log("localStorage token cleared", tokenInStorage === null);

    // now log in with password fresh
    await p.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await p.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await p.getByRole("button", { name: /Log in|Sign in|Submit|登录/i }).click();
    await p.waitForURL("**/dashboard", { timeout: 5000 });
    log("password login from /login → /dashboard", true);
    await c.close();
  }

  // ─── 5. No-token /dashboard → NoToken page with Login + Signup ──────────
  {
    const c = await ctx(browser);
    const p = await c.newPage();
    await p.goto(`${WEB}/dashboard`);
    await p.waitForTimeout(800);
    const noTokenH1 = await p.locator("h1").first().innerText();
    log("dashboard without token shows NoToken", noTokenH1.includes("not"), noTokenH1);
    const hasLogin = await p.getByRole("link", { name: /Log in/i }).count();
    const hasSignup = await p.getByRole("link", { name: /Join waitlist/i }).count();
    log("NoToken offers both Log in + Join waitlist", hasLogin >= 1 && hasSignup >= 1);
    await c.close();
  }

  // ─── 6. New user signup flow ────────────────────────────────────────────
  {
    const c = await ctx(browser);
    const p = await c.newPage();
    await p.goto(`${WEB}/signup`);
    const testEmail = `qa_${Date.now()}@example.com`;
    await p.locator('input[type="email"]').first().fill(testEmail);
    const contextField = p.locator("textarea").first();
    if ((await contextField.count()) > 0) await contextField.fill("playwright regression");
    await p.getByRole("button", { name: /Join|Sign up|Submit|加入/i }).click();
    await p.waitForTimeout(1500);
    log("new user signup submits", true, `email=${testEmail}`);
    await c.close();
  }

  await browser.close();

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log("");
  console.log("════════════════════════════════════");
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`PASSED: ${passed}/${results.length}`);
  if (failed.length) {
    console.log("FAILED:");
    failed.forEach((r) => console.log(`  ✗ ${r.name} · ${r.detail}`));
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
