# Generator State — Iteration 004

> **Scoring is stopped (client decision).** This iteration builds what the client asked for, in this order:
> 1. Round 3: the cinematic intro with a landing.
> 2. Round 2, including its two later corrections: effects through the whole page, the slider driving the headline, and content that stays sharp on drag.
> 3. The entertainment and scroll layer.
> 4. The remaining feedback-003 fixes.
>
> Iteration 3 is kept in `snapshots/iter-003/`. Everything it was praised for is kept here:
> - the loader particles
> - the dot flying into the disc
> - the ink crossing
> - the ring field
> - the trace docking in the finale
> - the Process wave and the Why knob
> - the form, menu, filter and faders

## Concept: "Static tuning into signal", one system from the first frame to the last

The page is a receiver.
- Everything starts as noise. Static particles, glyph static and photo static all resolve into signal when the signal reaches them.
- The Noise fader is the receiver's master control.
- The orange dot is the signal itself:
  - It is born in the intro as the full stop of "Less Noise. More Impact."
  - It becomes the hero disc, shrinks back into a dot, and travels the whole page.
  - Everywhere it arrives, that part of the page **tunes in**.
  - It docks as the full stop of the finale, and the brand line rebuilds itself out of it.

A single particle engine (`scripts/particles.js`) drives all of it: the intro, every section's tune-in, the dot's comet and the knob's sparks. It runs on one shared loop (`scripts/ticker.js`). Every section uses the same vocabulary, but the treatment differs from section to section, so it reads as one system rather than one effect copied everywhere.

**Palette, type and easing** are unchanged:
- Colours: carbon, soot, bone, ash, paper, ink, and signal `#ff6b00`.
- Type: Clash Display (display), Inter (body), Geist Mono (instrument labels).

## What to try at http://localhost:4400/
1. **Load it fresh (a new tab):**
   - Static tunes into "Less Noise.", which drops onto its line.
   - A floor line draws in. "More Impact" falls letter by letter and slams onto it: the letters squash, dust kicks up, the floor ripples and the screen jolts.
   - The orange full stop drops last, bounces twice and rings a shockwave: "Signal found".
   - It then flies into the hero and becomes the disc.
   - About 3.6 s. Click, tap or press any key to skip.
2. **Reload the same tab:** you get the ~1 s cut of the intro (it is remembered for the session).
3. **Watch the Noise fader right after the intro.** It slides itself down, and the weight moves across the headline on its own: "Design the Future." goes back to its light default and "Define the Experience." turns bold.
4. **Drag the Noise fader up to 100, or use the arrow keys.**
   - "Design the Future." turns bold and "Define the Experience." goes back to its default weight.
   - Drag it down and the weights swap back. It is live in both directions, with no size change and no layout movement.
   - Only the effects get louder: the grain behind the content, the ring turbulence, the particle dust and the dot's static fizz.
   - Text, images, buttons and the nav stay exactly as sharp and opaque at 0 and at 100.
5. **Scroll slowly.** Each section starts as static and tunes in as the travelling dot reaches it:
   - Proof: the heading assembles, "60+" builds digit by digit out of columns of static, and the readouts roll their digits and lock.
   - Services: each service name locks on from a scanline as the dot feeds its row. The row you are reading lights up as a bone strip.
   - Work: every print de-noises out of static coloured from the photo itself.
   - Voices: the dot races the full width of the orange ground under "Better than I expected." and writes it as it goes. The other reviews rain or scan in.
   - Why: the knob throws sparks at each detent.
   - Process: "One clean signal." resolves out of a noise band, left to right.
   - Contact: the heading rises from the input line.
   - Finale: at the very bottom the dot docks and "Less Noise. More Impact" rebuilds itself outward from it.
6. **Hover a heading.** The word under the cursor breaks back into particles that part around it, then re-forms. Hover a print: it flicks through a channel change.
7. **Desktop mouse extras:**
   - Wheel scrolling is inertial.
   - The cursor is the signal: an orange dot with a trailing ring. It becomes "View" on prints and "Drag" on the faders.
   - The buttons and filter chips are magnetic.
8. **Scroll fast.** The prints and the biggest type lean into the motion and settle. Photos drift inside their frames. The paper, orange and bone grounds open out of the carbon like panels widening to full bleed.

## Iteration 004

### Client round 3: the intro with a landing (`scripts/loader.js`, `scripts/loader-impact.js`, `styles/loader.css`)

