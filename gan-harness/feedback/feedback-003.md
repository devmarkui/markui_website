# Evaluation: Iteration 003 (design mode)

## Evaluation Mode

**Achieved:** `scripted-playwright (Edge headless) + screenshots`. The Playwright MCP tools were unavailable.
Captures came from `tools/shoot.mjs` at 1440, 768 and 390. Interactions came from a copy of `interact-example.mjs` at `screenshots/iter-003/interact.mjs`. Logs and shots are in `screenshots/iter-003/interact/`.

## Scores (design weights)

| Criterion | Score | Weight | Weighted |
|---|---|---|---|
| Design Quality | 7.5 | 0.35 | 2.625 |
| Originality | 8.0 | 0.30 | 2.400 |
| Craft | 7.5 | 0.25 | 1.875 |
| Functionality | 8.5 | 0.10 | 0.850 |
| **TOTAL** | | | **7.75** |

WEIGHTED_TOTAL: 7.75

## Verdict: PASS (threshold 7.5)

The margin is thin (+0.25). This is a SOTD nominee, not a SOTD winner. Hard caps checked, none triggered:
- No robot or cyborg figure.
- The h1 is the new headline.
- A loader and a travelling element are both present.
- No horizontal scroll at 390, 768 or 1440.
- 0 console errors, 0 failed requests, 0 page errors across every run.
- Everything is visible under reduced motion.
- No invented content.

## Client direction verdicts

| Requirement | Verdict | Evidence |
|---|---|---|
| **Loader** ("Less Noise. More Impact.") | **Met** | `desktop/hero-t250ms.png` shows about 6000 grey particles converging on the two-line type. The counter reads 094 and the orange particles gather at the full stop. `hero-t900ms.png` and `t1600ms.png` settle on the real type with "SIGNAL FOUND". `t2400ms.png` and `t3200ms.png` show the weights collapsing while the orange dot stays. `t4500ms.png` shows the dot became the hero disc. <br>Skip: a click removes the overlay at 1.31 s and a key at 1.33 s, with the action fired at about 0.75 s. <br>After skipping, Tab lands on "Skip to content" and scroll works. <br>Under reduced motion, `[data-loader]` is `display:none`. <br>Timing: the natural run is removed at 3.86 s wall-clock in headless Edge, which includes 1.3–1.5 s of page load. The generator's 2.5–2.8 s claim is plausible on a fast machine, but it is at the edge of "about 3 s". <br>Hand-off is real, since the dot is the disc. The flight frames fall between my capture times. <br>On mobile at 250–900 ms it is an amorphous particle cloud (`mobile/hero-t250ms.png`), so it takes longer to read as type than on desktop. |
| **h1** | **Met** | `<title>` and the single h1 are "Design the Future. Define the Experience." The h1 is aria-labelled once and there is 1 h1 in total. The quiet line is weight 200 and the loud line 600, at about 7.2vw. `desktop/frame-00.png` shows it as the page's strongest typographic moment. |
| **Robot removed** | **Met** | No figure anywhere. Verified in all 22 desktop, 22 mobile and 18 tablet frames. All hero imagery is code: the disc, the canvas ring field and the SVG route. |
| **Hero animation** | **Met, and the strongest part** | Entrance choreography: the dot becomes the disc, a shockwave, an eyebrow that decodes (`mobile/hero-t2400ms.png` shows the "TE+%//▚<|" glyph scramble), and a per-letter weight settle. <br>Idle: the ring field flows, the meters flicker, and a weight wave sweeps. <br>Cursor: the rings bend around the pointer (`interact/hero-cursor-headline.png`) and the letter weight swells under it. <br>Fader: it drives turbulence and grain. At 100 the whole hero grits up with heavy contour warping (`interact/hero-fader-max.png`). <br>The ink crossing, where the headline turns ink exactly on the disc's edge, is a genuinely crafted detail. <br>Weakness: on desktop the cursor response on the letters is subtle. It is easy to miss unless you look for it. |
| **Travelling element** | **Partly met, leaning met** | The dot leaves the hero and collapses to a 10 px dot on the route under the desk (`desktop/frame-01.png`). <br>It runs down the left gutter on desktop and lights a branch and LED at each section (`frame-02` to `frame-10`). <br>It turns ink on paper and on the orange reviews (`frame-08`, `frame-12`). <br>It feeds the Why knob's rim (`frame-14`, `frame-15`). <br>It enters and draws the Process wave, then exits the clean sine on the right (`frame-17`, `mobile/frame-17`). <br>It docks as the full stop of "More Impact●" with "SIGNAL RECEIVED" (`frame-21`, `tablet/frame-17`, `mobile/frame-21`). <br>It never covers text: the route stays in the margins and runs under content. <br>Works at 1440, 768 and 390. In reduced motion the route is drawn lit and the finale is docked (`reduced-motion-end.png`). <br>Why only "partly": mid-page the "advanced scroll effect" reads as a 1 px line plus a 10 px dot pinned at the same viewport y (about 503) in a 24 px gutter. That is a scroll-progress indicator. It is well made, but it is not visually dramatic. The dramatic moments are the Process wave and the dock. The long stretches through Services and Work are nearly invisible. |

