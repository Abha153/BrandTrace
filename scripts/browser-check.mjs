// Real-browser check (headless Chromium): per-browser review privacy, real data only, no horizontal overflow, no console errors.
// Setup:  npm run build && npm i --no-save playwright-core @sparticuz/chromium
// Run:    NODE_ENV=production PORT=3200 BRANDTRACE_DB=/tmp/check.db npx tsx server.ts &   then   node scripts/browser-check.mjs
// Linux only as written (uses @sparticuz/chromium). Writes screenshots to docs/screenshots.
import { chromium } from "playwright-core";
const sp = (await import("@sparticuz/chromium")).default;
const browser = await chromium.launch({ executablePath: await sp.executablePath(), args: sp.args.filter((a) => !/disable-web-security|single-process/.test(a)), headless: true });
const URL = process.env.APP_URL || "http://127.0.0.1:3200", OUT = process.env.SHOT_DIR || "docs/screenshots";
let fails = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const DRAFT = "Meet BrandTrace Suite, a revolutionary product. The standard tier is only $39/month.";
const mk = async (w, h) => { const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage(); page.errs = []; page.on("pageerror", (e) => page.errs.push(String(e))); page.on("console", (m) => m.type() === "error" && !/status of 404/.test(m.text()) && page.errs.push(m.text())); return { ctx, page }; };
const body = (p) => p.evaluate(() => document.body.innerText);

const A = await mk(1440, 900); await A.page.goto(URL); await A.page.waitForSelector("h2:text(\"No reviews yet\")", { timeout: 15000 });
let t = await body(A.page);
ok(!/Facebook|Apr 2\d|from last week|Brand mention detected|Yash|Pro Plan/.test(t), "empty dashboard shows no fabricated activity or trends");
await A.page.screenshot({ path: OUT + "/dashboard-empty-1440.png" });

const created = await A.page.evaluate(async (d) => { const r = await fetch("/api/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ draft: d }) }); return r.json(); }, DRAFT);
ok(created.id === 1 && created.findings.length >= 2 && created.status === "Changes Requested", `review saved (id ${created.id}, ${created.findings.length} findings, ${created.status})`);
await A.page.reload(); await A.page.waitForSelector("text=Recent reviews", { timeout: 15000 });
t = await body(A.page);
ok(/Changes requested/i.test(t) && /Recent reviews/.test(t) && !/from last week|Yash/.test(t), "dashboard shows real counts from saved review");
await A.page.screenshot({ path: OUT + "/dashboard-1440.png" });
await A.page.getByRole("button", { name: /Reviews Library/ }).first().click(); await A.page.waitForSelector("text=Saved reviews");
t = await body(A.page);
ok(t.includes("Meet BrandTrace Suite") && !t.includes("Amazing product"), "library lists the real review and none of the old mock reviews");
await A.page.screenshot({ path: OUT + "/library-1440.png" });
await A.page.getByText("Meet BrandTrace Suite").first().click(); await A.page.waitForTimeout(800);
t = await body(A.page);
ok(!/1,?248|\+12%|\+4% from last audit/.test(t), "results page has no invented mention count or trend");
await A.page.screenshot({ path: OUT + "/results-1440.png" });

const B = await mk(1440, 900); await B.page.goto(URL); await B.page.waitForSelector("h2:text(\"No reviews yet\")", { timeout: 15000 });
const bCount = await B.page.evaluate(async () => (await (await fetch("/api/reviews")).json()).count);
ok(bCount === 0, `a second browser on the shared demo workspace sees 0 reviews (got ${bCount})`);
ok(await B.page.evaluate(async () => (await fetch("/api/reviews/1/status", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "Approved" }) })).status) === 404, "second browser cannot approve the first browser's review");

for (const w of [320, 375, 768, 1440]) {
  const M = await mk(w, 800); await A.ctx.storageState().then(async (s) => { await M.ctx.addInitScript((c) => { try { localStorage.setItem("brandtrace_client_id", c); } catch {} }, await A.page.evaluate(() => localStorage.getItem("brandtrace_client_id"))); });
  await M.page.goto(URL); await M.page.waitForSelector("text=Recent reviews", { timeout: 15000 });
  const m = await M.page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(m[0] <= m[1], `no horizontal overflow on dashboard at ${w}px (${m[0]}/${m[1]})`);
  if (w === 375) await M.page.screenshot({ path: OUT + "/dashboard-375.png", fullPage: true });
  ok(M.page.errs.length === 0, `no console/page errors at ${w}px ${M.page.errs[0] || ""}`);
  await M.ctx.close();
}
ok(A.page.errs.length === 0 && B.page.errs.length === 0, `no console/page errors in main flow ${A.page.errs[0] || B.page.errs[0] || ""}`);
await browser.close(); process.exit(fails ? 1 : 0);
