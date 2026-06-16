import type { Metadata } from "next";

import DeckDebugHarness from "@/deck-builder/DeckDebugHarness";

export const metadata: Metadata = {
  title: "Deck Builder",
};

export default async function DeckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DeckDebugHarness hardLoad initialDeckSlug={slug} />;
}