## Critical Issues (must fix)
None. Nothing is broken and no hard cap applies.

## Major Issues (should fix)
1. **The travelling element is under-scaled for a headline client request.** From frame-02 to frame-11 it is a hairline in the gutter, and the ghost dotted trace ahead of it is barely visible on soot. → In `styles/signal.css`, raise the lit stroke to about 2 px and the dot to 14–16 px on desktop. Give the dot a short comet tail. Give the ghost trace more contrast on carbon (`--ash` at about 0.5). Add one big event mid-page, for example where the dot passes the Work heading, its tuner "cuts" through the print grid, or it does a horizontal sweep across the Services rows, so the journey has at least 3 moments before Process.
2. **Loader total is at the upper limit.** It is 3.86 s from navigation in headless, with the loader's clock starting after `DOMContentLoaded`. → In `scripts/loader.js`, start the clock at `requestAnimationFrame` after first paint, not after `DOMContentLoaded`. Cut the hold from about 420 ms to about 250 ms. Reduce the drop and flight. Target 2.6 s or less in headless.
3. **Thin-weight full stops read as commas.** "Design the Future," and "Less Noise," at weight 200 show a slanted comma-like tick in `frame-00` and `frame-20`. That is a typographic misread of the client's headline. → In `styles/hero.css` and `styles/footer.css`, wrap the trailing "." in a span pinned to weight 500–600, or set a minimum weight for punctuation. This also lets you make it orange as a signal.
4. **The mobile loader is a cloud, not type, for too long.** At 250–900 ms it is an abstract blob (`mobile/hero-t250ms.png`, `t900ms.png`), so the brand line only reads late. → In `scripts/loader.js`, on narrow screens use fewer, larger particles and a shorter convergence, and bias particles toward the type from frame 0.
5. **Design rhythm still has a long dark middle.** Services, Why and Contact are three nearly identical carbon-on-carbon stretches between paper Work and orange Voices. → Break the Services stretch with one light or oversized moment, or invert Contact to the orange ground. Keep the palette use loud but sparing.

## Minor Issues (nice to fix)
1. **Duplicate phone in the success state.** The message reads "Thanks, Test. We'll get back to you at +94 76 088 7702 soon. Can't wait? Call the studio on +94 76 088 7702." When the visitor's number equals the studio's number it is confusing. It is also a stray "Test" first name. → In `scripts/contact.js`, use the studio's number only in the "Can't wait" line, and don't echo the visitor's own number unless it is theirs.
2. **Nav mini fader stays "08" when the hero fader is 100.** After scrolling away, the docked fader shows a stale value in some states. Sync on scroll in `scripts/desk.js`.
3. **Voices heading sits tight under the nav** (`desktop/frame-12.png`, "Twelve reviews. All five stars." starts at y=120 under the 72 px bar). Add `scroll-margin-top` or top padding in `styles/voices.css`.
4. **Focus lands on "Skip to content" after the loader is skipped.** It is correct, but the loader could return focus to `<main>` for a smoother tab order.
5. **The hero fader's cursor and hover affordance is hard to discover.** There is no hint that it is draggable. Add a "drag" micro-label or a one-time nudge animation in `styles/hero-fader.css`.
6. **Work list count.** The closing wall text is the 11th `<li>` (known issue from the generator).

