import type { ProjectCategory } from "./types";

/**
 * Initial content for a fresh install.
 *
 * Projects and services are the ones that used to be hard-coded in
 * `components/sections/home/FeaturedProjects.tsx` and
 * `components/sections/home/Services.tsx`. They are written into the store once,
 * the first time it is read, and are fully editable from the admin dashboard
 * afterwards. There is deliberately no product seed data — real products are
 * added through the dashboard.
 */

// ─── Projects ────────────────────────────────────────────────────────────────

export interface SeedProject {
  title: string;
  industry: string;
  category: ProjectCategory;
  tag: string;
  description: string;
  image: string;
  size: "large" | "small";
}

export const SEED_PROJECTS: SeedProject[] = [
  {
    title: "FORGE",
    industry: "Fashion",
    category: "Web",
    tag: "/ web design",
    description:
      "A high-performance e-commerce platform tailored for modern fashion brands.",
    image: "/projects/forge.jpg",
    size: "small",
  },
  {
    title: "ATLAS",
    industry: "Lifestyle",
    category: "Branding",
    tag: "/ framer",
    description:
      "Complete brand overhaul and modern web presence for a premium lifestyle company.",
    image: "/projects/atlas.jpg",
    size: "large",
  },
  {
    title: "RIVET®",
    industry: "Automotive",
    category: "Multimedia",
    tag: "/ ux/ui design",
    description:
      "Immersive multimedia experience showcasing next-gen automotive engineering.",
    image: "/projects/rivet.jpg",
    size: "large",
  },
  {
    title: "VELA",
    industry: "E-commerce",
    category: "Marketing",
    tag: "/ campaign",
    description:
      "Data-driven marketing campaign to rapidly scale audience engagement.",
    image: "/projects/vela.jpg",
    size: "small",
  },
  {
    title: "NEXUS",
    industry: "Tech",
    category: "Web",
    tag: "/ web + software",
    description:
      "Scalable B2B software interface designed to maximize user conversion.",
    image: "/projects/nexus.jpg",
    size: "small",
  },
  {
    title: "LUNAR",
    industry: "Hospitality",
    category: "Branding",
    tag: "/ brand identity",
    description:
      "Elegant brand identity and digital booking experience for luxury hospitality.",
    image: "/projects/lunar.jpg",
    size: "small",
  },
  {
    title: "KODEX",
    industry: "SaaS",
    category: "Web",
    tag: "/ product design",
    description:
      "Streamlined SaaS product design reducing user onboarding friction.",
    image: "/projects/kodex.jpg",
    size: "large",
  },
  {
    title: "CREST",
    industry: "F&B",
    category: "Branding",
    tag: "/ brand + print",
    description:
      "Cohesive brand and print design strategy for a growing food & beverage chain.",
    image: "/projects/crest.jpg",
    size: "small",
  },
  {
    title: "ORBIT",
    industry: "Events",
    category: "Multimedia",
    tag: "/ video production",
    description:
      "High-impact video production capturing the essence of global live events.",
    image: "/projects/orbit.jpg",
    size: "small",
  },
  {
    title: "PULSE",
    industry: "Health",
    category: "Marketing",
    tag: "/ social + ads",
    description:
      "Targeted social media and ad campaigns delivering measurable ROI for health tech.",
    image: "/projects/pulse.jpg",
    size: "large",
  },
  {
    title: "AURA",
    industry: "Corporate",
    category: "Web",
    tag: "/ web design",
    description:
      "Immersive corporate website redefining the digital presence for a financial firm.",
    image: "/projects/aura.jpg",
    size: "small",
  },
  {
    title: "SYNC",
    industry: "Productivity",
    category: "Web",
    tag: "/ web app",
    description:
      "Real-time collaboration web application featuring a distraction-free UI.",
    image: "/projects/sync.jpg",
    size: "large",
  },
  {
    title: "NOVA",
    industry: "Tech",
    category: "Branding",
    tag: "/ identity",
    description:
      "Futuristic brand identity establishing a bold new voice in the AI sector.",
    image: "/projects/nova.jpg",
    size: "small",
  },
  {
    title: "ECHO",
    industry: "Audio",
    category: "Branding",
    tag: "/ brand system",
    description:
      "Minimalist visual language and packaging design for high-end audio hardware.",
    image: "/projects/echo.jpg",
    size: "small",
  },
  {
    title: "VORTEX",
    industry: "Consumer Goods",
    category: "Multimedia",
    tag: "/ 3d animation",
    description:
      "Striking 3D animation sequence crafted for a flagship product launch.",
    image: "/projects/vortex.jpg",
    size: "small",
  },
  {
    title: "PRISM",
    industry: "Education",
    category: "Multimedia",
    tag: "/ interactive video",
    description:
      "Interactive learning showcase combining live-action footage with motion graphics.",
    image: "/projects/prism.jpg",
    size: "large",
  },
  {
    title: "FLUX",
    industry: "Entertainment",
    category: "Multimedia",
    tag: "/ motion graphics",
    description:
      "Dynamic motion graphics package designed for a major streaming network.",
    image: "/projects/flux.jpg",
    size: "small",
  },
  {
    title: "ZENITH",
    industry: "Fitness",
    category: "Marketing",
    tag: "/ growth strategy",
    description:
      "Omnichannel growth campaign driving subscriber acquisition for a fitness app.",
    image: "/projects/zenith.jpg",
    size: "small",
  },
  {
    title: "CATALYST",
    industry: "B2B SaaS",
    category: "Marketing",
    tag: "/ content strategy",
    description:
      "Comprehensive SEO and content marketing strategy targeting enterprise clients.",
    image: "/projects/catalyst.jpg",
    size: "large",
  },
  {
    title: "OMNI",
    industry: "Retail",
    category: "Marketing",
    tag: "/ paid social",
    description:
      "Paid social media scaling initiative that exponentially increased direct sales.",
    image: "/projects/omni.jpg",
    size: "small",
  },
];

