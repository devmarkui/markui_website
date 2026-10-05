// Tune-in: which part of the page tunes in how. One engine (particles.js),
// one vocabulary (static resolving into signal), a different treatment per
// section. The travelling signal (signal.js) is what sets each one off: as
// the dot passes a section's channel, a row or a print, it dispatches
// "signal:feed" on it with the point it arrived at, and the tune-in starts
// from there. If the signal never arrives (a reload mid-page, a slow
// scroll), each scene tunes in by itself once it is well on screen.
//
//   Proof     heading from static; "60+" tunes in digit by digit out of
//             columns of static; the readouts roll their digits and lock
//   Services  the crescendo rises out of its hairpin, left to right; each
//             row's name locks on from a scanline when the signal feeds it
//   Work      heading from static; each print de-noises from the point the
//             signal's branch touches it
//   Voices    heading from static; the big review is written by the signal
//             sweeping under it; the others rain in or scan in; names decode
//   Why       heading from static; the knob throws sparks at each detent
//   Process   "One clean signal." resolves out of a noise band, left to right
//   Contact   the heading rises out of the input line below it
//   Finale    "Less Noise. More Impact" builds outwards from the dot as it docks

import { enabled, engine } from "./particles.js";
import { TuneText } from "./particle-fx.js";
import { Sparks } from "./particle-sparks.js";
import { Denoise } from "./denoise.js";
import { decode, prepDecode } from "./decode.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// A scene tunes in when its feeder is fed (or by itself, as a fallback).
function feed(target, scene) {
  if (!target || !scene) return;
  target.addEventListener("signal:feed", (e) => scene.trigger(e.detail || null));
}

function text(el, o) {
  return el ? new TuneText(el, o) : null;
}

export function initTuneIn() {
  if (!enabled) return null;
  document.documentElement.classList.add("fx");
  const scenes = {};

  // Proof ---------------------------------------------------------------
  const proof = $("#proof");
  scenes.proofTitle = text($(".proof-title"), { max: 1500, dust: 90 });
  feed(proof, scenes.proofTitle);
  const reads = $$(".proof-read-value").map(prepDecode);
  const sixty = text($(".proof-lead-value"), { home: "columns", order: "chars", split: "char", max: 3800, dust: 160, travel: 420, spread: 280, charStep: 120 });
  if (sixty) {
    sixty.onTrigger = () => decode(reads, { stagger: 120, rate: 40, hold: 100 });
    feed(proof, { trigger: () => window.setTimeout(() => sixty.trigger(null), 80) });
  }
  const dialNames = $$(".proof-dial-name");
  dialNames.forEach(prepDecode);
  document.addEventListener("dial:tune", (e) => {
    const el = dialNames[e.detail];
    if (el) decode([el.querySelector("[data-decode-twin]")], { rate: 34 });
  });

  // Services ------------------------------------------------------------
  const services = $("#services");
  scenes.servicesTitle = text($(".services-title"), { home: "band", bandAt: "bottom", bandGap: 40, order: "ltr", spread: 240, max: 2400 });
  feed(services, scenes.servicesTitle);
  if (scenes.servicesTitle) scenes.servicesTitle.onReveal = () => $(".services-head")?.classList.add("is-tuned");
  $$("[data-service]").forEach((row) => {
    const name = $(".services-name", row);
    const s = text(row, { source: name, home: "band", bandAt: "top", bandGap: 22, order: "ltr", travel: 300, spread: 160, max: 1300, dust: 50 });
    if (!s) return;
    s.onTrigger = () => row.classList.add("is-locked");
    feed(row, s);
  });

  // Work ----------------------------------------------------------------
  const work = $("#work");
  scenes.workTitle = text($(".work-title"), { max: 1800 });
  feed(work, scenes.workTitle);
  $$(".work-item").forEach((item) => {
    const frame = $(".work-frame", item);
    if (!frame) return;
    const d = new Denoise(frame);
    feed(item, d);
  });

  // Voices --------------------------------------------------------------
  const voices = $("#voices");
  scenes.voicesTitle = text($(".voices-title"), { max: 1400 });
  feed(voices, scenes.voicesTitle);
  $$(".voices-item").forEach((item) => {
    const quote = $(".voices-text", item);
    const names = $$(".voices-name", item).map(prepDecode);
    const say = () => decode(names, { rate: 26, stagger: 120 });
    if (!quote) {
      // The silent five-star block: its names decode as it arrives.
      const once = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        once.disconnect();
        say();
      }, { rootMargin: "0px 0px -8% 0px" });
      once.observe(item);
      return;
    }
    let s;
    if (item.classList.contains("voices-item-xxl")) {
      s = text(quote, { home: "band", bandAt: "bottom", bandGap: 60, order: "release", travel: 360, max: 3600, dust: 160, useBand: false, waitMax: 700 });
      scenes.sweep = s;
      voices.addEventListener("signal:sweep", (e) => s.release(e.detail.x));
    } else if (item.classList.contains("voices-item-s")) {
      s = text(quote, { home: "scan", order: "ttb", travel: 300, spread: 240, max: 1400, dust: 40 });
    } else {
      s = text(quote, { home: "rain", order: "ltr", travel: 360, spread: 200, max: 2000, dust: 80 });
    }
    if (s) s.onTrigger = say;
  });

  // Why -----------------------------------------------------------------
  const why = $("#why");
  scenes.whyTitle = text($(".why-title"), { max: 1400 });
  feed(why, scenes.whyTitle);
  const knob = $("[data-why-knob]");
  if (knob) {
    const sparks = new Sparks(knob, { ring: 0.5, pad: 80 });
    document.addEventListener("why:turn", (e) => sparks.burst(e.detail.angle, 60));
  }

  // Process -------------------------------------------------------------
  const process = $("#process");
  scenes.processBig = text($(".process-big"), { home: "noise", order: "ltr", spread: 300, travel: 400, max: 3200, dust: 120 });
  feed(process, scenes.processBig);
  const kicker = $(".process-kicker");
  if (kicker && scenes.processBig) {
    const twin = prepDecode(kicker);
    scenes.processBig.onTrigger = () => decode([twin], { rate: 30 });
  }

  // Contact -------------------------------------------------------------
  const contact = $("#contact");
  scenes.contactTitle = text($(".contact-title"), { home: "band", bandAt: "bottom", bandGap: 90, order: "origin", max: 2600 });
  feed(contact, scenes.contactTitle);

  // Finale: builds outwards from the dot as it docks ----------------------
  const finale = $("[data-finale]");
  if (finale) {
    const k = $(".finale-kicker", finale);
    if (k) k.setAttribute("data-fx-skip", "");
    const s = text(finale, { home: "field", order: "origin", spread: 320, travel: 400, max: 4200, dust: 200, useBand: false, waitMax: 900 });
    finale.addEventListener("signal:dock", (e) => s && s.trigger(e.detail || null));
    scenes.finale = s;
  }

  return { scenes, engine };
}
