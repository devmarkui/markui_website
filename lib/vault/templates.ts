import { createBlock, createVideoItem } from "./blocks";
import type { VaultBlock } from "./types";

/**
 * Starting sections for a new Vault project, one set per main-site service
 * (keyed by the service slug in lib/seed.ts). They are only a starting point:
 * every section can be removed, reordered or added to in the editor.
 */

export interface VaultTemplate {
  key: string;
  name: string;
  /** What the sections are, for the "new project" screen. */
  outline: string[];
  build: () => VaultBlock[];
}

const video = (label: string, layout: "feature" | "row" | "reels", itemLabels: string[]) =>
  createBlock("video", {
    label,
    layout,
    items: itemLabels.map((l) => createVideoItem({ label: l })),
  });

export const TEMPLATES: VaultTemplate[] = [
  {
    key: "photography-videography",
    name: "Photography & Videography",
    outline: ["Story", "Drive slideshow", "Highlights (masonry)", "Aftermovie", "Client quote"],
    build: () => [
      createBlock("story", { label: "The day" }),
      createBlock("gallery", { label: "The album", layout: "slideshow", source: "drive" }),
      createBlock("gallery", { label: "Highlights", layout: "masonry", source: "uploads", autoplay: false }),
      video("Aftermovie", "feature", ["Aftermovie"]),
      createBlock("quote"),
    ],
  },
  {
    key: "event-organisation-planning",
    name: "Event Organisation & Planning",
    outline: ["Poster deck", "Teaser + announcement", "On the day (Drive slideshow)", "Aftermovie", "Social coverage", "Results"],
    build: () => [
      createBlock("posters", { label: "The campaign", layout: "deck" }),
      video("The build-up", "row", ["Teaser", "Announcement"]),
      createBlock("gallery", { label: "On the day", layout: "slideshow", source: "drive" }),
      video("Aftermovie", "feature", ["Aftermovie"]),
      createBlock("social", { label: "Coverage" }),
      createBlock("results", { label: "The turnout" }),
    ],
  },
  {
    key: "web-design-development",
    name: "Web Design & Development",
    outline: ["Website (live + pages)", "Challenge & solution", "Screens", "Results", "Client quote"],
    build: () => [
      createBlock("website"),
      createBlock("story", { label: "Challenge & solution" }),
      createBlock("gallery", { label: "Screens", layout: "grid", source: "uploads", autoplay: false }),
      createBlock("results"),
      createBlock("quote"),
    ],
  },
  {
    key: "software-it-solutions",
    name: "Software & IT Solutions",
    outline: ["Demo walkthrough", "Prototype", "Screens", "Features & stack", "Results"],
    build: () => [
      video("Walkthrough", "feature", ["Walkthrough"]),
      createBlock("embed", { label: "Prototype" }),
      createBlock("gallery", { label: "Screens", layout: "grid", source: "uploads", autoplay: false }),
      createBlock("story", { label: "Features & stack" }),
      createBlock("results"),
    ],
  },
  {
    key: "digital-marketing",
    name: "Digital Marketing",
    outline: ["The brief", "Results", "Social feed", "Creatives (posters)", "Reels"],
    build: () => [
      createBlock("story", { label: "The brief" }),
      createBlock("results"),
      createBlock("social", { label: "The feed" }),
      createBlock("posters", { label: "Creatives", layout: "grid" }),
      video("Reels", "reels", ["Reel", "Reel", "Reel"]),
    ],
  },
  {
    key: "multimedia-production",
    name: "Multimedia Production",
    outline: ["The film", "Teasers", "Reels", "Behind the scenes (filmstrip)", "Process"],
    build: () => [
      video("The film", "feature", [""]),
      video("Teasers", "row", ["Teaser", "Trailer"]),
      video("Reels", "reels", ["Reel", "Reel", "Reel"]),
      createBlock("gallery", { label: "Behind the scenes", layout: "filmstrip", source: "drive" }),
      createBlock("story", { label: "Process" }),
    ],
  },
  {
    key: "graphic-designing",
    name: "Graphic Designing",
    outline: ["The brief", "Poster deck", "Before / after", "Mockups (masonry)", "Brand guidelines"],
    build: () => [
      createBlock("story", { label: "The brief" }),
      createBlock("posters", { label: "The work", layout: "deck" }),
      createBlock("compare"),
      createBlock("gallery", { label: "Mockups", layout: "masonry", source: "uploads", autoplay: false }),
      createBlock("files", { label: "Brand guidelines" }),
    ],
  },
];

export const GENERAL_TEMPLATE: VaultTemplate = {
  key: "general",
  name: "Blank project",
  outline: ["Story", "Gallery"],
  build: () => [createBlock("story"), createBlock("gallery", { layout: "masonry", source: "uploads", autoplay: false })],
};

export function templateFor(key: string | undefined): VaultTemplate {
  return TEMPLATES.find((t) => t.key === key) ?? GENERAL_TEMPLATE;
}
