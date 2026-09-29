import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
const OUT = path.resolve("gan-harness/screenshots/iter-003/interact");
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const L = (s) => { log.push(s); console.log(s); };
const browser = await chromium.launch({ channel: "msedge", headless: true });
const URL = "http://localhost:4400/";
async function mk(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => L("PAGEERROR: " + e));
  page.on("console", (m) => { if (m.type() === "error") L("CONSOLE ERROR: " + m.text()); });
  page.on("requestfailed", (r) => L("REQFAIL: " + r.url()));
  page.on("response", (r) => { if (r.status() >= 400) L("HTTP " + r.status() + " " + r.url()); });
  return { ctx, page };
}
const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + ".png") });
const ae = (p) => p.evaluate(() => { const e = document.activeElement; return e ? e.tagName + "." + e.className + "#" + e.id + " " + (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 40) : "none"; });
const errs = (p) => p.evaluate(() => [...document.querySelectorAll("[data-error]")].map((e) => e.textContent.trim()).filter(Boolean).join(" | "));

for (const mode of ["natural", "click", "key"]) {
  const { ctx, page } = await mk();
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: "commit" });
  if (mode === "click") { await sleep(700); await page.mouse.click(700, 400); }
  if (mode === "key") { await sleep(700); await page.keyboard.press("Space"); }
  const tAct = Date.now() - t0;
  let gone = -1;
  while (Date.now() - t0 < 10000) {
    const g = await page.evaluate(() => !document.querySelector("[data-loader]")).catch(() => false);
    if (g) { gone = Date.now() - t0; break; }
    await sleep(40);
  }
  L(`loader ${mode}: action at ${tAct}ms, overlay removed at ${gone}ms`);
  await sleep(300);
  await page.keyboard.press("Tab");
  L(`  after ${mode}: focus = ` + (await ae(page)));
  L(`  scroll works: ` + (await page.evaluate(() => { window.scrollTo(0, 300); return window.scrollY; })));
  await ctx.close();
}
{
  const { ctx, page } = await mk({ reducedMotion: "reduce" });
  await page.goto(URL, { waitUntil: "load" });
  await sleep(300);
  L("reduced: loader present = " + (await page.evaluate(() => !!document.querySelector("[data-loader]"))));
  await ctx.close();
}
{
  const { ctx, page } = await mk();
  await page.goto(URL, { waitUntil: "load" });
  await sleep(6000);
  for (let x = 100; x < 1100; x += 100) { await page.mouse.move(x, 430, { steps: 4 }); await sleep(60); }
  await page.mouse.move(600, 430, { steps: 4 }); await sleep(250);
  await shot(page, "hero-cursor-headline");
  await page.mouse.move(1000, 300, { steps: 6 }); await sleep(300);
  await shot(page, "hero-cursor-disc");
  const tr = page.locator("[data-fader-track]");
  await tr.focus();
  await page.keyboard.press("ArrowUp"); await page.keyboard.press("ArrowUp"); await page.keyboard.press("ArrowUp");
  L("fader after 3x ArrowUp: " + (await tr.getAttribute("aria-valuenow")));
  await page.keyboard.press("PageUp");
  L("fader after PageUp: " + (await tr.getAttribute("aria-valuenow")));
  await sleep(500); await shot(page, "hero-fader-keys");
  await page.keyboard.press("End");
  L("fader End: " + (await tr.getAttribute("aria-valuenow")));
  await sleep(700); await shot(page, "hero-fader-max");
  await page.keyboard.press("Home");
  L("fader Home: " + (await tr.getAttribute("aria-valuenow")));
  const bb = await tr.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height * 0.9);
  await page.mouse.down(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height * 0.2, { steps: 8 }); await page.mouse.up();
  L("fader after drag up: " + (await tr.getAttribute("aria-valuenow")));
  await sleep(600); await shot(page, "hero-fader-drag");
  await ctx.close();
}
for (const [name, opts] of [["d", { viewport: { width: 1440, height: 900 } }], ["m", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
  const { ctx, page } = await mk(opts);
  await page.goto(URL, { waitUntil: "load" });
  await sleep(6000);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = opts.viewport.height;
  for (let i = 0; i < 10; i++) {
    const y = Math.round((H - vh) * (i / 9));
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await sleep(900);
    await shot(page, `scroll-${name}-${i}`);
  }
  L(`${name}: doc height ${H}, hscroll = ` + (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  if (name === "d") {
    await page.evaluate(() => window.scrollTo(0, 0)); await sleep(500);
    const fps = await page.evaluate(async () => {
      const ts = []; let stop = false;
      const f = (t) => { ts.push(t); if (!stop) requestAnimationFrame(f); }; requestAnimationFrame(f);
      for (let i = 0; i < 100; i++) { window.scrollBy(0, 150); await new Promise((r) => setTimeout(r, 16)); }
      stop = true; const d = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b);
      return { n: d.length, p50: d[Math.floor(d.length * 0.5)], p95: d[Math.floor(d.length * 0.95)], max: d[d.length - 1] };
    });
    L("frame deltas (scrollBy 100x): " + JSON.stringify(fps));
  }
  await ctx.close();
}
{
  const { ctx, page } = await mk({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(URL, { waitUntil: "load" }); await sleep(6000);
  const t = page.locator("[data-nav-toggle]");
  await t.click(); await sleep(800); await shot(page, "menu-open");
  L("menu expanded: " + (await t.getAttribute("aria-expanded")));
  L("focus after open: " + (await ae(page)));
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
  L("after 2 tabs: " + (await ae(page)));
  await page.keyboard.press("Escape"); await sleep(700); await shot(page, "menu-escape");
  L("menu expanded after Esc: " + (await t.getAttribute("aria-expanded")));
  L("focus after Esc: " + (await ae(page)));
  L("toggle size: " + JSON.stringify(await t.boundingBox()));
  await ctx.close();
}
{
  const { ctx, page } = await mk();
  await page.goto(URL, { waitUntil: "load" }); await sleep(5500);
  const fb = page.locator('[data-filter="branding"]');
  await fb.scrollIntoViewIfNeeded(); await sleep(500);
  await fb.click(); await sleep(1800); await shot(page, "filter-branding");
  await fb.focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Enter"); await sleep(1500);
  L("kbd filter pressed: " + (await page.evaluate(() => [...document.querySelectorAll(".work-tuner-btn")].map((b) => b.dataset.filter + ":" + b.getAttribute("aria-pressed")).join(","))));
  await page.locator('[data-filter="all"]').click(); await sleep(1500);
  const form = page.locator("form[data-contact-form]");
  await form.scrollIntoViewIfNeeded(); await sleep(1500);
  const submit = form.locator("[data-submit]");
  await submit.click(); await sleep(600); await shot(page, "form-empty");
  L("errors empty: " + (await errs(page)));
  L("focus after empty submit: " + (await ae(page)));
  await page.fill("#c-name", "Test Person");
  await page.fill("#c-email", "not-an-email");
  await page.fill("#c-message", "Hi");
  await submit.click(); await sleep(500); await shot(page, "form-bad-email");
  L("errors bad email: " + (await errs(page)));
  await page.fill("#c-email", "");
  await submit.click(); await sleep(500);
  L("errors neither: " + (await errs(page)));
  await shot(page, "form-neither");
  await page.fill("#c-message", "x".repeat(600) + " <script>alert(1)</script> emoji");
  await page.fill("#c-phone", "+94 76 088 7702");
  await submit.click();
  await submit.click({ timeout: 300, force: true }).catch(() => L("second click blocked (timeout)"));
  await sleep(300); await shot(page, "form-sending");
  L("submit disabled while sending: " + (await submit.evaluate((b) => b.disabled + "/" + b.getAttribute("aria-disabled"))));
  await sleep(1800); await shot(page, "form-success");
  L("success visible: " + (await page.locator("[data-contact-success]").isVisible()) + "; focus: " + (await ae(page)));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "log.txt"), log.join("\n"));
