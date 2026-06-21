import Link from "next/link";

import type { Skill } from "@/hooks/useSkillsData";
import CardFace from "@/components/CardFace";

/*
 * NavigableCardTile — a CardFace that navigates to /card/[id] on click instead
 * of flipping (SkillCard flips; we want navigation). A soft nav from /library is
 * intercepted by app/@modal/(.)card/[id] → the card opens as a modal over the
 * grid (Escape → router.back() → /library); a hard load lands on the standalone
 * page. The <a href> server-renders, so the grid stays crawlable.
 */
export default function NavigableCardTile({ skill }: { skill: Skill }) {
  return (
    <Link
      href={`/card/${skill.id}`}
      className="library-tile"
      data-testid={`library-tile-${skill.id}`}
      aria-label={`${skill.title} card detail`}
    >
      <CardFace skill={skill} />
    </Link>
  );
}
