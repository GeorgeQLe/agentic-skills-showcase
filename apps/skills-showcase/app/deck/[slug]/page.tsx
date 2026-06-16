import type { Metadata } from "next";

import DeckTableShell from "@/deck-builder/DeckTableShell";

export const metadata: Metadata = {
  title: "Deck Builder",
};

export default async function DeckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DeckTableShell hardLoad initialDeckSlug={slug} />;
}
