import { chromium } from "file:///D:/markui_website/gan-harness/tools/node_modules/playwright-core/index.mjs";
import fs from "node:fs";
const OUT = "D:/markui_website/gan-harness/screenshots/iter-001/interact";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const mk = async (o) => { const c = await browser.newContext(o); const p = await c.newPage(); p.on("pageerror", e=>log.push("pageerror "+e)); p.on("console", m=>{ if(m.type()==="error") log.push("console.error "+m.text()); }); p.on("requestfailed", r=>log.push("reqfail "+r.url())); return [c,p]; };
const shot = (p,n)=>p.screenshot({path:`${OUT}/${n}.png`});
// mobile menu
{ const [c,p]=await mk({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await p.goto("http://localhost:4400/"); await sleep(3500);
  const t=p.locator("[data-nav-toggle]");
  const bb=await t.boundingBox(); log.push("toggle box "+JSON.stringify(bb));
  await t.tap(); await sleep(900); await shot(p,"m-menu-open");
  log.push("expanded "+await t.getAttribute("aria-expanded"));
  log.push("focus in menu: "+await p.evaluate(()=>document.activeElement.className));
  for(let i=0;i<8;i++){await p.keyboard.press("Tab"); log.push("tab "+await p.evaluate(()=>document.activeElement.textContent.trim().slice(0,20)));}
  await p.keyboard.press("Escape"); await sleep(700); await shot(p,"m-menu-esc");
  log.push("after esc expanded "+await t.getAttribute("aria-expanded")+" focus "+await p.evaluate(()=>document.activeElement.className));
  await t.tap(); await sleep(700);
  await p.locator(".nav-menu-link").nth(3).tap(); await sleep(800);
  log.push("after link tap url "+p.url());
  await c.close(); }
// form
{ const [c,p]=await mk({viewport:{width:1440,height:900}});
  await p.goto("http://localhost:4400/"); await sleep(2500);
  const f=p.locator("[data-contact-form]"); await f.scrollIntoViewIfNeeded(); await sleep(1200);
  const sub=f.locator("[data-submit]");
  await sub.click(); await sleep(500); await shot(p,"f-empty");
  log.push("focus after empty "+await p.evaluate(()=>document.activeElement.id));
  log.push("status "+await p.locator("[data-form-status]").innerText());
  log.push("errors "+JSON.stringify(await p.locator("[data-error]").allInnerTexts()));
  await p.fill("#c-name","Test Person"); await p.fill("#c-email","not-an-email"); await p.fill("#c-message","hi");
  await sub.click(); await sleep(500); await shot(p,"f-bad-email");
  log.push("errors2 "+JSON.stringify(await p.locator("[data-error]").allInnerTexts()));
  await p.fill("#c-email",""); await p.fill("#c-phone","abc");
  await sub.click(); await sleep(400);
  log.push("errors3 "+JSON.stringify(await p.locator("[data-error]").allInnerTexts()));
  await p.fill("#c-phone",""); await sub.click(); await sleep(400);
  log.push("errors4 (both missing) "+JSON.stringify(await p.locator("[data-error]").allInnerTexts())); await shot(p,"f-both-missing");
  await p.fill("#c-email","test@example.com"); await p.fill("#c-message","We need a new website and a launch campaign for our company.");
  await p.fill("#c-name","<script>alert(1)</script> "+"x".repeat(300));
  await sub.click(); await sub.click({timeout:400,force:true}).catch(()=>log.push("2nd click blocked"));
  await sleep(300); await shot(p,"f-sending"); log.push("disabled "+await sub.getAttribute("disabled")+" aria-busy "+await sub.getAttribute("aria-busy"));
  await sleep(1800); await shot(p,"f-success");
  log.push("success text "+await p.locator("[data-success-text]").innerText());
  log.push("focus after success "+await p.evaluate(()=>document.activeElement.className));
  await p.locator("[data-contact-reset]").click(); await sleep(500); await shot(p,"f-reset");
  log.push("name after reset '"+await p.inputValue("#c-name")+"'");
  await c.close(); }
// filter + fader + hover
{ const [c,p]=await mk({viewport:{width:1440,height:900}});
  await p.goto("http://localhost:4400/"); await sleep(4000);
  const tr=p.locator("[data-fader-track]"); await tr.focus();
  await p.keyboard.press("ArrowUp"); await p.keyboard.press("ArrowUp"); await p.keyboard.press("PageUp"); await sleep(600);
  log.push("fader after keys "+await tr.getAttribute("aria-valuenow")); await shot(p,"h-fader-keys");
  await p.keyboard.press("End"); await sleep(700); log.push("End "+await tr.getAttribute("aria-valuenow")); await shot(p,"h-fader-100");
  const b=await tr.boundingBox(); await p.mouse.move(b.x+b.width/2,b.y+b.height-5); await p.mouse.down(); await p.mouse.move(b.x+b.width/2,b.y+20,{steps:8}); await p.mouse.up(); await sleep(700);
  log.push("drag→ "+await tr.getAttribute("aria-valuenow")); await shot(p,"h-fader-dragged");
  await p.keyboard.press("Home"); await sleep(600); log.push("Home "+await tr.getAttribute("aria-valuenow"));
  await p.locator("button[data-filter=web]").scrollIntoViewIfNeeded(); await sleep(1500);
  await p.locator("button[data-filter=web]").click(); await sleep(1200); 
  log.push("status "+await p.locator("[data-work-status]").innerText());
  await p.locator("#work").scrollIntoViewIfNeeded(); await p.evaluate(()=>window.scrollTo(0,document.querySelector("#work").offsetTop+500)); await sleep(1200); await shot(p,"w-filter-web");
  await p.locator("button[data-filter=multimedia]").focus(); await p.keyboard.press("Enter"); await sleep(1000); await shot(p,"w-filter-multi");
  log.push("pressed "+await p.locator("button[data-filter=multimedia]").getAttribute("aria-pressed"));
  await p.locator("button[data-filter=all]").click(); await sleep(800);
  const item=p.locator(".work-item, .work-card, .work-print").first(); log.push("work item count "+await item.count());
  await p.evaluate(()=>window.scrollTo(0,document.querySelector("#work").offsetTop+700)); await sleep(1200);
  await p.mouse.move(400,500); await sleep(900); await shot(p,"w-hover");
  await c.close(); }
await browser.close(); fs.writeFileSync(`${OUT}/log.txt`,log.join("\n")); console.log(log.join("\n"));
