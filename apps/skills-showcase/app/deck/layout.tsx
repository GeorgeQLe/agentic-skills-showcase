/*
 * Deck-route layout — enables Tailwind utilities for /deck via deck.css.
 *
 * The builder reuses the booster-pack primitives (SealedPack/BottomSheet/
 * PackOpener/SkillCard), which are Tailwind-styled. The root layout's
 * globals.css carries no Tailwind, so this scoped layout adds it for the deck
 * route only — matching the Tailwind context the /prototype routes already
 * have, and leaving the non-Tailwind marketing routes untouched.
 */
import "./deck.css";

export default function DeckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
