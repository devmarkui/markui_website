# Design Brief: Mark UI Homepage Redesign

> Mode: `/gan-design`. There is no planner, so this brief is the spec.
> Max iterations: 5 · Pass threshold: 7.5 weighted (see `eval-rubric.md`)

## 1. The client

**Mark UI** (markui.lk) is a creative technology studio in Colombo, Sri Lanka, founded in 2023.
One team covers design, web and software, digital marketing, photography and video,
multimedia production, and events. Its clients are ambitious SMEs and start-ups in Sri Lanka and beyond.

**Hero headline:** "Design the Future. Define the Experience." This is the client's direction, received after iteration 1.
**Brand line:** "Less Noise. More Impact." The loader settles on it and the page closes on it.

## 2. The goal

Design a homepage that could win an **Awwwards Site of the Day**, and that makes a Sri Lankan
business owner think *"these people are world-class, I want them."* The homepage is the
studio's own best case study.

It must still sell:
- Within **5 seconds** a first-time visitor understands what Mark UI does (IT, marketing, media).
- **"Book a Call"** is never more than one glance away.
- The work, meaning the project imagery, is the hero of the proof, not decoration.

The current live site is captured in `gan-harness/screenshots/baseline-live/`:
an orange full-bleed hero, a black services band, and a white project grid. It is competent but
generic. The redesign has to be **clearly better and clearly different**, not a restyle.

## 3. Hard constraints

### Brand
- **Orange `#ff6b00`** is the signature accent (hover `#e55c00`). The rest of the palette is yours; justify it.
- **Logo:** `assets/brand/markui-logo-white.png` (white, 1600×319, transparent). It needs a dark ground, or use a CSS filter to invert it on light grounds. The icon mark is at `assets/brand/icon.png`.
- **Display face:** Clash Display, a variable font at `assets/fonts/ClashDisplay-Variable.ttf`. Load it with `@font-face`, weights 200–700. Body type: Inter from Google Fonts, or propose a better pairing. Clash Display stays the display face.
- The existing brand imagery is dark and cinematic with orange light (see `assets/projects/*`). Lean into it or contrast with it, but *deliberately*. The hero robot images are banned (see §5).

### Content
- Use **real content only** (section 5). No lorem ipsum, invented clients, invented stats, or invented awards. You may tighten copy lightly.
- **No external or stock images** (no Unsplash, no placeholder services). Use the provided assets. Make anything else in CSS, SVG, canvas, or WebGL.

### Tech
- Build a **static prototype** in `gan-harness/prototype/`: `index.html`, CSS, and vanilla JS (ES modules). No build step, no npm, no frameworks.
- **three.js** is available locally: `import * as THREE from "./assets/vendor/three.module.min.js"`. Use it only if it earns its place.
- Google Fonts is fine. No other CDNs.
- It is served at **http://localhost:4400/** by a static server. Relative paths only.
- **Portability:** this gets ported to Next.js 16 and React 19 afterwards, so structure it like components:
  - One `<section>` per content block, each with a unique class prefix (`.hero-*`, `.work-*`, …).
  - CSS split per section under `styles/`, with shared tokens in `styles/tokens.css`. JS split per behaviour under `scripts/`.
  - **No file over ~500 lines.**

### Quality floor
- **Performance:** smooth scrolling on a mid-range laptop. No layout shift on load. Every `<img>` has `width`/`height`, and below-the-fold images use `loading="lazy"`. The hero video `assets/hero/markuibgvideo2.mp4` (6.8 MB) is optional; if used, it must be `muted playsinline`, have a poster, and not block first paint.
- **Accessibility:** semantic landmarks, exactly one `<h1>`, a visible focus style on every control, and `prefers-reduced-motion` fully respected (all content visible, nothing essential carried by motion). WCAG AA text contrast, labelled form fields.
- **Responsive:** it must look *designed*, not merely reflowed, at **1440, 768 and 390** wide. There must be no horizontal scroll at any width.
- **Zero console errors.** No `href="#"` dead links. Internal links go to the real site paths listed below, even though they 404 in the prototype.

## 4. Creative direction (a push, not a prescription)

**Your primary goal is visual excellence.** A stunning, half-finished page beats a complete, forgettable one.
Push for creative leaps: unusual layouts, custom animation, distinctive colour work, typography with a point of view.

The brand line *"Less Noise. More Impact."* is rich source material for a concept: noise and signal,
restraint, focus, and one thing done loudly. Find **one strong idea** and let it organise the whole page.
Other directions are welcome if they are stronger. Write the concept down before you build (see `generator-state.md`).

