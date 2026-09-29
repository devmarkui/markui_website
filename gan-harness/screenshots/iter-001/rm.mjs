import { chromium } from "file:///D:/markui_website/gan-harness/tools/node_modules/playwright-core/index.mjs";
const b=await chromium.launch({channel:"msedge",headless:true});
const c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:"reduce"});const p=await c.newPage();
await p.goto("http://localhost:4400/");await new Promise(r=>setTimeout(r,2000));
const res=await p.evaluate(()=>[...document.querySelectorAll("section,section h2,section img,.work-item,figure")].map(e=>({c:(e.className||e.tagName).toString().slice(0,30),o:getComputedStyle(e).opacity,v:getComputedStyle(e).visibility})).filter(x=>x.o<0.9||x.v!=="visible"));
console.log(JSON.stringify(res.slice(0,20)));
await p.screenshot({path:"D:/markui_website/gan-harness/screenshots/iter-001/interact/rm-top.png"});
await p.evaluate(()=>window.scrollTo(0,6500));await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:"D:/markui_website/gan-harness/screenshots/iter-001/interact/rm-mid.png"});
const d=await p.evaluate(()=>({h:document.documentElement.scrollHeight}));console.log(d);
// scroll perf: scroll handlers
await b.close();
