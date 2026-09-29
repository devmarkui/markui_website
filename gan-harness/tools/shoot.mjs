// Screenshot + audit tool for the GAN design loop.
//
//   node gan-harness/tools/shoot.mjs --out gan-harness/screenshots/iter-001 [--url http://localhost:4400/]
//
// For each viewport (desktop 1440, tablet 768, mobile 390) it:
//   - records console errors, page errors and failed requests
//   - captures the hero at several moments after load (intro motion)
//   - scrolls the whole page once to trigger reveal animations, then captures
//     one frame per viewport-height ("frame-NN.png") so every section can be
//     inspected at full resolution
//   - measures horizontal overflow and lists the elements causing it
// Desktop also gets: keyboard focus walk, hover states on links/buttons, a
// reduced-motion hero capture, and a basic a11y/heading audit.
// Everything lands in --out, with report.json and summary.md.

import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1]?.startsWith("--") ? true : all[i + 1] ?? true]);
    return acc;
  }, []),
);
const URL_ = args.url || "http://localhost:4400/";
const OUT = path.resolve(args.out || "gan-harness/screenshots/latest");
const MAX_FRAMES = Number(args["max-frames"] || 22);
const SETTLE = Number(args.settle || 800); // extra wait after load before the scroll-through (e.g. for a loader)
const HERO_TIMES = String(args["hero-times"] || "250,1200,3200").split(",").map(Number);
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch (e) {
    const fallback = path.join(
      process.env.LOCALAPPDATA || "",
      "ms-playwright/chromium-1234/chrome-win64/chrome.exe",
    );
    if (fs.existsSync(fallback)) return chromium.launch({ executablePath: fallback, headless: true });
    throw e;
  }
}

async function scrollThrough(page, step) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= total; y += step) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await sleep(160);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
}

async function overflowOffenders(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const cs = getComputedStyle(el);
        if (cs.position === "fixed" && cs.visibility === "hidden") continue;
        let clipped = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p);
          if (/(hidden|clip|auto|scroll)/.test(o.overflowX)) { clipped = true; break; }
        }
        if (!clipped) {
          out.push({
            el: el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : ""),
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      }
      if (out.length >= 12) break;
    }
    return {
      viewport: vw,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > vw + 1,
      offenders: out,
    };
  });
}

async function audit(page) {
  return page.evaluate(() => {
    const txt = (el) => (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 80);
    const headings = [...document.querySelectorAll("h1,h2,h3")].map((h) => `${h.tagName}: ${txt(h)}`);
    const imgsNoAlt = [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).map((i) => i.src.split("/").pop());
    const unnamed = [...document.querySelectorAll("a,button")].filter((b) => !txt(b) && !b.querySelector("img[alt]:not([alt=''])")).map((b) => b.outerHTML.slice(0, 120));
    const brokenImgs = [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.split("/").pop());
    const fonts = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, ""));
    const inputs = [...document.querySelectorAll("input,textarea,select")].map((i) => ({
      name: i.name || i.id,
      labelled: Boolean((i.id && document.querySelector(`label[for="${i.id}"]`)) || i.closest("label") || i.getAttribute("aria-label")),
    }));
    return {
      title: document.title,
      lang: document.documentElement.lang,
      docHeight: document.documentElement.scrollHeight,
      headings,
      h1Count: document.querySelectorAll("h1").length,
      imgsNoAlt,
      brokenImgs,
      unnamedControls: unnamed.slice(0, 10),
      fontsLoaded: [...new Set(fonts)],
      formInputs: inputs,
      linkCount: document.querySelectorAll("a[href]").length,
      deadLinks: [...document.querySelectorAll('a[href="#"], a:not([href])')].length,
    };
  });
}

const report = { url: URL_, at: new Date().toISOString(), viewports: {} };
const browser = await launch();