Avoid anything that reads as template or AI-made:
- Purple or blue gradients and generic mesh blobs
- Rounded-card grids of identical tiles
- The "Welcome to…" or centred headline + subtext + two buttons hero with nothing else going on
- Emoji icons and generic decorative SVG squiggles
- Glassmorphism for its own sake
- Stat counters that tick up with no design around them
- Marquee logo strips done the default way
- Every section animating in with the same fade-up

## 5. Content

### Navigation
- The logo links to `/`.
- Links: Home `/`, Projects `/projects`, Products `/products`, Services `/services`, About `/about`, Contact `/contact`.
- Primary CTA: **Book a Call** → `/proposal`.
- There must be a mobile menu, operable by keyboard with Escape to close.

### Loader (client direction, added after iteration 1)
- A creative loading effect runs before the hero. It **settles on the brand line "Less Noise. More Impact."** and then hands off into the hero.
- It lasts about 2–3 seconds, can be skipped with a click or keypress, never traps the user, and is replaced by an instant or static state under `prefers-reduced-motion`.
- The hero content must be in the DOM from the start (SEO and no-JS). The loader is an overlay.

### Hero
- **Headline** (`h1`): "Design the Future." / "Define the Experience."
- **No robot or cyborg figure** anywhere on the page. The client dislikes it. Do not use `markuihero_trans1.png`, `markuihero_trans2.png`, `markuihero1.png` or `markuihero2.png`, or any derivative of them.
- **The hero needs much more animation, and it must be very creative:** entrance choreography, idle life, and a response to the cursor or touch. It must match the design language of the rest of the page.
- **Travelling element:** something born in the hero must travel with an advanced scroll effect all the way to the bottom of the page, connecting the sections, and arrive somewhere meaningful at the end (for example, docking into a footer finale that restates "Less Noise. More Impact."). It must stay under content (never covering text), work at all three widths, and be static but still present under reduced motion.

### Client direction, round 3 (received during iteration 4). The scoring loop is stopped from here.
The client's words, verbatim: *"Now I need a preview loader that will load initially to the website that with these exact wordings 'Less Noice. More Impact' Like an Intro should be comes with a landing effect. Need that in advance animantion. Now don't score change as I say. Need more entertantment on the Home page. Give me top notch website animation and scrolling effect"*

- **Intro loader.** It uses the exact words "Less Noise. More Impact." ("Noice" is read as a typo.) It's a cinematic first-load intro with a physical **landing** effect: the words land with weight, with squash-and-settle, a shockwave, kicked-up particles and a subtle jolt, and "More Impact" lands hardest. The dot drops in last and hands off into the hero disc.
  - About 3.2–3.8 s on the first visit, skippable. A short version for repeat views in the same session. Static or skipped under reduced motion.
- **Entertainment.** Top-notch animation and scrolling across the home page:
  - inertial smooth scroll over native scroll
  - scroll-velocity reactions
  - pinned, scrubbed set-pieces
  - clip-path section transitions
  - a custom magnetic cursor tied to the signal dot
  - varied split-text reveals and parallax
  - All of it must stay at 60 fps, work on mobile, and switch off under reduced motion.
- **No Evaluator scoring from here.** The client directs the changes and reviews them at http://localhost:4400/.

### Client direction, round 2 (received during iteration 3; applies from iteration 4)
The client's words, verbatim: *"I need the loader effect and Animation that I have mentioned run throughout the website. I need the noise slider should be automatically change the 'Design The Future,' TO Bold and Big. Need more contrast after dragging the slider as well."*

1. **The loader effect and hero animation run through the whole page, not just the top.**
   - Every section gets the same "static tuning into signal" language the loader uses: particle or noise resolving into type and imagery.
   - It also gets hero-level animation richness: entrance choreography, idle life, and a response to the cursor or touch.
   - Examples:
     - Section headings assemble from static particles as they scroll in.
     - Project images de-noise from static into the photo.
     - Stats tune in digit by digit.
     - Reviews resolve out of noise.
   - Vary the treatment per section. It must feel like one system, not one effect copy-pasted everywhere.
   - It must stay performant: one shared particle engine, canvases only while on-screen, and a DOM text fallback always present.
   - Under reduced motion, show the final resolved state instantly.
   - When this is ported to Next.js, the same loader and section effects will run on every page of the site. Keep them modular, one reusable engine.
