# Evaluation: Iteration 001 (design mode)

## Evaluation Mode
**Achieved:** `scripted-playwright (Edge headless) + screenshots`. Playwright MCP was not available. I ran `tools/shoot.mjs` (desktop 1440, tablet 768, mobile 390) and my own `screenshots/iter-001/interact.mjs` and `rm.mjs`. I read every desktop and mobile frame that was captured, tablet frames 00-04, the hero-t* frames, the reduced-motion hero, the focus and hover shots, and the interaction shots.

## Scores
| Criterion | Score | Weight | Weighted |
|---|---|---|---|
| Design Quality | 7.5 | 0.35 | 2.63 |
| Originality | 7.0 | 0.30 | 2.10 |
| Craft | 7.0 | 0.25 | 1.75 |
| Functionality | 8.5 | 0.10 | 0.85 |

WEIGHTED_TOTAL: 7.33

## Verdict: FAIL (threshold 7.5). It is close.

No hard caps triggered:
- No horizontal scroll at any width.
- 0 own-code console errors. The only errors were the expected 404s on `/services` in the prototype.
- No invented content.
- Everything is visible under `prefers-reduced-motion` (`rm.mjs` found no element with opacity below 0.9).

## What earns the score
- **The hero is the best frame** (`desktop/hero-t3200ms.png`). An orange disc sits behind a black bust, and a thin "Less Noise" sits above a heavy "More Impact." That is a one-sentence art direction: everything turned down except one thing.
- **The load sequence reads** (`hero-t250ms.png`, `hero-t1200ms.png`). It goes from grain, to a jittering headline, to a settled state. It is a real intro and not a fade-up.
- **The fader is live and works.** Keys, drag, Home and End all behave, and the noise and glitch return at 100 (`interact/h-fader-100.png`).
- **Reviews set by length** (`desktop/frame-11.png`, `frame-12.png`). This is the most original section. The orange field, the giant "Better than I expected." and the tilted "He's joking" tag are a real stop moment.
- **The paper-wall gallery** (`desktop/frame-05.png` to `frame-10.png`) shows the dark project images like prints. It is the best imagery handling on the page.
- **The oversized footer wordmark** (`frame-18.png`) is a good sign-off.
- **Craft that holds up:**
  - Easing is custom (`--ease-out` / `--ease-inout`), with no default `ease` or `linear`.
  - The only scroll listener is a passive one in `nav.js`.
  - The mobile menu works. The toggle is 44px, Escape closes it, and focus returns to `.nav-toggle`.
  - Form validation is specific, and focus lands on the first bad field. Send takes about 900 ms, then "Signal received." appears. `aria-busy` is set and the name is echoed as text, not HTML.

## Critical Issues (must fix)
None.

## Major Issues (should fix). These are what hold the page below 7.5.

1. **The concept goes quiet after the hero, and every heading is the same trick.** Seven sections in a row use the "thin ash line + heavy bone line" `.vol` h2:
   - Proof, Services, Work, Reviews, Why, Process, Contact, plus the footer.
   - The result is a formula and not a system: it reads as one repeated template and not as escalating "volume".
   - Why (`frame-13.png`), Process (`frame-14.png`, `frame-15.png`) and Contact are near-identical dark-on-dark text stacks.
   - The mid-page (Proof to Services to Why to Process) is about 6000px of carbon and soot with the same density.
   - → Vary the volume per section: in `styles/why.css` and `styles/process.css`, break the h2 formula. For example, make Process's "One clean signal." the full-viewport-width line, with the steps set as a real waveform or spectrum rather than four small columns. Give Why one giant orange "+" that is scroll-scrubbed, and set its four statements at different weights as it passes.

2. **The fader is decoration.** It only controls the hero.
   - → Publish its value as a CSS variable (`--noise` on `:root`) so the grain, hairline weights and dimming elsewhere respond to it. Then the page is the mixing desk. Alternatively, make it a persistent, tiny "NOISE 08" control in the nav.

3. **The work gallery has dead space, and the crops cut into the imagery.**
   - Desktop: about 200px of void below ATLAS to the left of RIVET (`frame-06.png`). ORBIT floats alone (`frame-10.png`).
   - Mobile: the 4:5 and 1:1 crops slice the baked-in titles: "ET" for RIVET (`mobile/frame-07.png`) and "US" for NEXUS (`mobile/frame-09.png`). This makes the gallery look careless.
   - → In `styles/work.css`, use `object-position` per image so the baked title stays intact, or use 3:2 on mobile. On desktop, let the caption of the taller print sit in the void, or pair ATLAS and RIVET on one baseline.

4. **Filter feedback lands on dimmed prints.**
   - After clicking "Web", the viewport (`interact/w-filter-web.png`) shows only ATLAS and RIVET greyed out. The three Web projects are far below and nothing moves you to them.
   - At 390 the filter row is clipped ("Multimedia" is off-screen) with no scroll cue (`mobile/frame-06.png`).
   - → In `scripts/work.js`, after filtering, smooth-scroll to the first matching print. Alternatively, re-order matches to the top of the grid with a FLIP animation. On mobile, add an edge fade or scroll snap, or wrap the filters to two rows.

