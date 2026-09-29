// Entry point. Each behaviour is isolated so one failure can't take the
// page down with it. The scrubber starts first because Why and Process
// register with it; the desk starts before the hero because the hero's
// fader drives it.

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

const run = (name, fn) => {
  try {
    fn();
  } catch (error) {
    console.warn(`[markui] ${name} did not start`, error);
  }
};

run("ramp", initRamp);
run("scrub", initScrub);
run("desk", initDesk);
run("nav", initNav);
run("hero", initHero);
run("reveal", initReveal);
run("services", initServices);
run("dial", initDial);
run("work", initWork);
run("why", initWhy);
run("process", initProcess);
run("contact", initContact);
run("scope", initScope);