2. **The Noise fader drives "Design the Future." to bold and big, automatically.**
   - On load, after the loader hands off, the fader slides itself down on its own.
   - As the noise drops, "Design the Future." swells from thin to **bold (700) and noticeably bigger**, becoming the loudest thing in the hero.
   - Dragging the fader by hand or with the arrow keys must drive the same change live, in both directions. The fader and the headline are one instrument.
   - The layout must not jump. Reserve the space, or scale with transforms or font-size inside a fixed box.
3. **Content stays sharp at every fader position. Only the effect changes.** A follow-up from the client during iteration 4 overrides the wording further down this item: *"Once we drag the slider the whole page is giving a opacity effect, I need the elements to remain sharp but only the effect to be visible."*
   - `--noise` must never drive opacity, blur, or filter contrast/brightness on content: text, images, buttons, the nav, or the disc.
   - The noise is shown only through effect layers: grain or static, ring turbulence, particle jitter, and trace shimmer. Plus the "Design the Future." weight and size change.
   - At minimum noise the page is crisp and high-contrast. At maximum noise the content is equally sharp; only the effect is loud.

   Original item 3 wording, kept for reference: **More contrast after dragging the slider.**
   - Lower noise means a higher-contrast page. Quiet or ash text brightens toward bone, grain and haze clear, blacks deepen, and the orange gets more saturated and punchy.
   - At minimum noise the hero, and the page via `--noise`, should look crisp and high-contrast.
   - The change must be clearly visible in a before/after screenshot of a drag, not subtle.
- **Description:** "We help ambitious companies launch memorable brands, build high-impact websites, and design digital products people love to use."
- **CTAs:** Book a Call → `/proposal`, and View Projects → `/projects`
- **Three pillars:**
  - **IT Solutions:** "Websites, web applications and custom software built around the way your business works." → `/services/software-it-solutions`
  - **Digital Marketing:** "Social media, content and campaigns that help the right people find and choose you." → `/services/digital-marketing`
  - **Media Production:** "Photography, video and multimedia production that gives your brand something worth showing." → `/services/multimedia-production`
- **Hero imagery:** make it in code (canvas, WebGL, SVG or CSS). The robot images are banned; see above. The video `markuibgvideo2.mp4` is still optional.

### Trust and stats
- **Line:** "Design that works. Results that last."
- **Stats:**
  - 100% Client Satisfaction, "Trusted by growing digital teams"
  - 8+ Years Experience, "Designing scalable digital products"
  - 60+ Delivered Projects, "Across SaaS, AI & digital platforms"
  - +40% Growth Impact, "Average ROI growth after new design"
- **Client names** (wordmarks only, no logos exist): Prisma, Vertex, Lumina, Nexus, Courto, Orbital, Vanta

### Services
There are 7 services. Each links to `/services/<slug>`.

| slug | Name | Short description | Features |
|---|---|---|---|
| digital-marketing | Digital Marketing | We build marketing systems that connect every channel — search, social, email, and paid media — into one engine that attracts the right audience and turns them into paying clients. | Social Media, SEO, Google & Meta Ads, Email Marketing, Content Strategy, Analytics |
| multimedia-production | Multimedia Production | We direct and produce cinematic video and photo content that communicates quality before a single word is read. From scroll-stopping reels to full brand films. | Brand Videography, Reels & Short-Form, Motion Graphics, Promotional Videos, Event Coverage, Post-Production |
| graphic-designing | Graphic Designing | We create visual identities and design systems that make your brand instantly recognisable — across every surface, from business cards to billboards to social feeds. | Brand Identity, Social Graphics, Print & Packaging, Marketing Collateral, Brand Guidelines, Poster & Banner |
| photography-videography | Photography & Videography | We deliver images and footage that make people stop, look, and trust what they see — from product photography and corporate headshots to cinematic event coverage. | Product Photography, Corporate & Events, Cinematic Films, Drone & Aerial, Food Photography, Colour Grading |
| web-design-development | Web Design & Development | We design and build fast, mobile-first websites that turn visitors into leads. Every site is engineered for performance, clarity, and conversion. | UI / UX Design, Custom Development, E-commerce, WordPress & Webflow, Landing Pages, Speed & SEO |
| software-it-solutions | Software & IT Solutions | We build tools that adapt to your business — from custom management systems that replace messy spreadsheets to AI-powered features that automate repetitive work. | Custom Software, Mobile Apps, CRM & Systems, API & Automation, AI Solutions, IT Support |
| event-organisation-planning | Event Organisation & Planning | We handle the full picture — from concept and logistics to live production, promotion, and post-event media — making sure every moment lands with the impact it deserves. | Corporate Events, Brand Activations, Stage & AV, Live Promotion, Event Media, Post-Event Package |

