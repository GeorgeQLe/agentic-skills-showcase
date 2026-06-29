import type { Skill } from "@/hooks/useSkillsData";

/** A pack rendered as a tearable sealed pack in the allotment shelf. */
export interface PackCard {
  slug: string;
  name: string;
  skills: Skill[];
}

/** A domain's pack allotment + its decks, derived from the generated sets. */
export interface DomainOption {
  domain: string;
  label: string;
  blurb: string;
  packs: PackCard[];
  skillCount: number;
  /** The canonical "load this" deck for the domain (e.g. business → VARD). */
  starter: { slug: string; name: string } | null;
  /** Every deck in the domain (starter + AFPS), for the blueprint strip. */
  decks: { slug: string; name: string }[];
}