// ─── Services ────────────────────────────────────────────────────────────────

export interface SeedService {
  slug: string;
  name: string;
  icon: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  benefits: string[];
  tags: string[];
  /**
   * Project category whose work is linked in as this service's starting
   * Top Work. Omitted where no project category maps cleanly.
   */
  topWorkFrom?: ProjectCategory;
}

export const SEED_SERVICES: SeedService[] = [
  {
    slug: "digital-marketing",
    name: "Digital Marketing",
    icon: "◎",
    shortDescription:
      "We build marketing systems that connect every channel — search, social, email, and paid media — into one engine that attracts the right audience and turns them into paying clients.",
    fullDescription:
      "Most marketing fails because the channels are run in isolation: ads point one way, the website says something else, and nobody follows up on the leads. We treat your marketing as a single system. We start with the audience and the offer, then build the channels around them — search that captures intent, social that builds familiarity, paid media that scales what already works, and email that keeps the conversation going. Everything is measured, so you can see which part of the system is earning its keep and which needs work.",
    features: [
      "Social Media",
      "SEO",
      "Google & Meta Ads",
      "Email Marketing",
      "Content Strategy",
      "Analytics",
    ],
    benefits: [
      "One connected strategy instead of disconnected channels",
      "Campaigns built around measurable outcomes, not vanity metrics",
      "Clear monthly reporting you can actually act on",
      "Creative and media handled by the same team, so nothing gets lost in translation",
    ],
    tags: ["Strategy", "Paid Media", "SEO"],
    topWorkFrom: "Marketing",
  },
  {
    slug: "multimedia-production",
    name: "Multimedia Production",
    icon: "◈",
    shortDescription:
      "We direct and produce cinematic video and photo content that communicates quality before a single word is read. From scroll-stopping reels to full brand films.",
    fullDescription:
      "Video is the fastest way to tell someone what your business is worth — and the fastest way to undersell it if the craft is not there. We handle production end to end: concept and script, direction on the day, and the edit, grade and sound that turn footage into something people finish watching. Whether it is a thirty-second vertical cut for social or a full brand film for your homepage, the work is built for where it will actually be seen.",
    features: [
      "Brand Videography",
      "Reels & Short-Form",
      "Motion Graphics",
      "Promotional Videos",
      "Event Coverage",
      "Post-Production",
    ],
    benefits: [
      "Concept, shoot and post handled by one team",
      "Content cut for each platform rather than one file reused everywhere",
      "Direction that keeps the brand consistent on camera",
      "Full post-production in house — edit, motion, grade and sound",
    ],
    tags: ["Video", "Motion", "Post-Production"],
    topWorkFrom: "Multimedia",
  },
  {
    slug: "graphic-designing",
    name: "Graphic Designing",
    icon: "▲",
    shortDescription:
      "We create visual identities and design systems that make your brand instantly recognisable — across every surface, from business cards to billboards to social feeds.",
    fullDescription:
      "A logo is not a brand. What makes a business recognisable is a system — type, colour, layout and tone applied the same way everywhere, until people know it is you before they read the name. We build that system and document it, so your identity holds together whether it is being applied by us, by your team, or by a printer you have never met. The result is a brand that looks deliberate at every size and on every surface.",
    features: [
      "Brand Identity",
      "Social Graphics",
      "Print & Packaging",
      "Marketing Collateral",
      "Brand Guidelines",
      "Poster & Banner",
    ],
    benefits: [
      "A documented system, not a one-off logo file",
      "Consistent application across digital and print",
      "Guidelines your own team can follow without us",
      "Print-ready artwork prepared properly the first time",
    ],
    tags: ["Identity", "Print", "Systems"],
    topWorkFrom: "Branding",
  },
  {
    slug: "photography-videography",
    name: "Photography & Videography",
    icon: "◉",
    shortDescription:
      "We deliver images and footage that make people stop, look, and trust what they see — from product photography and corporate headshots to cinematic event coverage.",
    fullDescription:
      "Good photography does quiet work: it tells people your business is careful, established and worth the price before anyone reads a word. We shoot product, people, spaces and events, and we light and grade them so they sit together as one consistent library rather than a folder of mismatched files. You get images sized and prepared for the places you actually use them — site, catalogue, social and print.",
    features: [
      "Product Photography",
      "Corporate & Events",
      "Cinematic Films",
      "Drone & Aerial",
      "Food Photography",
      "Colour Grading",
    ],
    benefits: [
      "A consistent image library rather than one-off shoots",
      "Lighting and grading handled properly, not fixed in a filter",
      "Files delivered sized for web, social and print",
      "Drone and aerial capability where the story needs it",
    ],
    tags: ["Photography", "Film", "Aerial"],
  },
  {
    slug: "web-design-development",
    name: "Web Design & Development",
    icon: "▤",
    shortDescription:
      "We design and build fast, mobile-first websites that turn visitors into leads. Every site is engineered for performance, clarity, and conversion.",
    fullDescription:
      "A website earns its cost by turning attention into enquiries. We design mobile-first, because that is where most of your traffic already is, and we build for speed, because a slow page loses people before it has said anything. Structure, copy hierarchy and calls to action are planned before a pixel is drawn, then built on a stack you can maintain — custom where it needs to be, a platform like WordPress or Webflow where that serves you better.",
    features: [
      "UI / UX Design",
      "Custom Development",
      "E-commerce",
      "WordPress & Webflow",
      "Landing Pages",
      "Speed & SEO",
    ],
    benefits: [
      "Mobile-first design, not a desktop layout squeezed down",
      "Built for speed and search from the start",
      "Structure planned around conversion, not decoration",
      "A stack your team can actually maintain",
    ],
    tags: ["UI/UX", "Development", "E-commerce"],
    topWorkFrom: "Web",
  },
  {
    slug: "software-it-solutions",
    name: "Software & IT Solutions",
    icon: "◆",
    shortDescription:
      "We build tools that adapt to your business — from custom management systems that replace messy spreadsheets to AI-powered features that automate repetitive work.",
    fullDescription:
      "Most businesses outgrow their spreadsheets long before they replace them. We build the software that takes over: management systems shaped around how your team already works, mobile apps, integrations that stop the same data being typed in twice, and automation for the tasks nobody should still be doing by hand. Built to fit the process you have, rather than forcing you into someone else's.",
    features: [
      "Custom Software",
      "Mobile Apps",
      "CRM & Systems",
      "API & Automation",
      "AI Solutions",
      "IT Support",
    ],
    benefits: [
      "Software shaped around your process, not the other way round",
      "Integrations that remove duplicate data entry",
      "Automation aimed at the work that actually costs you hours",
      "Ongoing support after launch",
    ],
    tags: ["Software", "Automation", "AI"],
  },
  {
    slug: "event-organisation-planning",
    name: "Event Organisation & Planning",
    icon: "⬟",
    shortDescription:
      "We handle the full picture — from concept and logistics to live production, promotion, and post-event media — making sure every moment lands with the impact it deserves.",
    fullDescription:
      "An event is a production, a marketing campaign and a logistics exercise happening at once — and it only works if the same team is watching all three. We take it from concept through to the recap film: staging and AV, run of show, promotion before the doors open, and the photo and video package afterwards that keeps the event working long after the day itself.",
    features: [
      "Corporate Events",
      "Brand Activations",
      "Stage & AV",
      "Live Promotion",
      "Event Media",
      "Post-Event Package",
    ],
    benefits: [
      "Concept, logistics and promotion under one team",
      "Staging and AV handled by people who have run the room before",
      "Coverage captured on the day, not arranged as an afterthought",
      "A post-event media package you can keep using",
    ],
    tags: ["Events", "Production", "Activation"],
  },
];

/** How many projects to link in as starting Top Work for each service. */
export const SEED_TOP_WORK_PER_SERVICE = 3;
