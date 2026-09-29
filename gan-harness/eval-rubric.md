# Evaluation Rubric: Design Mode

The question behind every score: **"Would this win an Awwwards Site of the Day?"**
Ask that, not "do all the features work?"

Pass threshold: **7.5 weighted**.

```
weighted = design * 0.35 + originality * 0.30 + craft * 0.25 + functionality * 0.10
```

## Calibration (applies to every criterion)

| Score | Meaning |
|---|---|
| 1–3 | Broken or embarrassing |
| 4–5 | Works but is clearly AI or template output (tutorial quality) |
| 6 | Decent but unremarkable. You would scroll past it on Awwwards. |
| 7 | Good. A solid studio site; might get an Honorable Mention. |
| 8 | Very good. Professional, distinctive, a few rough edges. SOTD nominee. |
| 9 | Excellent. Would plausibly win SOTD. |
| 10 | Exceptional. Site of the Month / FWA quality. |

**Be strict.** A 7 must be earned, and an 8+ needs a concrete reason you can point to in a screenshot.
Your natural tendency is to be generous, so fight it. Don't award points for effort, for potential,
or for "good for an AI".

---

## Design Quality (weight 0.35)

Does the page read as one coherent visual system with a clear hierarchy and a point of view?

Check:
- **Composition and hierarchy.** Does the eye know where to go in every frame? Is white or dark space used with intent?
- **Typography.** Is Clash Display used with conviction (scale contrast, tracking, line-height, set widths)? Is there a real type scale, or random sizes? Is the body text comfortable to read (measure 55–80ch, leading)?
- **Colour.** Is `#ff6b00` used as a *signal*, loudly and sparingly, or smeared everywhere? Does the palette have depth: tints, darks, a considered neutral?
- **Imagery.** Are the project images presented like a gallery would present them? Are the crops, framing and scale considered?
- **Rhythm.** Do the sections vary in density and pacing, or is it the same block repeated eight times?
- **Mobile at 390.** Is it composed *for* mobile rather than stacked leftovers? Is the hero still striking?
- **Brand fit.** Does it feel like the same studio that made the dark, orange-lit project imagery?

Anchors:
- **4:** default spacing, a generic hero, sections that look interchangeable
- **6:** clean and consistent but safe; resembles a good template
- **8:** a confident art direction you could describe in one sentence, held across every section and breakpoint
- **9–10:** every frame is a screenshot you'd post

## Originality (weight 0.30)

Is there a *concept*, and does it make this page unlike other agency sites?

Check:
- Can you state the page's one big idea? Does it organise the whole page, or only the hero?
- Are there **creative leaps**: an unusual layout, a custom interaction, a signature motion, an unexpected treatment of stats, services or testimonials?
- Is the interaction **meaningful**, expressing the brand line "Less Noise. More Impact.", rather than decoration?

Penalise hard for AI slop:
- Purple or blue gradients and mesh blobs
- Rounded-card grids of identical tiles
- A centred headline, subtext and two buttons with nothing else
- Emoji icons
- Default marquees
- Glassmorphism for its own sake
- Count-up stats with nothing around them
- The same fade-up on every section
- Generic dot or line-grid backgrounds

Anchors:
- **4:** looks like every agency template
- **6:** one nice idea in the hero, generic afterwards
- **8:** a distinct concept carried through at least 70% of the page, with at least 2 moments that make you stop
- **9–10:** you would send the link to a designer friend

## Craft (weight 0.25)

This covers execution detail and polish.

Check:
- **Alignment and grid.** Are edges aligned and spacing consistent, with nothing orphaned?
- **Type details.** Are there widows or orphans in headings? Is there awkward rag, overflowing or clipped text? Are there line breaks that break words?
- **Motion quality.** Is the easing considered (no linear or default `ease`)? Does it stay smooth when you scroll, is nothing janky, and does anything layout-shift? Is there a sensible intro timing?
- **States.** Are there hover, focus and active states on everything interactive? Is the focus ring visible and on-brand?
- **Responsive at 1440, 768 and 390.** Is there any overflow, cramped text or broken layouts? Are touch targets at least 44px?
- **Reduced motion.** Is all content visible and does the page still look intentional?
- **Performance signals.** Are the images lazy-loaded and do they have dimensions? Is the page free of heavy work on scroll?
- **Accessibility basics.** One `h1`, landmark elements, alt text, AA contrast (check orange text on light backgrounds: `#ff6b00` on white fails AA for body text).

Anchors:
- **4:** visible misalignments, overflow on mobile, no focus states
- **6:** tidy on desktop, rough on mobile or at tablet width
- **8:** polished at all three widths, with only 1–2 nitpicks
- **9–10:** you cannot find a flaw without a ruler

## Functionality (weight 0.10)

This is lower weight in design mode, but broken things still cap the score.

Check:
- There are zero console errors or failed requests. Links to real site paths such as `/projects` are expected to 404 in the prototype and don't count.
- The navigation works, the mobile menu opens and closes (Escape too) and traps or returns focus sensibly.
- The contact form validates (empty, bad email, email or phone missing), shows helpful errors, then simulates a send and shows a success state. Double-submit is prevented.
- Any filters, carousels or toggles work with both mouse and keyboard.
- No `href="#"` dead links.

Anchors:
- **4:** something visible is broken
- **6:** it works, with rough edges in validation or keyboard support
- **8:** everything works, including keyboard and edge cases
- **10:** flawless

## Client direction (added after iteration 1). Score these explicitly.
- **Loader:** is it creative, and does it settle on "Less Noise. More Impact."? Is it skippable, and does it hand off into the hero rather than just fading? Is it short (about 3 s or less)?
- **Hero:** the h1 is "Design the Future. Define the Experience." There is no robot figure. Does it have rich, creative animation (entrance, idle, cursor or touch) that matches the rest of the page?
- **Travelling element:** does something from the hero travel with an advanced scroll effect to the bottom of the page and arrive meaningfully? Is it smooth, never covering text, and working at 1440, 768 and 390?

## Client direction, round 2 (applies from iteration 4). Score these explicitly.
- **Effects throughout:** do the loader's "static tuning into signal" effect and hero-level animation carry through every section, varied per section but one system? Or do they stop after the hero?
- **Fader drives the headline:** does the fader automatically slide down after the loader and turn "Design the Future." bold (700) and clearly bigger? Does dragging it, or using the arrow keys, drive the same change live in both directions, with no layout jump?
- **Sharp content on drag:** screenshot the fader at minimum AND at maximum noise. Content (text, images, buttons, the nav, the disc) must be equally sharp and fully opaque at both ends, with no page-wide fade, blur or wash-out. Only the effect layers (grain, rings, particles, trace shimmer) and the "Design the Future." weight and size may change. At minimum noise the page is crisp and high-contrast. Any content opacity or blur tied to the fader counts as a Craft issue.

## Hard caps
- A robot or cyborg figure anywhere on the page, or a hero h1 that isn't the new headline, caps **Design at 5**.
- A missing loader or a missing travelling element caps **Originality at 6**.
- From iteration 4 on: if the fader doesn't drive "Design the Future." to bold and bigger, or the loader/particle effect stops after the hero, **Originality is capped at 6.5**.
- Horizontal scroll at 390 or 768 caps **Craft at 5**.
- Any console error from the prototype's own code caps **Functionality at 5**.
- Content invented beyond the spec (fake clients, fake stats, lorem ipsum) caps **Design at 5**.
- Any section invisible under `prefers-reduced-motion` caps **Craft at 5**.
