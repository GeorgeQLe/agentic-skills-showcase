import type { Metadata } from "next";

import LandingExperience from "@/showcase/landing/LandingExperience";
import ShowcaseFooter from "@/showcase/ShowcaseFooter";

export const metadata: Metadata = {
  title: "G Skillpacks",
  description:
    "Open a pack, build your workflow deck. Sealed skill packs for Claude Code and Codex — alignment, prototype, specification, and shipping workflows."
};

export default function HomePage() {
  return (
    <>
      <LandingExperience />
      <ShowcaseFooter />
    </>
  );
}
