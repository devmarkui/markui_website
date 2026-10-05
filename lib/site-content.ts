/**
 * The site's written content that is not a record of its own (a project, a
 * service, a product): the homepage's sections, the reviews, each page's
 * header and closing call to action, the contact page's promises and
 * questions, and the footer note. Edited in the dashboard (Home Page,
 * Reviews, Page Text, Contact) and stored as one JSON document.
 *
 * Every field's default is the text the site shipped with, and every limit
 * below is the length the design holds without breaking, so anything saved
 * through the dashboard fits the layout it is going into.
 */

// ─── Shapes ──────────────────────────────────────────────────────────────────

/** The opening of a page: channel label, two-volume title, one paragraph. */
export interface PageHeader {
  /** The small label above the title: "Selected work". */
  label: string;
  /** First half of the title, set light: "Work we've". */
  quiet: string;
  /** Second half, set bold: "put our name on". A full stop is added. */
  loud: string;
  lede: string;
}

/** The last section of a page, before the footer. */
export interface PageCta {
  quiet: string;
  loud: string;
  text: string;
}

export interface PageCopy {
  header: PageHeader;
  cta: PageCta;
}

/** One Google review on the homepage wall. */
export interface Review {
  name: string;
  /** What they wrote. Blank for a rating left without words. */
  text: string;
  /** Optional opening line set bold above the text. */
  lead: string;
  /** Optional sticker note under the text ("Keep reading. He's joking."). */
  aside: string;
}

/** One of the four reasons on the homepage's knob. */
export interface WhyReason {
  /** The short name on the knob's readout: "Integrated team". */
  label: string;
  /** The headline. A lone "+" is set in orange. */
  title: string;
  text: string;
}

