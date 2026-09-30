import type { Metadata } from "next";

import AboutPage from "@/components/sections/about/AboutPage";
import { getSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "About · Mark UI",
  description:
    "Meet Mark UI — a creative technology company bringing design, technology, marketing and multimedia together.",
};

export default async function AboutRoute() {
  const { about, trust } = await getSettings();

  return <AboutPage about={about} stats={trust.stats} />;
}
