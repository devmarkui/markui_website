// Entry point. Each behaviour is isolated so one failure can't take the
// page down with it. Order matters in three places:
// - the scrubber starts before Why and Process, which register with it;
// - the desk starts before the hero, whose fader drives it;
// - the signal starts after the hero and Process (it drives both).
// The loader is a separate module that runs first (see index.html); the
// hero's entrance waits for its dot to land.

import { initScrub } from "./scrub.js";
import { initDesk } from "./desk.js";
import { initNav } from "./nav.js";
import { initHero } from "./hero.js";
import { initReveal } from "./reveal.js";
import { initServices, initRamp } from "./services.js";
import { initDial } from "./dial.js";
import { initWork } from "./work.js";
import { initWhy } from "./why.js";
import { initProcess } from "./process.js";
import { initContact } from "./contact.js";
import { initScope } from "./contact-scope.js";
import { initSignal } from "./signal.js";
import { whenLoaded } from "./loader.js";

const run = (name, fn) => {
  try {
    return fn();
  } catch (error) {
    console.warn(`[markui] ${name} did not start`, error);
    return null;
  }
};

run("ramp", initRamp);
run("scrub", initScrub);
run("desk", initDesk);
run("nav", initNav);
const hero = run("hero", initHero);
run("reveal", initReveal);
run("services", initServices);
run("dial", initDial);
run("work", initWork);
run("why", initWhy);
run("process", initProcess);
run("contact", initContact);
run("scope", initScope);
run("signal", () => initSignal(hero));
whenLoaded((result) => {
  document.documentElement.classList.add("hero-in");
  if (hero) run("hero entrance", () => hero.enter(result));
});
