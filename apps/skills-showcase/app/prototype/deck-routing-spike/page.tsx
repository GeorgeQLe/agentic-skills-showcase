import type { Metadata } from "next";

import DeckTableShell from "@/deck-builder/DeckTableShell";

export const metadata: Metadata = {
  title: "Deck Builder Table",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeckTablePage() {
  return <DeckTableShell />;
}
