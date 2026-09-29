// Starting point for ad-hoc interaction checks (mobile menu, form validation,
// hover states, filters). Copy it, edit the steps, then run it from the project
// root:
//   node gan-harness/tools/interact-example.mjs --out gan-harness/screenshots/iter-001/interact
// Selectors below are guesses; read gan-harness/prototype/index.html for the
// real ones before running.

import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const outIdx = process.argv.indexOf("--out");
const OUT = path.resolve(outIdx > -1 ? process.argv[outIdx + 1] : "gan-harness/screenshots/interact");
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const log = [];

// --- Mobile menu -----------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.push("pageerror: " + e));
  await page.goto("http://localhost:4400/", { waitUntil: "load" });
  await sleep(1500);
  const toggle = page.locator('button[aria-controls], button[aria-label*="menu" i]').first();
  if (await toggle.count()) {
    await toggle.click();
    await sleep(700);
    await shot(page, "mobile-menu-open");
    log.push("menu aria-expanded after open: " + (await toggle.getAttribute("aria-expanded")));
    await page.keyboard.press("Escape");
    await sleep(600);
    await shot(page, "mobile-menu-after-escape");
    log.push("menu aria-expanded after Escape: " + (await toggle.getAttribute("aria-expanded")));
    log.push("focus after Escape: " + (await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 100))));
  } else log.push("no menu toggle found");
  await ctx.close();
}

// --- Contact form ----------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.push("pageerror: " + e));
  await page.goto("http://localhost:4400/", { waitUntil: "load" });
  const form = page.locator("form").first();
  await form.scrollIntoViewIfNeeded();
  await sleep(1200);
  await form.locator('button[type="submit"], button:not([type])').first().click();
  await sleep(500);
  await shot(page, "form-empty-submit");
  const email = form.locator('input[type="email"], input[name*="email" i]').first();
  if (await email.count()) await email.fill("not-an-email");
  await form.locator('button[type="submit"], button:not([type])').first().click();
  await sleep(500);
  await shot(page, "form-bad-email");
  // Happy path. Adjust the field selectors to the real form.
  await form.locator('input[name*="name" i]').first().fill("Test Person").catch(() => {});
  if (await email.count()) await email.fill("test@example.com");
  await form.locator("textarea").first().fill("We need a new website and a launch campaign.").catch(() => {});
  const submit = form.locator('button[type="submit"], button:not([type])').first();
  await submit.click();
  await submit.click({ timeout: 500 }).catch(() => log.push("second click blocked (good)"));
  await sleep(300);
  await shot(page, "form-sending");
  await sleep(1500);
  await shot(page, "form-success");
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, "log.txt"), log.join("\n"));
console.log(log.join("\n"));