5. **The quiet orange-field headline has weak contrast.**
   - "Twelve reviews." on `#ff6b00` uses a thin, dark orange-brown (`desktop/frame-11.png`). It is large text, but at weight 200 it nearly vanishes.
   - → In `styles/voices.css`, use `--ink` at 0.55 to 0.6 opacity, or weight 300. Check that the ratio is at least 3:1.

## Minor Issues
1. **Trailing slashes.** Service feature lists still wrap with a `/` at line end ("GOOGLE & META ADS /" in `desktop/frame-03.png`, and `mobile/frame-03.png`). The generator said this was fixed. → In `styles/services.css`, put the separator as `::before` on the following item with `white-space: nowrap`, or drop it in favour of gap plus a dot.
2. **Hero pillar strip collides with the bust.** "Media Production" (CH 03) sits over the chest plate. There is a dead band between the CTAs and the strip at 1440x900. The strip sits at the fold at 1280x720. → In `styles/hero.css`, cap the bust to the pillar strip's top. Use `min-height: 100svh` and align the strip to the bottom, so the composition holds at 720.
3. **Orphaned "+" on mobile.** In `mobile/frame-15.png` the orange "+" sits alone above the Why list with no relationship to the content. → Draw the cross-hairs on mobile too, or place the "+" inline with "Design + Dev".
4. **The Proof stats are static at rest.** The four numerals are the same size and treatment: four equal columns in a row, which is close to the "count-up stats" pattern with only weight animating (`desktop/frame-01.png`). → Make one number (60+ or +40%) the loud one and set the others small, so the section itself follows the "one thing loud" rule.
5. **The tuning dial is easy to miss.** It sits cramped at the bottom of the Proof section and is cut by the viewport in `frame-01.png`. → Give it its own beat and space.
6. **The mobile hero fader crowds the bust.** In `mobile/frame-00.png` it hugs the top-right beside the head with only about 20px to the edge.
7. **Hero video and other motion assets are unused.** Nothing on the page after the hero moves except weight and colour. There is no scroll-linked moment. → Add one signature scroll interaction.
8. **The nav appears twice on mobile.** "Book a Call" plus the hamburger is fine, but the menu overlay repeats a full-width "Book a Call". That is acceptable, though the orange is used a lot.

## What Improved Since Last Iteration
First evaluation, so there is no previous iteration. Compared with the live baseline (orange full-bleed hero, black band, white grid), this is clearly different: the orange is now a signal, the imagery is presented like a gallery, and the type has a point of view.

## What Regressed
None.

## Top 3 changes that would raise the score most
1. **Make "Volume" run the whole page, not just the hero** (lifts Originality and Design; about +0.5 in total).
   - Wire the fader to a global `--noise` variable.
   - Give each section its own volume behaviour instead of the shared `.vol` h2 template.
   - Add one scroll-scrubbed hero moment. An idea: as you scroll from hero to Proof, the bust's disc collapses to the size of the "+" or the dial needle, so the mascot turns into a UI element.
2. **Re-pace the middle of the page** (Design).
   - Break the 6000px carbon and soot run.
   - Make Why and Process into a single full-bleed set piece each: type at viewport scale, not four small columns.
   - Consider one more "loud" inversion. For example, flip Process to bone or paper with orange rules, or use a horizontal scroll waveform for Discover to Deliver.
3. **Fix the gallery craft** (Craft).
   - Remove the voids.
   - Fix the crops that clip baked titles.
   - Add scroll-to-match on filter, and a scroll cue on the mobile filter.
   - Add a visible loading and hover choreography for all ten prints (only ATLAS's "View project" tab was evident in my hover).

## Where originality could be pushed
- Set the Proof stats as a spectrum or equaliser: heights or weights driven by the numbers, and only one of them loud.
- Let the reviews section respond to hover or scroll, so the loud ones "clip" and the quiet ones "hiss".
- Turn the services list into a real channel mixer: seven vertical faders, one loud at a time, pinned as you scroll.

## Screenshots
- `screenshots/iter-001/desktop/hero-t250ms.png`, `hero-t1200ms.png`, `hero-t3200ms.png`: the intro sequence.
- `desktop/frame-05.png` to `frame-10.png`: the work gallery, with the voids in `frame-06.png` and `frame-10.png`.
- `desktop/frame-11.png` and `frame-12.png`: the reviews section.
- `desktop/frame-13.png` to `frame-15.png`: Why and Process, the repeated template.
- `mobile/frame-00.png`, `frame-06.png`, `frame-07.png`, `frame-09.png`, `frame-15.png`: mobile hero, filter clip, clipped baked titles, the orphaned "+".
- `desktop/reduced-motion-hero.png`: everything visible.
- `interact/m-menu-open.png`, `f-empty.png`, `f-both-missing.png`, `f-success.png`, `h-fader-100.png`, `w-filter-web.png`, `w-hover.png`, `log.txt`: the interaction tests.
