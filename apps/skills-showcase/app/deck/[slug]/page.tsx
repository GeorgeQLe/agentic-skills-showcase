import type { Metadata } from "next";

import DeckRoutingSpikeShell from "@/deck-builder/DeckRoutingSpikeShell";

export const metadata: Metadata = {
  title: "Deck Builder",
};

export default async function DeckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DeckRoutingSpikeShell hardLoad initialDeckSlug={slug} />;
}