for (const vp of VIEWPORTS) {
  const dir = path.join(OUT, vp.name);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: Boolean(vp.isMobile),
    hasTouch: Boolean(vp.hasTouch),
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 300)));
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 300)));
  page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => r.status() >= 400 && errors.push(`http ${r.status()}: ${r.url()}`));

  const t0 = Date.now();
  await page.goto(URL_, { waitUntil: "domcontentloaded", timeout: 45000 });
  const vpData = { errors };

  if (vp.name === "desktop" || vp.name === "mobile") {
    for (const t of HERO_TIMES) {
      const wait = t - (Date.now() - t0);
      if (wait > 0) await sleep(wait);
      await page.screenshot({ path: path.join(dir, `hero-t${t}ms.png`) });
    }
  }
  await page.waitForLoadState("load", { timeout: 45000 }).catch(() => {});
  await sleep(SETTLE);

  await scrollThrough(page, Math.round(vp.height * 0.5));
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const frames = [];
  const step = vp.height;
  let n = 0;
  for (let y = 0; y < height && n < MAX_FRAMES; y += step, n++) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await sleep(900);
    const f = `frame-${String(n).padStart(2, "0")}.png`;
    await page.screenshot({ path: path.join(dir, f) });
    frames.push(f);
  }
  vpData.frames = frames;
  vpData.framesTruncated = height > MAX_FRAMES * step;
  vpData.overflow = await overflowOffenders(page);

  if (vp.name === "desktop") {
    vpData.audit = await audit(page);

    // Keyboard focus walk from the top.
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
    const focus = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      await sleep(120);
      focus.push(
        await page.evaluate(() => {
          const a = document.activeElement;
          if (!a || a === document.body) return "(body)";
          const cs = getComputedStyle(a);
          const ring = cs.outlineStyle !== "none" && cs.outlineWidth !== "0px" ? `outline ${cs.outlineWidth} ${cs.outlineColor}` : cs.boxShadow !== "none" ? "box-shadow" : "NO VISIBLE RING";
          return `${a.tagName.toLowerCase()} "${(a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 40)}" → ${ring}`;
        }),
      );
      if (i === 2) await page.screenshot({ path: path.join(dir, "focus-tab3.png") });
    }
    vpData.focusWalk = focus;

    // Hover the first few interactive elements in the viewport after the hero.
    const hoverTargets = await page.$$("main a, main button");
    let h = 0;
    for (const el of hoverTargets) {
      if (h >= 4) break;
      const box = await el.boundingBox();
      if (!box || box.width < 40) continue;
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await el.hover({ timeout: 1500 }).catch(() => {});
      await sleep(450);
      await page.screenshot({ path: path.join(dir, `hover-${h}.png`) });
      h++;
    }
  }

  // Full page (can distort sticky/100vh layouts — prefer the frames).
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  await page.screenshot({ path: path.join(dir, "fullpage-approx.png"), fullPage: true }).catch((e) => errors.push("fullpage: " + e.message));

  report.viewports[vp.name] = vpData;
  await ctx.close();
}

// Reduced motion: hero should still be complete and legible.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: "load", timeout: 45000 });
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, "desktop", "reduced-motion-hero.png") });
  // Reduced-motion end of page (static trace / finale should be present).
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, "desktop", "reduced-motion-end.png") });
  await ctx.close();
}

await browser.close();

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
const lines = [`# Capture summary — ${URL_}`, ""];
for (const [name, v] of Object.entries(report.viewports)) {
  lines.push(`## ${name}`);
  lines.push(`- frames: ${v.frames.length}${v.framesTruncated ? " (truncated)" : ""} in ${name}/`);
  lines.push(`- horizontal scroll: ${v.overflow.hasHorizontalScroll} (scrollWidth ${v.overflow.scrollWidth} vs ${v.overflow.viewport})`);
  if (v.overflow.offenders.length) lines.push(`- overflow offenders: ${v.overflow.offenders.map((o) => `${o.el} [${o.left}→${o.right}]`).join("; ")}`);
  lines.push(`- errors (${v.errors.length}): ${v.errors.slice(0, 8).join(" | ") || "none"}`);
  if (v.audit) {
    lines.push(`- title: ${v.audit.title} | lang: ${v.audit.lang} | h1 count: ${v.audit.h1Count} | doc height: ${v.audit.docHeight}px`);
    lines.push(`- fonts loaded: ${v.audit.fontsLoaded.join(", ") || "none"}`);
    lines.push(`- imgs without alt: ${v.audit.imgsNoAlt.length} | broken imgs: ${v.audit.brokenImgs.join(", ") || "none"} | unnamed controls: ${v.audit.unnamedControls.length} | dead links (# or none): ${v.audit.deadLinks}`);
    lines.push(`- form inputs: ${v.audit.formInputs.map((i) => `${i.name}${i.labelled ? "" : " (UNLABELLED)"}`).join(", ") || "none"}`);
    lines.push(`- headings:\n${v.audit.headings.map((x) => "    " + x).join("\n")}`);
    lines.push(`- focus walk:\n${v.focusWalk.map((x) => "    " + x).join("\n")}`);
  }
  lines.push("");
}
fs.writeFileSync(path.join(OUT, "summary.md"), lines.join("\n"));
console.log(lines.join("\n"));
