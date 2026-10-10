import fs from "node:fs/promises";
import path from "node:path";

import { mailHref, phoneLines, telHref, whatsappHref, whatsappLines } from "./contact-details";
import { getProjects, getServices, getSettings } from "./db";
import { isExternalUrl } from "./products";
import { richPlainText } from "./rich-text";
import { hangReviews, type Review, type ReviewSize } from "./site-content";
import {
  HOME_STATS,
  MAX_TRUST_LOGOS,
  PROJECT_CATEGORIES,
  type HomeContent,
  type Project,
  type Service,
  type Settings,
  type TrustStat,
} from "./types";

/**
 * The homepage is the static build in `public/landing/`. This serves it with
 * the parts the dashboard manages filled in from the database:
 *
 *   Home Page        the hero, and the text of the Services, Work, Why,
 *                    Process and Contact sections; the search title
 *   Trust & Stats    the Proof headline, the four figures and the client dial
 *   Reviews          the review wall
 *   Services         the services list and the footer's services column
 *   Projects         the gallery wall (featured first, up to ten)
 *   Contact          phone, WhatsApp, email and location, everywhere
 *   Page Text        the footer note
 *   Footer & Social  the social links in the menu and the footer
 *
 * `public/landing/index.html` stays a complete, working page: each managed
 * part sits between a pair of comments,
 *
 *     <!-- cms:contact-lines --> … <!-- /cms:contact-lines -->
 *
 * and holds the same content as static HTML. Rendering replaces what is
 * between the comments; if the database cannot be reached the file is served
 * exactly as it is, so the homepage never depends on the database being up.
 *
 * To put another part of the homepage under the dashboard: wrap it in a
 * `cms:` pair in index.html and add its name and renderer to `regions` below.
 */

// turbopackIgnore: the build must not trace into public/.
const TEMPLATE = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "landing", "index.html");

/** How many prints the gallery wall has slots for (styles: work.css). */
export const HOME_WALL_SIZE = 10;
/** Features listed under each service on the homepage. */
const HOME_SERVICE_FEATURES = 6;

