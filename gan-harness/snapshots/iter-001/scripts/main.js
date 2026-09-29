// Entry point. Each behaviour is isolated so one failure can't take the
// page down with it.

import { initNav } from "./nav.js";
import { initHero } from "./hero.js";
import { initReveal } from "./reveal.js";
import { initServices } from "./services.js";
import { initDial } from "./dial.js";
import { initWork } from "./work.js";
import { initContact } from "./contact.js";

const run = (name, fn) => {
  try {
    fn();
  } catch (error) {
    console.warn(`[markui] ${name} did not start`, error);
  }
};

run("nav", initNav);
run("hero", initHero);
run("reveal", initReveal);
run("services", initServices);
run("dial", initDial);
run("work", initWork);
run("contact", initContact);
