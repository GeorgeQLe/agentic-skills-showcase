import type { Metadata } from "next";

import LandingExperience from "@/showcase/landing/LandingExperience";
import ShowcaseFooter from "@/showcase/ShowcaseFooter";

// Scoped Tailwind for the landing's pack primitives + deck table (Phase 4).
// Mirrors app/deck/deck.css; Phase 5 unifies Tailwind to the root.
import "./landing.css";

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