interface LandingData {
  settings: Settings;
  services: Service[];
  projects: Project[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const ARROW = '<svg class="btn-arrow" aria-hidden="true"><use href="#i-arrow" /></svg>';

const pad = (n: number) => String(n).padStart(2, "0");

const WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];
/** "seven" for 7; digits past twenty. */
const word = (n: number) => WORDS[n] ?? String(n);
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "a, b and c" */
const listOf = (items: string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** Attributes for a link the dashboard chose: other sites open in a new tab. */
const linkAttrs = (href: string) =>
  `href="${esc(href)}"${isExternalUrl(href) ? ' target="_blank" rel="noopener noreferrer"' : ""}`;

/** One line of text out of a multi-line field. */
const oneLine = (value: string) => value.split(/\s*\n\s*/).filter(Boolean).join(" ");

/** Replaces the inside of one `cms:` region; a missing region is left alone. */
function fill(html: string, name: string, content: string): string {
  const open = `<!-- cms:${name} -->`;
  const close = `<!-- /cms:${name} -->`;
  const start = html.indexOf(open);
  const end = html.indexOf(close);
  if (start === -1 || end === -1 || end < start) return html;
  return html.slice(0, start + open.length) + content + html.slice(end);
}

// ─── Hero (Home Page) ────────────────────────────────────────────────────────

/** The headline's two lines: the first is set quiet, the second loud. */
export function heroLines(home: HomeContent): [string, string] {
  const lines = richPlainText(home.heading)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return [lines[0] ?? "", lines.slice(1).join(" ")];
}

/**
 * A headline line in the two halves the hero sets it in, split at the space
 * nearest the middle ("Design the" / "Future."). On tablets and phones each
 * half is a row of its own, so the halves should be about the same length.
 */
function heroHalves(line: string): string[] {
  const text = line.trim().replace(/\s+/g, " ");
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index ?? 0);
  if (!spaces.length) return [text];
  const middle = text.length / 2;
  const at = spaces.reduce((best, i) => (Math.abs(i - middle) <= Math.abs(best - middle) ? i : best), spaces[0]);
  return [text.slice(0, at), text.slice(at + 1)];
}

const heroSegments = (line: string) =>
  heroHalves(line)
    .map((half) => `<span class="hero-seg">${esc(half)}</span>`)
    .join(" ");

/** The lengths the hero's type size is fitted to (styles: .hero --title-fs). */
function heroMeasure(home: HomeContent): string {
  const lines = heroLines(home).filter(Boolean);
  const longest = (items: string[]) => Math.max(1, ...items.map((item) => item.length));
  return `--line-chars: ${longest(lines)}; --seg-chars: ${longest(lines.flatMap(heroHalves))}`;
}

function heroTitle({ settings }: LandingData): string {
  const [quiet, loud] = heroLines(settings.home);
  return (
    `<span class="hero-line hero-line-q">${heroSegments(quiet)}</span>` +
    (loud ? `\n                <span class="hero-line hero-line-l">${heroSegments(loud)}</span>` : "")
  );
}

const heroDescription = ({ settings }: LandingData) => esc(oneLine(richPlainText(settings.home.description)));

function heroCta({ settings }: LandingData): string {
  const { ctaText, ctaLink } = settings.home;
  return `<a class="btn-signal" ${linkAttrs(ctaLink)}>${esc(ctaText)} ${ARROW}</a>`;
}

const METER = '<span class="hero-meter" aria-hidden="true" data-meter><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>';

function heroChannels({ settings }: LandingData): string {
  const { home } = settings;
  const channels = [
    { title: home.itTitle, text: home.itDescription, link: home.itLink },
    { title: home.marketingTitle, text: home.marketingDescription, link: home.marketingLink },
    { title: home.mediaTitle, text: home.mediaDescription, link: home.mediaLink },
  ];
  return channels
    .map(
      (channel, i) =>
        `<li class="hero-channel-item" data-channel><a class="hero-channel" ${linkAttrs(channel.link || "/services")}>` +
        `<span class="hero-channel-head">${METER}<span class="hero-channel-num">CH ${pad(i + 1)}</span></span>` +
        `<span class="hero-channel-title">${esc(channel.title)}</span><span class="hero-channel-text">${esc(channel.text)}</span></a></li>`,
    )
    .join("\n              ");
}

/** The line above the headline: what the studio is, and where. */
function heroEyebrow({ settings }: LandingData): string {
  const what = settings.content.home.eyebrow;
  const where = settings.contact.location;
  return (
    `<span class="chan-led" aria-hidden="true"></span><span class="sr-only">${esc(what)}, ${esc(where)}</span>\n` +
    `              <span aria-hidden="true" data-decode>${esc(what)}</span><span class="chan-sep" aria-hidden="true"></span>` +
    `<span class="hero-eyebrow-place" aria-hidden="true" data-decode>${esc(where)}</span>`
  );
}

// ─── Proof (Trust & Stats) ───────────────────────────────────────────────────

function proofTitle({ settings }: LandingData): string {
  const { headingDark, headingMuted } = settings.trust;
  const muted = oneLine(headingMuted);
  return esc(oneLine(headingDark)) + (muted ? ` <em>${esc(muted)}</em>` : "");
}

/** "+40%" → the figure with its signs and units wrapped, so they can be set smaller. */
function figure(value: string, unitClass: string, numClass?: string): string {
  return value
    .split(/(\d[\d.,]*)/)
    .filter(Boolean)
    .map((part) =>
      /^\d/.test(part)
        ? numClass
          ? `<span class="${numClass}">${esc(part)}</span>`
          : esc(part)
        : `<span class="${unitClass}">${esc(part)}</span>`,
    )
    .join("");
}

/** The old strip's "Years" under "8+" has no line of its own here: it leads the label. */
const statLabel = (stat: TrustStat) => (stat.suffix ? `${stat.suffix} ${stat.label.toLowerCase()}` : stat.label);

function proofStats({ settings }: LandingData): string {
  const [lead, ...rest] = settings.trust.stats.slice(0, HOME_STATS);
  if (!lead) return "";
  const note = (cls: string, text: string) => (text ? `<dd class="${cls}">${esc(text)}</dd>` : "");
  return (
    `<div class="proof-lead">` +
    `<dt class="proof-lead-label"><span class="proof-lead-led" aria-hidden="true"></span>${esc(statLabel(lead))}</dt>` +
    `<dd class="proof-lead-value">${figure(lead.value, "proof-lead-plus", "proof-lead-num")}</dd>` +
    note("proof-lead-note", lead.description) +
    `</div>` +
    rest
      .map(
        (stat) =>
          `<div class="proof-read"><dt class="proof-read-label">${esc(statLabel(stat))}</dt>` +
          `<dd class="proof-read-value">${figure(stat.value, "proof-read-unit")}</dd>` +
          note("proof-read-note", stat.description) +
          `</div>`,
      )
      .join("")
  );
}

function proofDial({ settings }: LandingData): string {
  const names = settings.trust.logos.slice(0, MAX_TRUST_LOGOS);
  return (
    `<ul class="proof-dial-list" aria-labelledby="proof-dial-label" style="--dial-count: ${names.length || 1}; --dial-chars: ${Math.max(4, ...names.map((logo) => logo.name.length))}">` +
    names.map((logo) => `<li class="proof-dial-name">${esc(logo.name)}</li>`).join("") +
    `</ul>`
  );
}

// ─── Services ────────────────────────────────────────────────────────────────

/**
 * A service name on the two lines the list sets it on: before an "&" when it
 * has one ("Photography" / "& Videography"), otherwise at the space nearest
 * the middle ("Digital" / "Marketing").
 */
export function serviceNameLines(name: string): string[] {
  const text = name.trim();
  const amp = text.indexOf(" & ");
  if (amp > 0) return [text.slice(0, amp), text.slice(amp + 1)];
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index ?? 0);
  if (!spaces.length) return [text];
  const middle = text.length / 2;
  const at = spaces.reduce((best, i) => (Math.abs(i - middle) < Math.abs(best - middle) ? i : best), spaces[0]);
  return [text.slice(0, at), text.slice(at + 1)];
}