export interface ProcessStep {
  name: string;
  text: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface HomeSections {
  /** The line above the hero headline. */
  eyebrow: string;
  /** The paragraph beside "Seven disciplines. One team." */
  servicesIntro: string;
  /** The gallery wall's heading. */
  workTitle: string;
  /** The small note beside the reviews heading. */
  reviewsNote: string;
  whyTitle: string;
  /** Exactly four: the knob has four positions. */
  reasons: WhyReason[];
  /** The quiet half of the process heading: "Four stages." */
  processKicker: string;
  /** The loud half: "One clean signal." */
  processTitle: string;
  /** Exactly four: the wave has four stages. */
  steps: ProcessStep[];
  contactTitle: string;
  contactLede: string;
  /** The browser tab and search-result title. */
  seoTitle: string;
  /** The search-result description. */
  seoDescription: string;
}

export interface ContactPageCopy extends PageCopy {
  /** The lines that run past on the orange strip. */
  promises: string[];
  faqs: Faq[];
}

export interface SiteContent {
  home: HomeSections;
  reviews: Review[];
  /** The sentence under the logo in the footer. */
  footerNote: string;
  pages: {
    projects: PageCopy;
    products: PageCopy;
    services: PageCopy;
    contact: ContactPageCopy;
  };
}

// ─── Limits ──────────────────────────────────────────────────────────────────

export const HOME_REASONS = 4;
export const HOME_STEPS = 4;
export const MAX_REVIEWS = 16;
export const MIN_PROMISES = 3;
export const MAX_PROMISES = 8;
export const MAX_FAQS = 10;

/** Longest each field can be and still fit where it is set. */
export const LIMITS = {
  eyebrow: 40,
  servicesIntro: 220,
  workTitle: 40,
  reviewsNote: 80,
  whyTitle: 40,
  reasonLabel: 24,
  reasonTitle: 36,
  reasonText: 180,
  processKicker: 20,
  processTitle: 22,
  stepName: 14,
  stepText: 80,
  contactTitle: 40,
  contactLede: 200,
  seoTitle: 90,
  seoDescription: 200,
  reviewName: 40,
  reviewText: 420,
  reviewLead: 60,
  reviewAside: 40,
  footerNote: 140,
  headerLabel: 28,
  headerQuiet: 24,
  headerLoud: 24,
  headerLede: 280,
  ctaQuiet: 24,
  ctaLoud: 24,
  ctaText: 220,
  promise: 32,
  faqQuestion: 90,
  faqAnswer: 420,
} as const;

// ─── Defaults: the text the site shipped with ────────────────────────────────

export const DEFAULT_CONTENT: SiteContent = {
  home: {
    eyebrow: "Creative technology studio",
    servicesIntro:
      "Design, web and software, digital marketing, photography and video, multimedia production and events. One team takes it from the first idea to the final frame.",
    workTitle: "The work does the talking.",
    reviewsNote: "Set by length: the fewer the words, the louder the type.",
    whyTitle: "Why teams choose Mark UI.",
    reasons: [
      {
        label: "Integrated team",
        title: "Design + Dev, Under One Roof.",
        text: "No handoff chaos. Our designers and developers work side by side, so what gets designed is exactly what gets built.",
      },
      {
        label: "Full-stack execution",
        title: "Strategy to Execution.",
        text: "From brand identity and UI to code deployment and ad campaigns, one team handles the full stack, start to finish.",
      },
      {
        label: "Creative engineering",
        title: "Creative Meets Technology.",
        text: "We don't trade beauty for function. Every project fuses cinematic visual thinking with solid, scalable engineering.",
      },
      {
        label: "Results driven",
        title: "Results, Not Just Visuals.",
        text: "We measure success by leads generated and brands elevated, not by how premium it looks on a screen.",
      },
    ],
    processKicker: "Four stages.",
    processTitle: "One clean signal.",
    steps: [
      { name: "Discover", text: "Understand the business, audience and problem." },
      { name: "Plan", text: "Define the strategy, direction and solution." },
      { name: "Create", text: "Design, develop and produce the required work." },
      { name: "Deliver", text: "Launch, measure and improve the final result." },
    ],
    contactTitle: "Start something worth hearing.",
    contactLede:
      "Ready to start your next project? Tell us where you are and where you want to be. A few lines is plenty.",
    seoTitle: "Mark UI — Design the Future. Define the Experience. | Creative technology studio, Colombo",
    seoDescription:
      "Mark UI is a creative technology studio in Colombo, Sri Lanka: IT solutions, digital marketing and media production under one roof. Less Noise. More Impact.",
  },
  reviews: [
    { name: "Mohamed Faveed", text: "Better than I expected.", lead: "", aside: "" },
    {
      name: "Muhammadh Ayoob",
      text: "Having worked with several marketing partners over the years but out of all I found Mark UI standing out for their data driven approach and commitment towards the task.",
      lead: "",
      aside: "",
    },
    { name: "Asma Aniff", text: "I highly recommend.", lead: "", aside: "" },
    { name: "Husni Habeeb", text: "Satisfied with the work they do!", lead: "", aside: "" },
    {
      name: "Timothy Nilesh",
      text: "You won't feel to leave 🥺 Place and people which feels like home. Literally. They are the business partners who are super friendly but still, without lacking even a peck of professionalism 🤝",
      lead: "Worst place to work as an intern.",
      aside: "Keep reading. He's joking.",
    },
    { name: "Nadira Shafeeq", text: "Very friendly superb 👌", lead: "", aside: "" },
    { name: "Hassan Jicker", text: "Highly recommend... Specially Umer... All the best...", lead: "", aside: "" },
    {
      name: "Arshaq Aroos",
      text: "Highly recommended for anyone looking to grow their business and build a strong brand presence. Keep up the great work! 👏🔥",
      lead: "",
      aside: "",
    },
    {
      name: "Umar Sheriff Hassanali",
      text: "Highly recommend places for advertising and marketing your new start up and they are well known for their professionalism and quality of their work.",
      lead: "",
      aside: "",
    },
    { name: "Fathima Shazna Aslam", text: "", lead: "", aside: "" },
    { name: "Ayush Ag", text: "", lead: "", aside: "" },
    { name: "Thilina Fernando", text: "", lead: "", aside: "" },
  ],
  footerNote: "Creative technology studio. Design, web and software, marketing, media and events under one roof.",
  pages: {
    projects: {
      header: {
        label: "Selected work",
        quiet: "Work we've",
        loud: "put our name on",
        lede: "Brand identities and campaigns, websites and film: a selection of the projects we've designed, built and delivered for our clients. Tune in to one channel at a time.",
      },
      cta: {
        quiet: "Have a project",
        loud: "in mind",
        text: "Tell us about it: what you're making, who it's for and when you need it. We'll come back with ideas and a clear plan.",
      },
    },
    products: {
      header: {
        label: "What we build",
        quiet: "Software we",
        loud: "build and run",
        lede: "Digital products and software solutions designed to solve real business problems, built, maintained and supported by the Mark UI team.",
      },
      cta: {
        quiet: "Ready to build",
        loud: "something",
        text: "Whether it's one of our products or something built around your business, tell us what you need and we'll take it from there.",
      },
    },
    services: {
      header: {
        label: "What we do",
        quiet: "Every discipline,",
        loud: "one team",
        lede: "From strategy and design to production and development, our team handles every part of your brand's digital presence. Each channel below lists what it includes, beside a selection of recent work.",
      },
      cta: {
        quiet: "Let's work",
        loud: "together",
        text: "Tell us what you're planning and we'll come back with ideas, timelines and a clear proposal.",
      },
    },
    contact: {
      header: {
        label: "Get in touch",
        quiet: "Let's make",
        loud: "something great",
        lede: "Ready to start your next project? Tell us where you are and where you want to be. A few lines is plenty, and we reply within 24 hours on business days.",
      },
      cta: {
        quiet: "Prefer to",
        loud: "talk",
        text: "Book a call and we'll walk through your project together, or message us on WhatsApp for a faster reply.",
      },
      promises: [
        "Free consultation",
        "Response within 24 hours",
        "Transparent pricing",
        "Dedicated project support",
        "Tailored solutions",
      ],
      faqs: [
        {
          q: "How quickly do you respond to enquiries?",
          a: "We usually respond within 24 hours on business days. For urgent projects, reach out on WhatsApp for a faster reply.",
        },
        {
          q: "Do you work with international clients?",
          a: "Yes, we work with clients worldwide. Our team works remotely and collaborates easily across time zones.",
        },
        {
          q: "Can I request a custom package?",
          a: "Absolutely. Every project is different, so we tailor the work to your goals, budget and timeline. Just tell us what you need.",
        },
        {
          q: "Do you offer ongoing monthly services?",
          a: "Yes. We offer retainers for social media management, content creation, SEO and ongoing marketing support, for businesses that want steady, consistent growth.",
        },
      ],
    },
  },
};

// ─── Normalising ─────────────────────────────────────────────────────────────

type Loose<T> = { [K in keyof T]?: unknown };

const str = (value: unknown, fallback: string, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;

/** A string that is allowed to be empty (optional fields). */
const optional = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

const list = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];

function header(raw: unknown, fallback: PageHeader): PageHeader {
  const h = (raw && typeof raw === "object" ? raw : {}) as Loose<PageHeader>;
  return {
    label: str(h.label, fallback.label, LIMITS.headerLabel),
    quiet: optional(h.quiet ?? fallback.quiet, LIMITS.headerQuiet),
    loud: str(h.loud, fallback.loud, LIMITS.headerLoud),
    lede: str(h.lede, fallback.lede, LIMITS.headerLede),
  };
}

function cta(raw: unknown, fallback: PageCta): PageCta {
  const c = (raw && typeof raw === "object" ? raw : {}) as Loose<PageCta>;
  return {
    quiet: optional(c.quiet ?? fallback.quiet, LIMITS.ctaQuiet),
    loud: str(c.loud, fallback.loud, LIMITS.ctaLoud),
    text: str(c.text, fallback.text, LIMITS.ctaText),
  };
}

function page(raw: unknown, fallback: PageCopy): PageCopy {
  const p = (raw && typeof raw === "object" ? raw : {}) as Loose<PageCopy>;
  return { header: header(p.header, fallback.header), cta: cta(p.cta, fallback.cta) };
}

/**
 * Brings a stored document up to date: anything missing, of the wrong type
 * or over its limit falls back to the shipped text, so a page can always
 * render and a field added later reads as its default.
 */
export function normalizeContent(raw: unknown): SiteContent {
  const doc = (raw && typeof raw === "object" ? raw : {}) as Loose<SiteContent>;
  const d = DEFAULT_CONTENT;
  const h = (doc.home && typeof doc.home === "object" ? doc.home : {}) as Loose<HomeSections>;
  const pages = (doc.pages && typeof doc.pages === "object" ? doc.pages : {}) as Loose<SiteContent["pages"]>;
  const contact = (pages.contact && typeof pages.contact === "object" ? pages.contact : {}) as Loose<ContactPageCopy>;

  const reasons = list(h.reasons);
  const steps = list(h.steps);
  const reviews = list(doc.reviews)
    .map((r) => ({
      name: optional(r.name, LIMITS.reviewName),
      text: optional(r.text, LIMITS.reviewText),
      lead: optional(r.lead, LIMITS.reviewLead),
      aside: optional(r.aside, LIMITS.reviewAside),
    }))
    .filter((r) => r.name)
    .slice(0, MAX_REVIEWS);
  const promises = (Array.isArray(contact.promises) ? contact.promises : [])
    .map((p) => optional(p, LIMITS.promise))
    .filter(Boolean)
    .slice(0, MAX_PROMISES);
  const faqs = list(contact.faqs)
    .map((f) => ({ q: optional(f.q, LIMITS.faqQuestion), a: optional(f.a, LIMITS.faqAnswer) }))
    .filter((f) => f.q && f.a)
    .slice(0, MAX_FAQS);

  return {
    home: {
      eyebrow: str(h.eyebrow, d.home.eyebrow, LIMITS.eyebrow),
      servicesIntro: str(h.servicesIntro, d.home.servicesIntro, LIMITS.servicesIntro),
      workTitle: str(h.workTitle, d.home.workTitle, LIMITS.workTitle),
      reviewsNote: optional(h.reviewsNote ?? d.home.reviewsNote, LIMITS.reviewsNote),
      whyTitle: str(h.whyTitle, d.home.whyTitle, LIMITS.whyTitle),
      // Always four: a short or missing list is completed from the defaults.
      reasons: d.home.reasons.map((fallback, i) => ({
        label: str(reasons[i]?.label, fallback.label, LIMITS.reasonLabel),
        title: str(reasons[i]?.title, fallback.title, LIMITS.reasonTitle),
        text: str(reasons[i]?.text, fallback.text, LIMITS.reasonText),
      })),
      processKicker: str(h.processKicker, d.home.processKicker, LIMITS.processKicker),
      processTitle: str(h.processTitle, d.home.processTitle, LIMITS.processTitle),
      steps: d.home.steps.map((fallback, i) => ({
        name: str(steps[i]?.name, fallback.name, LIMITS.stepName),
        text: str(steps[i]?.text, fallback.text, LIMITS.stepText),
      })),
      contactTitle: str(h.contactTitle, d.home.contactTitle, LIMITS.contactTitle),
      contactLede: str(h.contactLede, d.home.contactLede, LIMITS.contactLede),
      seoTitle: str(h.seoTitle, d.home.seoTitle, LIMITS.seoTitle),
      seoDescription: str(h.seoDescription, d.home.seoDescription, LIMITS.seoDescription),
    },
    // An empty list means "never saved": a wall always has reviews on it.
    reviews: reviews.length ? reviews : d.reviews,
    footerNote: str(doc.footerNote, d.footerNote, LIMITS.footerNote),
    pages: {
      projects: page(pages.projects, d.pages.projects),
      products: page(pages.products, d.pages.products),
      services: page(pages.services, d.pages.services),
      contact: {
        ...page(pages.contact, d.pages.contact),
        promises: promises.length >= MIN_PROMISES ? promises : d.pages.contact.promises,
        faqs: Array.isArray(contact.faqs) ? faqs : d.pages.contact.faqs,
      },
    },
  };
}

// ─── The review wall ─────────────────────────────────────────────────────────

/** How loud a review is set: the fewer the words, the louder. */
export type ReviewSize = "xxl" | "xl" | "l" | "m" | "s";

const wordCount = (text: string) => (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) ?? []).length;

/**
 * The wall as it is hung: the first review with words is the headline one,
 * set largest; the rest are sized by how few words they use (only one gets
 * the second-largest size); reviewers who left no words are listed together
 * at the end.
 */
export function hangReviews<T extends Review>(reviews: T[]): {
  spoken: (T & { size: ReviewSize })[];
  silent: T[];
} {
  const spoken = reviews.filter((r) => r.text.trim());
  const silent = reviews.filter((r) => !r.text.trim());
  let xlUsed = false;
  return {
    silent,
    spoken: spoken.map((review, i) => {
      if (i === 0) return { ...review, size: "xxl" as const };
      const words = wordCount(`${review.lead} ${review.text}`);
      let size: ReviewSize = words <= 6 ? "l" : words <= 14 ? "m" : "s";
      if (words <= 3 && !xlUsed) {
        size = "xl";
        xlUsed = true;
      }
      return { ...review, size };
    }),
  };
}
