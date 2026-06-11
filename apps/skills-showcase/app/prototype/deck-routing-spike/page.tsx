import type { Metadata } from "next";

import DeckRoutingSpikeShell from "@/deck-builder/DeckRoutingSpikeShell";

export const metadata: Metadata = {
  title: "Deck Routing Spike",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeckRoutingSpikePage() {
  return <DeckRoutingSpikeShell />;
}