| Asked for | Delivered |
|---|---|
| Exact words "Less Noise. More Impact." | "Less Noise." plus "More Impact", with the orange dot as its full stop. The stop on "Less Noise." is pinned heavy, so it never reads as a comma. |
| A real intro that plays first, with a **landing** | Five beats. **1** Static (CSS from first paint, then particles). **2** The particle engine tunes the static into "Less Noise."; the leftover static falls away under gravity; the line drops its last few pixels and lands softly. **3** A floor line draws in; "More Impact" falls from above the screen letter by letter and slams onto it. **4** The full stop drops last. **5** Hand-off into the hero. |
| Squash and settle, a shockwave or ripple, dust on impact | Per letter: stretched while falling, squashed on impact, rebound, settle (WAAPI with custom overshoot curves). Dust grains are kicked up from each letter and bounce on the floor. The floor ripples with a damped travelling wave. The full stop rings a shockwave and throws orange sparks. |
| A camera-shake jolt | The whole stage kicks down and recovers in about 200 ms (first and last impacts, and the dot). The first impact also knocks "Less Noise." up off its line. |
| "More Impact" lands hardest | It gets the largest squash (1.28 × 0.64), the most dust, the full jolt and a floor ripple per letter. "Less Noise." gets a soft landing. |
| The dot drops last, bounces, and hands off into the hero disc | It falls stretched, squashes, bounces twice and rings. Then the words fall away (weight to nothing) and the dot flies on an arc, growing into the disc. |
| About 3.2–3.8 s; skippable; `sessionStorage` short version | About 3.6 s from the intro's start (performance marks `intro:start` … `intro:landed`). A click, key, wheel or tap skips straight to the hand-off. A repeat view in the same session gets a ~1.0 s cut of the same beats (`html.intro-short`). |
| Reduced motion | The first view shows a still "Less Noise. More Impact." card for about 650 ms (`html.intro-static`). Nothing moves, and the hero is already complete underneath. Repeat views skip it entirely. |
| Hero complete within about 1 s after the intro | The hero's entrance overlaps the dot's flight (`markui:intro-go`): the eyebrow decodes; the copy, CTAs, desk strip and fader rise; the headline letters spring up one by one. The CTAs are fully in about 0.3 s after the dot lands. |
| Modular for Next.js | `loader.js` (intro), `loader-impact.js` (dust, floor, ripple, rings) and `loader.css`, on the shared engine (`particles.js`) and loop (`ticker.js`). |

### Client round 2, with its later corrections

**1. The loader effect and hero animation run through the whole page.**
- **One engine:** `scripts/particles.js`.
  - Samples live text by word, encoding each word and its colour in the sample.
  - Owns the particle store.
  - Pools canvases: they are created only while a scene's host is on screen and released at 0×0 afterwards.
  - Runs one loop via `ticker.js` and scales particle budgets down for phones, low-DPR and touch screens.
  - Is off under reduced motion, when nothing is hidden and nothing mounts.
- **Treatments:**
  - `particle-fx.js` (`TuneText`): nine homes and orders give the variation.
  - `denoise.js`: prints.
  - `decode.js`: glyph and digit decode for small type, with a hidden copy kept for assistive tech.
  - `particle-sparks.js`: the knob.
- **Wiring:** `tune-in.js` decides which part of the page tunes in how (see "What to try" §5).
- **Triggered by the signal:** as the dot passes a section channel, a service row or a print, `signal.js` dispatches `signal:feed` with the contact point, and the tune-in starts from there. If the signal never arrives (for example after a mid-page reload), each scene tunes in by itself once it is well on screen, or after a short wait.
- **The real DOM text is always there.** During a tune-in only its words are transparent, and they return the moment the particles land.
- **Hero-level life everywhere:**
  - Entrance: every section tunes in.
  - Idle: dust hangs around the tuned type (at rest it settles; with noise up it crawls), the dot's comet sheds static, and the knob throws sparks.
  - Pointer and touch: the word under the pointer detunes into particles that part around it, prints channel-flick on hover, and the cursor and magnets react.

