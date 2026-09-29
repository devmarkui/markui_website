// Decode: text that tunes in character by character out of glyph static.
// Used for small type where particles would only be dust: the hero eyebrow,
// the stat readouts (digits roll and lock one by one), client names on the
// dial, reviewers' names and the finale's kicker.
//
// prepDecode(el) keeps the real text for assistive tech (a visually hidden
// copy) and returns an aria-hidden twin that is the one that scrambles.

import { add, remove } from "./ticker.js";

export const GLYPHS = "▚▞▘▗/\\|+=<>01#%*";
const DIGITS = "0123456789";

export function prepDecode(el) {
  if (el.dataset.decodeReady) return el.querySelector("[data-decode-twin]");
  el.dataset.decodeReady = "1";
  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = el.textContent;
  const twin = document.createElement("span");
  twin.setAttribute("aria-hidden", "true");
  twin.dataset.decodeTwin = "";
  while (el.firstChild) twin.appendChild(el.firstChild);
  el.append(sr, twin);
  return twin;
}

// Scramble every text node inside `nodes` and let them lock in, left to
// right, one node after another. Child elements (like a "%" span) keep
// their styling because only text nodes are rewritten.
export function decode(nodes, { stagger = 160, rate = 30, hold = 0 } = {}) {
  const items = [];
  nodes.forEach((node, k) => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (t.parentElement.closest(".sr-only")) continue;
      items.push({ t, text: t.nodeValue, k });
    }
  });
  if (!items.length) return;
  const start = performance.now() + hold;
  let offset = 0;
  items.forEach((it) => {
    it.off = offset;
    offset += it.text.length;
  });
  const step = (now) => {
    let done = true;
    items.forEach((it) => {
      const t = now - start - it.k * stagger;
      const settled = Math.floor(Math.max(0, t) / rate) - it.off * 0.35;
      let out = "";
      for (let i = 0; i < it.text.length; i += 1) {
        const ch = it.text[i];
        if (i < settled || ch === " " || ch === " ") out += ch;
        else {
          const set = /\d/.test(ch) ? DIGITS : /[%+.,·•&]/.test(ch) ? null : GLYPHS;
          if (!set) {
            out += ch;
            continue;
          }
          out += set[(Math.random() * set.length) | 0];
          done = false;
        }
      }
      if (it.t.nodeValue !== out) it.t.nodeValue = out;
    });
    if (done) remove(step);
  };
  add(step);
}