### Featured work
Image: `assets/projects/<slug>.jpg`. Link: `/projects/<slug>`. All ten images are dark, cinematic, orange-lit mock-ups at about 1536×1024.

| slug | Title | Industry | Category | Tag | Description |
|---|---|---|---|---|---|
| atlas | ATLAS | Lifestyle | Branding | / framer | Complete brand overhaul and modern web presence for a premium lifestyle company. |
| rivet | RIVET® | Automotive | Multimedia | / ux/ui design | Immersive multimedia experience showcasing next-gen automotive engineering. |
| forge | FORGE | Fashion | Web | / web design | A high-performance e-commerce platform tailored for modern fashion brands. |
| kodex | KODEX | SaaS | Web | / product design | Streamlined SaaS product design reducing user onboarding friction. |
| pulse | PULSE | Health | Marketing | / social + ads | Targeted social media and ad campaigns delivering measurable ROI for health tech. |
| nexus | NEXUS | Tech | Web | / web + software | Scalable B2B software interface designed to maximize user conversion. |
| lunar | LUNAR | Hospitality | Branding | / brand identity | Elegant brand identity and digital booking experience for luxury hospitality. |
| vela | VELA | E-commerce | Marketing | / campaign | Data-driven marketing campaign to rapidly scale audience engagement. |
| crest | CREST | F&B | Branding | / brand + print | Cohesive brand and print design strategy for a growing food & beverage chain. |
| orbit | ORBIT | Events | Multimedia | / video production | High-impact video production capturing the essence of global live events. |

The categories are Web, Marketing, Branding and Multimedia. A category filter is welcome but optional.
The "See all work" link goes to `/projects`.

### Testimonials (Google Reviews, all rated 5★)
- **Muhammadh Ayoob:** "Having worked with several marketing partners over the years but out of all I found Mark UI standing out for their data driven approach and commitment towards the task."
- **Timothy Nilesh:** "Worst place to work as an intern. You won't feel to leave 🥺 Place and people which feels like home. Literally. They are the business partners who are super friendly but still, without lacking even a peck of professionalism 🤝" *(the joke is intentional)*
- **Umar Sheriff Hassanali:** "Highly recommend places for advertising and marketing your new start up and they are well known for their professionalism and quality of their work."
- **Arshaq Aroos:** "Highly recommended for anyone looking to grow their business and build a strong brand presence. Keep up the great work! 👏🔥"
- **Husni Habeeb:** "Satisfied with the work they do!"
- **Mohamed Faveed:** "Better than I expected."
- **Nadira Shafeeq:** "Very friendly superb 👌"
- **Asma Aniff:** "I highly recommend."
- **Hassan Jicker:** "Highly recommend... Specially Umer... All the best..."
- Rating-only 5★ reviews also came from Fathima Shazna Aslam, Ayush Ag and Thilina Fernando.

Do not invent an aggregate rating number or a review count beyond these 12.

### Why Mark UI
1. **Integrated team: "Design + Dev, Under One Roof."** No handoff chaos. Our designers and developers work side by side, so what gets designed is exactly what gets built.
2. **Full-stack execution: "Strategy to Execution."** From brand identity and UI to code deployment and ad campaigns, one team handles the full stack, start to finish.
3. **Creative engineering: "Creative Meets Technology."** We don't trade beauty for function. Every project fuses cinematic visual thinking with solid, scalable engineering.
4. **Results driven: "Results, Not Just Visuals."** We measure success by leads generated and brands elevated, not by how premium it looks on a screen.

### Process (optional section)
Discover (understand the business, audience and problem) → Plan (define the strategy, direction and solution) → Create (design, develop and produce the required work) → Deliver (launch, measure and improve the final result).

### Contact and enquiry
- **Heading:** "Ready to start your next project?" or a stronger line in the same spirit.
- **Form:** name (required), email and/or phone (at least one required), message (required). It needs inline validation.
- **Submission:** there is no backend. Simulate a ~900 ms send, then show a designed success state. Validation errors must be helpful, not "Invalid input".
- **Contact details:** info@markui.lk (mailto) · +94 76 088 7702 (tel:+94760887702) · Colombo, Sri Lanka

### Footer
- Navigation, the services list, contact details, and "© 2026 Mark UI. All rights reserved."
- No social icons, because no URLs exist. No privacy or terms links, because those pages don't exist.

## 6. Deliverable
- `gan-harness/prototype/`, a working static site at http://localhost:4400/
- `gan-harness/generator-state.md`, containing the concept statement, what was built, what changed, and known issues
