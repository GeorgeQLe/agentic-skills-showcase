/*
 * Layout for the @modal slot subtree — enables Tailwind for the card overlay.
 * The intercepting route renders in this separate parallel-route subtree, so it
 * doesn't inherit app/card/layout.tsx's Tailwind import; pulling the same
 * card.css in here keeps the overlay styled. Returns null when the slot is in
 * its default (no-match) state, so this adds no markup off the card route.
 */
import "../card/card.css";

export default function ModalSlotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