function servicesTitle({ services }: LandingData): string {
  const n = services.length;
  const first = `${capital(word(n))} ${n === 1 ? "discipline" : "disciplines"}.`;
  return (
    `<h2 class="services-title" id="services-title" aria-label="${esc(first)} One team." data-ramp>` +
    `<span class="services-title-line" aria-hidden="true">${esc(first)}</span> ` +
    `<span class="services-title-line" aria-hidden="true">One team.</span></h2>`
  );
}

function servicesRows({ services }: LandingData): string {
  return services
    .map((service, i) => {
      const href = `/services/${service.slug}`;
      const name = serviceNameLines(service.name)
        .map((line) => `<span>${esc(line)}</span>`)
        .join(" ");
      const features = service.features.slice(0, HOME_SERVICE_FEATURES);
      return (
        `<li class="services-row" data-service><span class="services-index" aria-hidden="true">${pad(i + 1)}</span>\n` +
        `              <h3 class="services-name"><a class="services-link" href="${esc(href)}">${name}</a></h3>\n` +
        `              <div class="services-body"><p class="services-desc">${esc(service.shortDescription)}</p>` +
        (features.length
          ? `\n                <ul class="services-features" aria-label="Includes">${features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
          : "") +
        `</div> <svg class="services-go" aria-hidden="true"><use href="#i-arrow" /></svg></li>`
      );
    })
    .join("\n            ");
}

const footerServices = ({ services }: LandingData) =>
  services
    .map((service) => `<li><a class="footer-link" href="/services/${esc(service.slug)}">${esc(service.name)}</a></li>`)
    .join("");

// ─── Work (Projects) ─────────────────────────────────────────────────────────

/** The wall's prints: live projects with a picture, featured first, up to ten. */
export function homeWall(projects: Project[]): Project[] {
  const shown = projects.filter((project) => project.image);
  return [...shown.filter((p) => p.featured), ...shown.filter((p) => !p.featured)].slice(0, HOME_WALL_SIZE);
}

/** The image optimiser's URL for a width it serves (the React pages use the same). */
const optimised = (src: string, width: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;

function workImage(project: Project): string {
  const alt = project.description ? `${project.title}: ${project.description}` : project.title;
  return (
    `<img src="${esc(optimised(project.image, 1920))}" ` +
    `srcset="${esc(optimised(project.image, 828))} 828w, ${esc(optimised(project.image, 1920))} 1920w" ` +
    `sizes="(max-width: 767px) 50vw, 33vw" loading="lazy" decoding="async" alt="${esc(alt)}" />`
  );
}

/** The channels in the order the tuner lists them. */
const TUNER_ORDER = ["Web", "Marketing", "Branding", "Multimedia"].filter((c) =>
  (PROJECT_CATEGORIES as readonly string[]).includes(c),
);

function workLede({ projects }: LandingData): string {
  const wall = homeWall(projects);
  const channels = TUNER_ORDER.filter((c) => wall.some((p) => p.category === c)).map((c) => c.toLowerCase());
  const count = `${capital(word(wall.length))} ${wall.length === 1 ? "project" : "projects"}`;
  return esc(
    `${count}${channels.length ? ` across ${listOf(channels)}` : ""}. Tune in to one channel: its prints move to the front of the wall and the rest turn down.`,
  );
}

function workTuner({ projects }: LandingData): string {
  const wall = homeWall(projects);
  const button = (filter: string, label: string, count: number, pressed: boolean) =>
    `<button class="work-tuner-btn" type="button" aria-pressed="${pressed}" data-filter="${esc(filter)}">` +
    `<span class="work-tuner-name" data-label="${esc(label)}">${esc(label)}</span><span class="work-tuner-count">${pad(count)}</span></button>`;
  return [
    button("all", "All", wall.length, true),
    ...TUNER_ORDER.map((c) => ({ c, n: wall.filter((p) => p.category === c).length }))
      .filter(({ n }) => n > 0)
      .map(({ c, n }) => button(c.toLowerCase(), c, n, false)),
  ].join("\n                ");
}

const workStatus = ({ projects }: LandingData) => {
  const n = homeWall(projects).length;
  return esc(n === 1 ? "The one project in focus." : `All ${word(n)} projects in focus.`);
};

function workItems({ projects }: LandingData): string {
  return homeWall(projects)
    .map((project, i) => {
      const meta = [
        project.industry ? `<span>${esc(project.industry)}</span>` : "",
        `<span>${esc(project.category)}</span>`,
        // Captions are stored the way they print, usually with their own leading slash.
        project.tag ? `<span class="work-tag">${esc(/^\s*\//.test(project.tag) ? project.tag.trim() : `/ ${project.tag.trim()}`)}</span>` : "",
      ].join("");
      return (
        `<li class="work-item" data-cat="${esc(project.category.toLowerCase())}" data-index="${i + 1}"><article class="work-card">\n` +
        `              <div class="work-frame" data-reveal>${workImage(project)}` +
        `<span class="work-view" aria-hidden="true">View project <svg class="btn-arrow"><use href="#i-arrow" /></svg></span></div>\n` +
        `              <div class="work-caption"><span class="work-index" aria-hidden="true">${pad(i + 1)}</span>` +
        `<h3 class="work-name"><a class="work-link" href="/projects/${esc(project.slug)}">${esc(project.title)}</a></h3>` +
        `<p class="work-meta">${meta}</p>` +
        (project.description ? `<p class="work-desc">${esc(project.description)}</p>` : "") +
        `</div></article></li>`
      );
    })
    .join("\n            ");
}

const workFootNote = ({ projects }: LandingData) => {
  const n = homeWall(projects).length;
  return esc(`${capital(word(n))} of the projects we're proudest of. The full archive lives on the projects page.`);
};

// ─── Voices (Reviews) ────────────────────────────────────────────────────────

const STARS = '<span class="voices-stars" role="img" aria-label="Rated 5 out of 5 on Google"></span>';

/** Emoji are set smaller than the type around them. */
const withEmoji = (html: string) =>
  html.replace(/(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)+/gu, '<span class="voices-emoji">$&</span>');

/** Keeps the last two words of a loud line together, so no word hangs alone. */
const tieLast = (text: string) => (text.split(" ").length >= 4 ? text.replace(/ (?=[^ ]*$)/, "\u00a0") : text);

/**
 * Where each review hangs. The wall alternates narrow and wide places
 * (styles: voices.css, .voices-pos-a … i): quiet reviews (long, set small)
 * take the narrow ones, loud reviews (short, set large) the wide ones.
 */
const PLACES: [string, "quiet" | "loud"][] = [
  ["a", "quiet"],
  ["b", "loud"],
  ["c", "loud"],
  ["d", "quiet"],
  ["e", "loud"],
  ["f", "loud"],
  ["g", "quiet"],
  ["h", "quiet"],
  ["i", "quiet"],
];

function placeReviews<T extends { size: ReviewSize }>(reviews: T[], keepLastFree: boolean): { review: T; place: string }[] {
  const quiet = reviews.filter((r) => r.size === "s");
  const loud = reviews.filter((r) => r.size !== "s");
  const placed: { review: T; place: string }[] = [];
  for (let i = 0; quiet.length || loud.length; i += 1) {
    const [place, kind] = PLACES[i % PLACES.length];
    // The last place of the first round is kept for the wordless reviews.
    if (keepLastFree && i === PLACES.length - 1) continue;
    const review = kind === "loud" ? (loud.shift() ?? quiet.shift()) : quiet.shift();
    // A loud review never goes in a narrow place: that place is skipped.
    if (review) placed.push({ review, place });
  }
  return placed;
}

function reviewItem(review: Review & { size: ReviewSize }, place: string | null): string {
  const loudType = review.size !== "s";
  const body = withEmoji(esc(loudType ? tieLast(review.text) : review.text));
  const lead = review.lead ? `<strong class="voices-hook">${withEmoji(esc(review.lead))}</strong> ` : "";
  return (
    `<li class="voices-item voices-item-${review.size}${place ? ` voices-pos-${place}` : ""}"><figure class="voices-quote">` +
    `<blockquote class="voices-text"><p>${lead}${body}</p></blockquote>` +
    (review.aside ? `\n              <p class="voices-aside" aria-hidden="true">${esc(review.aside)}</p>` : "") +
    `\n              <figcaption class="voices-by"><span class="voices-name">${esc(review.name)}</span>${STARS}</figcaption></figure></li>`
  );
}

function voicesWall({ settings }: LandingData): string {
  const { spoken, silent } = hangReviews(settings.content.reviews);
  const [headline, ...rest] = spoken;
  const items = [
    headline ? reviewItem(headline, null) : "",
    ...placeReviews(rest, silent.length > 0).map(({ review, place }) => reviewItem(review, place)),
  ];
  if (silent.length) {
    const n = silent.length;
    items.push(
      `<li class="voices-item voices-item-silent voices-pos-i">\n` +
        `              <p class="voices-silent-label">Zero words. Five stars.</p>\n` +
        `              <p class="voices-silent-note">${esc(
          n === 1
            ? "One more reviewer rated us without saying a thing. The quietest review of all."
            : `${capital(word(n))} more reviewers rated us without saying a thing. The quietest reviews of all.`,
        )}</p>\n` +
        `              <ul class="voices-silent-list">` +
        silent.map((r) => `<li class="voices-silent-row"><span class="voices-name">${esc(r.name)}</span>${STARS}</li>`).join("") +
        `</ul>\n            </li>`,
    );
  }
  return items.filter(Boolean).join("\n            ");
}

const voicesTitle = ({ settings }: LandingData) => {
  const n = settings.content.reviews.length;
  return esc(n === 1 ? "One review. Five stars." : `${capital(word(n))} reviews. All five stars.`);
};

// ─── Why, Process and the section text (Home Page) ───────────────────────────

/** "Mark UI" never breaks across two lines. */
const brand = (html: string) => html.replace(/Mark UI/g, "Mark&nbsp;UI");

function whyList({ settings }: LandingData): string {
  return settings.content.home.reasons
    .map(
      (reason, i) =>
        `<li class="why-item" data-why-item><p class="why-label"><span>${pad(i + 1)}</span>${esc(reason.label)}</p>` +
        // A lone "+" is the knob itself, so it is set in the signal colour.
        `<h3 class="why-name">${esc(reason.title).replace(/(^| )\+(?= |$)/g, '$1<span class="why-plus">+</span>')}</h3>\n` +
        `              <p class="why-text">${esc(reason.text)}</p></li>`,
    )
    .join("\n            ");
}

/** What the wave is doing at each stage; it belongs to the drawing, not the copy. */
const PROCESS_TAGS = ["All noise", "A pattern", "A shape", "Signal"];

function processSteps({ settings }: LandingData): string {
  return settings.content.home.steps
    .map(
      (step, i) =>
        `<li class="process-step" data-process-step><span class="process-num">${pad(i + 1)}</span>` +
        `<h3 class="process-name">${esc(step.name)}</h3><p class="process-text">${esc(step.text)}</p>` +
        `<p class="process-tag" aria-hidden="true">${PROCESS_TAGS[i] ?? ""}</p></li>`,
    )
    .join("\n              ");
}

const processTitle = ({ settings }: LandingData) =>
  `<span class="process-kicker">${esc(settings.content.home.processKicker)}</span> ` +
  `<span class="process-big">${esc(settings.content.home.processTitle)}</span>`;

/** The heading's full stop is the signal's dot, so it is its own element. */
const contactTitle = ({ settings }: LandingData) => {
  const title = settings.content.home.contactTitle;
  return title.endsWith(".")
    ? `${esc(title.slice(0, -1))}<span class="contact-title-dot">.</span>`
    : esc(title);
};

// ─── Contact details and social links ────────────────────────────────────────

/** The menu drawer's contact lines. */
function navReach({ settings: { contact } }: LandingData): string {
  const phones = phoneLines(contact)
    .map((line) => `<a class="nav-menu-phone" href="${esc(telHref(line))}">${esc(line.label)}</a>`)
    .join("");
  return phones + `<a class="nav-menu-email" href="${esc(mailHref(contact.email))}">${esc(contact.email)}</a>`;
}

/** The contact section's direct lines: phone, WhatsApp, email, studio. */
function contactLines({ settings: { contact } }: LandingData): string {
  const row = (label: string, values: string) =>
    `<li><span class="contact-lines-label">${label}</span><span class="contact-lines-values">${values}</span></li>`;
  const phones = phoneLines(contact)
    .map((line) => `<a class="contact-lines-link" href="${esc(telHref(line))}">${esc(line.label)}</a>`)
    .join("");
  const whatsapp = whatsappLines(contact)
    .map(
      (line) =>
        `<a class="contact-lines-link" href="${esc(whatsappHref(line))}" target="_blank" rel="noopener noreferrer">${esc(line.label)}</a>`,
    )
    .join("");
  return [
    row("Phone", phones),
    whatsapp ? row("WhatsApp", whatsapp) : "",
    row("Email", `<a class="contact-lines-link" href="${esc(mailHref(contact.email))}">${esc(contact.email)}</a>`),
    row("Studio", `<span class="contact-lines-plain">${esc(contact.location)}</span>`),
  ].join("");
}

/** The footer's contact column. */
function footerContact({ settings: { contact } }: LandingData): string {
  const phones = phoneLines(contact)
    .map((line) => `<li><a class="footer-link" href="${esc(telHref(line))}">${esc(line.label)}</a></li>`)
    .join("");
  return (
    phones +
    `<li><a class="footer-link" href="${esc(mailHref(contact.email))}">${esc(contact.email)}</a></li>` +
    `<li><span class="footer-plain">${esc(contact.location)}</span></li>`
  );
}

const socialLink = (cls: string) => (link: { label: string; url: string }) =>
  `<li><a${cls ? ` class="${cls}"` : ""} href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a></li>`;

function navSocial({ settings }: LandingData): string {
  if (!settings.socialLinks.length) return "";
  return `<ul class="nav-menu-social" aria-label="Social media">${settings.socialLinks.map(socialLink("")).join("")}</ul>`;
}

function footerSocial({ settings }: LandingData): string {
  if (!settings.socialLinks.length) return "";
  return `<p class="footer-title">Follow</p><ul class="footer-list">${settings.socialLinks.map(socialLink("footer-link")).join("")}</ul>`;
}

/**
 * Values that live in attributes rather than between tags: the headline as
 * the heading's accessible name, and what the contact form's script needs
 * (scripts/contact.js) — the number it offers after a message is sent and the
 * studio's own numbers, which it never echoes back as the visitor's.
 */
function attributes(html: string, { settings }: LandingData): string {
  const { contact, home } = settings;
  const lines = phoneLines(contact);
  const set = (name: string, value: string) => (source: string) =>
    source.replace(new RegExp(`${name}="[^"]*"`), `${name}="${esc(value)}"`);
  return [
    set("data-studio-call", lines[0]?.label ?? ""),
    set("data-studio-numbers", lines.map((line) => line.tel.replace(/\D/g, "")).join(",")),
    set("data-studio-email", contact.email),
  ]
    .reduce((source, apply) => apply(source), html)
    .replace(/style="--line-chars: \d+; --seg-chars: \d+"/, `style="${heroMeasure(home)}"`)
    // The page's title and description, for the browser tab and search results.
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(settings.content.home.seoTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(settings.content.home.seoDescription)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(settings.content.home.seoTitle.split(" | ")[0])}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(settings.content.home.seoDescription)}$2`)
    .replace(
      /(<h1 class="hero-title" id="hero-title" aria-label=")[^"]*(")/,
      `$1${esc(heroLines(home).filter(Boolean).join(" "))}$2`,
    );
}

const regions: Record<string, (data: LandingData) => string> = {
  "hero-eyebrow": heroEyebrow,
  "hero-title": heroTitle,
  "hero-desc": heroDescription,
  "hero-cta": heroCta,
  "hero-channels": heroChannels,
  "proof-title": proofTitle,
  "proof-stats": proofStats,
  "proof-dial": proofDial,
  "services-title": servicesTitle,
  "services-intro": ({ settings }) => esc(settings.content.home.servicesIntro),
  "services-rows": servicesRows,
  "work-title": ({ settings }) => esc(settings.content.home.workTitle),
  "work-lede": workLede,
  "work-tuner": workTuner,
  "work-status": workStatus,
  "work-items": workItems,
  "work-foot-note": workFootNote,
  "voices-title": voicesTitle,
  "voices-rule": ({ settings }) => esc(settings.content.home.reviewsNote),
  "voices-wall": voicesWall,
  "why-title": ({ settings }) => brand(esc(settings.content.home.whyTitle)),
  "why-readout": ({ settings }) => esc(settings.content.home.reasons[0]?.label ?? ""),
  "why-list": whyList,
  "process-title": processTitle,
  "process-steps": processSteps,
  "contact-title": contactTitle,
  "contact-lede": ({ settings }) => esc(settings.content.home.contactLede),
  "footer-note": ({ settings }) => esc(settings.content.footerNote),
  // Refreshed with the page (hourly at most), so the year is never stale.
  "footer-copyright": () => `© ${new Date().getFullYear()} Mark UI. All rights reserved.`,
  "nav-reach": navReach,
  "nav-social": navSocial,
  "contact-lines": contactLines,
  "footer-services": footerServices,
  "footer-contact": footerContact,
  "footer-social": footerSocial,
};

/** Sections that would be an empty shell with no data keep their static content. */
const needs: Record<string, (data: LandingData) => boolean> = {
  "services-title": ({ services }) => services.length > 0,
  "services-rows": ({ services }) => services.length > 0,
  "footer-services": ({ services }) => services.length > 0,
  "work-lede": ({ projects }) => homeWall(projects).length > 0,
  "work-tuner": ({ projects }) => homeWall(projects).length > 0,
  "work-status": ({ projects }) => homeWall(projects).length > 0,
  "work-items": ({ projects }) => homeWall(projects).length > 0,
  "work-foot-note": ({ projects }) => homeWall(projects).length > 0,
  "proof-dial": ({ settings }) => settings.trust.logos.length > 0,
  "proof-stats": ({ settings }) => settings.trust.stats.length > 0,
};

// ─── Render ──────────────────────────────────────────────────────────────────

export async function renderLanding(): Promise<string> {
  const template = await fs.readFile(TEMPLATE, "utf8");
  try {
    const [settings, services, projects] = await Promise.all([getSettings(), getServices(), getProjects()]);
    const data: LandingData = { settings, services, projects };
    let html = template;
    for (const [name, render] of Object.entries(regions)) {
      if (needs[name] && !needs[name](data)) continue;
      html = fill(html, name, render(data));
    }
    return attributes(html, data);
  } catch (error) {
    // The static page is complete on its own: serve it rather than fail.
    console.error("[landing] serving the static homepage; the database could not be read:", error);
    return template;
  }
}
