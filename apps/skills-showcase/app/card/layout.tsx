/*
 * Card-route layout — enables Tailwind utilities for the standalone /card/[id]
 * page via card.css (the CardDetail renderer reuses the Tailwind-styled
 * CardFace primitive). Mirrors app/deck/layout.tsx; leaves the non-Tailwind
 * marketing routes untouched.
 */
import "./card.css";

export default function CardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
