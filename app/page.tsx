import type { Metadata } from "next";

import LandingExperience from "@/showcase/landing/LandingExperience";
import ShowcaseFooter from "@/showcase/ShowcaseFooter";

export const metadata: Metadata = {
  title: "G Skillpacks",
  description:
    "Browse the free, open-source skill library for Claude Code and Codex and install packs with the skillpacks npm package."
};

export default function HomePage() {
  return (
    <>
      <LandingExperience />
      <ShowcaseFooter />
    </>
  );
}
