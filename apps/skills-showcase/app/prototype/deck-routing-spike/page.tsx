import type { Metadata } from "next";

import DeckDebugHarness from "@/deck-builder/DeckDebugHarness";

export const metadata: Metadata = {
  title: "Deck Builder Table",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeckTablePage() {
  return <DeckDebugHarness />;
}
