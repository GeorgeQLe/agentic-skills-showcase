import type { Metadata } from "next";

import DeckDebugHarness from "@/deck-builder/DeckDebugHarness";

export const metadata: Metadata = {
  title: "Deck Builder",
};

export default async function DeckPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  // `/deck/custom?c=…` carries the share-encoded custom deck (§8). Non-custom
  // routes ignore it.
  const customDeckParam = typeof sp.c === "string" ? sp.c : null;
  return (
    <DeckDebugHarness
      hardLoad
      initialDeckSlug={slug}
      customDeckParam={customDeckParam}
    />
  );
}