## What Improved Since Iteration 1
- There is now a **concept that organises the whole page**: the signal, the dot and the noise fader. Iteration 1 had the "volume" idea only in the hero and a few headings.
- The **hero is far stronger**: disc, ring field, ink crossing, headline weight contrast, and channel desk. It has a real art direction, in one sentence: "a mixing desk where one thing is loud".
- **The loader is a genuine creative moment**, and the page opens and closes on the same dot.
- **The footer finale** is a proper close.
- **Process** is now bone with a scroll-drawn noise-to-sine wave, joined to the trace on desktop and mobile (vertical wave on mobile). It is the best integration on the page.
- **Why** is now a pinned knob with a feed line and a lit arc.
- **Gallery:** balanced crops and the tuner re-hang, with no dead space (the iteration 1 complaint).
- **Robustness:** 0 errors, no overflow, mobile menu correct (Escape closes it and returns focus to the toggle, 44×44 target), form validation good (empty, bad email, neither email nor phone all give helpful specific errors, the submit is disabled while sending, and the success state takes focus).
- **Scroll performance is good:** with 100 scrollBy steps, p50 6.9 ms and p95 8.1 ms per frame, max 13.9 ms.

## What Regressed Since Iteration 1
- Nothing functional. The visual weight moved: the page is now more instrument-like and denser. The hero has many small mono labels (NOISE, CH 01, SCROLL / FOLLOW THE SIGNAL, 08) competing with the headline on desktop, so the hero is busier than the "Less Noise" promise suggests.

## Specific Suggestions for Next Iteration

### The 3 changes that would raise the score most
1. **Make the travelling element a set-piece, not a hairline** (Major 1). Scale the dot and trace, add a comet tail and 2–3 large mid-page interactions (Work, Services, Voices) so it is obviously "the hero element travelling". This raises Originality and Design.
2. **Fix the type-level misreads and rhythm** (Major 3 and 5). Give the full stops real weight in the hero and finale, and vary the middle of the page (one light or oversized moment in the carbon run). This raises Design and Craft.
3. **Tighten the loader** (Major 2 and 4). Make it 2.6 s or less in headless and readable on mobile from the first frames. This raises Craft and Originality, and answers the "about 3 s" rule.

### Other
4. Reduce the mono-label density in the hero at 1440. Drop the "SCROLL / FOLLOW THE SIGNAL" cue or the `08` readout so the headline and disc own the frame.
5. Make the letter-weight cursor response stronger on desktop, for example a wider influence radius in `scripts/hero-type.js`.
6. Fix the success-state copy (Minor 1) and the nav mini fader sync (Minor 2).

## Screenshots (all under `gan-harness/screenshots/iter-003/`)
- `desktop/hero-t250ms.png` to `hero-t6500ms.png`: the loader run and the hand-off. Best frame: `hero-t250ms.png` (particle type) and `hero-t4500ms.png` (settled hero).
- `desktop/frame-00.png` to `frame-21.png`: the full trace. Key frames: `frame-01` (dot leaves the hero and rides the desk), `frame-08` (ink trace on paper), `frame-12` (on orange), `frame-14` and `frame-15` (Why knob feed), `frame-17` (Process wave), `frame-21` (dock).
- `mobile/frame-17.png`: the vertical Process wave. `mobile/frame-21.png`: the finale docked at 390.
- `tablet/frame-00.png` and `tablet/frame-17.png`: 768 hero and finale.
- `desktop/reduced-motion-hero.png` and `reduced-motion-end.png`: static route lit and finale docked.
- `interact/hero-cursor-headline.png`, `hero-fader-max.png`, `form-neither.png`, `form-success.png`, `menu-open.png`, `filter-branding.png` and `scroll-d-*` / `scroll-m-*`: interaction checks.
- `interact/log.txt`: interaction and timing measurements.