**2 and 3. The fader and the headline (as re-specified by the client's latest message).**
- **Clean side (rest):** "Design the Future." at its default light weight, and "Define the Experience." bold.
- **Noise side:** "Design the Future." bold, and "Define the Experience." back to its default weight. Everything in between is a live crossfade, both ways.
- **Inputs:** drag, the arrow keys, Page Up and Down, Home and End on the hero fader or the nav's docked fader.
- **Weight only.** There is no size change and nothing below the headline moves. The earlier "bold and big" growth was removed because the client found the slider "giving too much".
- **Automatic:** after the intro the fader slides itself down from the intro's noise (78) to rest (05). The page arrives with "Design the Future." bold, and the weight moves across to "Define the Experience." on its own. Grabbing the fader cancels the slide.
- **Sharp content at every position (client correction):**
  - `--noise` no longer touches any content.
  - Removed: the hairline coupling, `--floor` (turned-down type weights), the Services ramp coupling, the Why "lift", and the heading jitter.
  - The grain moved from a fixed overlay above the page (z-index 70), which is what washed the page out, to a texture painted into each ground **behind** its content.
  - The noise effect was then turned back down to the earlier, subtler film grain, as the client asked.
  - The fader now only drives effect layers: the grain behind content, the ring turbulence, particle dust and jitter, and the dot's static fizz.

### Entertainment and scroll layer (client round 3 B)
- **Inertial scrolling** (`scripts/smooth.js`): Lenis-style easing of wheel input onto native scroll. The scrollbar, keyboard, anchors, find-in-page and sticky elements all keep working, and any scroll it did not make takes over. It is desktop mouse only, off on touch and under reduced motion. It also provides the page's eased scroll velocity.
- **Scroll-reactive effects** (`scripts/scroll-fx.js`):
  - Lean: prints and the loudest display type skew into fast scrolling and settle.
  - Parallax: photos drift inside their frames.
  - Ground transitions: the paper, orange and bone sections open from an inset rounded panel to full bleed (clip-path, scrubbed by scroll).
  - No layout reads in the scroll path.
- **Cursor** (`scripts/cursor.js`, `styles/cursor.css`):
  - An orange signal dot with a trailing ring.
  - Its states: hover, a "View" disc on prints, "Drag" on the faders, and stepping aside on text fields.
  - Magnetic CTAs, buttons and filter chips.
  - Desktop mouse only. The native cursor is hidden only once this one is running.
- **Split text:** the hero headline springs up letter by letter, and the stats roll digit by digit.
- **Pinned and scrubbed set-pieces:** the hero pin (disc to dot), the Why knob, the Process wave, the Services strip that follows the reader, and the Voices sweep.

### Feedback-003 items

| Feedback | What I did |
|---|---|
| **Major 1**: the travelling element is under-scaled | The dot is now 15 px (from 10 px) with a 24 px halo. The trace is heavier (2.75 px lit, 2.25 px ghost) and the ghost is more visible. There is a **particle comet**: the dot sheds static as it travels and stretches along its direction with speed. Three **set-pieces**: **Services** (it feeds each row: the row locks on and lights), **Work** (an L-branch drops onto each print, which de-noises from that point) and **Voices** (a full-width sweep that writes "Better than I expected." as it passes, then a return crossing). Every section's heading tunes in from the point the dot touches its channel. |
| **Major 2**: loader length | Superseded by the client's round-3 ask for a 3.2–3.8 s intro. It is about 3.6 s, with a ~1 s repeat cut per session. The hero overlaps its exit, and `main.js` now sets up after the intro's first paint. |
| **Major 3**: thin full stops read as commas | Pinned to at least weight 600 in the hero (`.hero-char.is-stop`, which also carries the orange), the finale (`.finale-q-stop`) and the intro (`.loader-stop`). |
| **Major 4**: the mobile loader is a cloud | On phones 78% of the static starts close to the type, with fewer and larger grains (2.3 px), so "Less Noise." reads almost at once. |
| **Major 5**: the long dark middle | Services gains the page's travelling light moment: the active channel lights as a bone strip with ink type, wiping in from the signal's side. The paper, orange and bone grounds now open out of the carbon (clip-path) instead of hard cuts. |
| Mono-label density in the hero | The "Scroll / Follow the signal" cue is removed. |
| Hero cursor response too subtle | The per-letter swell radius is wider (170 px) and works on both lines. |
| **Minor 1**: duplicate phone in the success copy | The studio's own number is never echoed back as the visitor's. Email is preferred, and a visitor phone is only echoed if it isn't the studio's. |
| **Minor 2**: the nav mini fader is stale | Every desk change (either fader or the auto-slide) syncs both faders, and it re-syncs when the mini docks. |
| **Minor 3**: Voices heading tight under the nav | Extra top padding plus `scroll-margin-top`. |
| **Minor 5**: fader affordance | The auto-slide demonstrates it. The cap glows orange while it moves itself, and the cursor reads "Drag" on it. |
| **Minor 4**: focus after skip | Left as is. Focus returns to the top of the document, so Tab reaches "Skip to content" first; moving it into `<main>` would skip the navigation. |
| **Minor 6**: Work list count | Fixed. The closing wall text's `<li>` is `role="none"`, so the list announces 10 projects, and the wall text and "See all work" link stay reachable (verified with an ARIA snapshot). |

### Performance
- **A real bug fixed in `ticker.js`.**
  - The loop iterated its live `Set`. A job that removed itself and was woken again in the same pass was re-visited in that pass, so the engine and comet loops ran thousands of times per frame.
  - The end of a pass could also schedule a second rAF.
  - Now each pass runs a snapshot, and only one frame is ever pending.
  - Measured with wheel-scrolling through the middle of the page in headless Edge: p50 went from 367 ms to about 21 ms per frame.
- **No composited layers under content.** The grain is painted into each ground, and the comet canvas is not promoted. Composited layers under z-index-2 content had forced every block above them into its own layer.
- **Idle scenes stop redrawing.** When the page is clean and nobody is touching them, tuned scenes draw their dust once and stop. At rest, a tuned page costs nothing per frame beyond the hero field while it is on screen.
- **Canvases are pooled and released (0×0) off screen.** Budgets scale down on phones, low-DPR and touch screens.

## Known issues
- **Headless timing.** Headless Edge renders canvases in software, so frame times and screenshot timings there are slower and noisier than on a real laptop with a GPU. The intro's performance marks are the reliable clock.
- **A horizontal pinned Work gallery was considered and not built.** It would have fought the curated gallery hang, the tuner's re-hang and the print feeds. The scroll set-pieces above cover the "pinned, scrubbed" ask.
- **While a ground is opening** (during the brief clip-path window), that section is its own stacking context, so a branch of the trace could briefly draw over its top edge. The trace itself stays in the page margin.

## Files (004)
- **New:**
  - Scripts: `particles.js`, `particle-fx.js`, `particle-sparks.js`, `denoise.js`, `decode.js`, `tune-in.js`, `loader-impact.js`, `signal-comet.js`, `smooth.js`, `scroll-fx.js`, `cursor.js`.
  - Styles: `fx.css`, `cursor.css`.
- **Rewritten:**
  - `loader.js` and `loader.css` (the intro).
  - `hero-type.js` (the weight swap), `hero.js` (the overlapping entrance and auto-slide) and `desk.js` (noise goes to effect layers only; the per-ground grain).
- **Modified:**
  - `signal.js` and `signal-route.js`: row, print and LED feeds, the Voices sweep, the dock event and the comet.
  - `ticker.js` (the bug fix) and `main.js`.
  - `hero.css`, `hero-fader.css`, `desk.css`, `tokens.css`, `base.css`, `signal.css`, `services.css`, `work.css`, `proof.css`, `proof-dial.css`, `why.css`, `voices.css`, `footer.css`.
  - `dial.js`, `why.js`, `work.js` (events), `contact.js` (success copy) and `index.html`.
- **Size:** every file is 500 lines or fewer.

## Earlier iterations (kept)
- **003:** the loader, the hero disc, the ring field, the ink crossing, the channel desk, the travelling signal with its LED feeds, the Process wave ride and the finale dock.
- **002:** the global noise desk, the re-hung gallery with the tuner, the Services crescendo, the pinned Why knob, bone Process and the contact scope.

## Interaction checks (headless Edge, after the capture)
- **Intro skip:**
  - A click during the intro removes it about 0.6 s later.
  - A tap on a phone also skips it.
- **Faders:**
  - Arrow Up ×2 gives 15. At that point line 1 is weight 248 and line 2 is 612.
  - End gives line 1 at 640 and line 2 at 220.
  - The nav's mini fader follows, reading 100.
- **Scrolling (smooth scroll on):**
  - "Back to top" lands at 0.
  - The wheel scrolls as expected.
  - PageDown works.
  - Smooth scroll is off on touch.
- **Filter:** "Branding" re-hangs the wall and announces it.
- **Form:**
  - An empty submit gives "3 things to fix".
  - A submit with the studio's own number gives the success copy without echoing it back.
- **Mobile menu:** it opens, Escape closes it, and focus returns to the toggle.
- **Accessibility tree with effects running:**
  - The stats, dial names, reviews and headings each read once.
  - Hidden copies are kept for decoded text.

## Dev Server
- URL: http://localhost:4400/
- Status: static server, already running (serves `gan-harness/prototype/`).
- Sanity capture: `gan-harness/screenshots/gen-check-004/`.
