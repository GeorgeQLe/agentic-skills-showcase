/*
 * Intercepting route — renders /card/[id] as an overlay when reached by a soft
 * client navigation (a fan/slot card's expand affordance) instead of a full
 * page load. `(.)card/[id]` matches the same-level /card/[id] route. Unknown ids
 * render nothing (the standalone page owns the 404); the overlay just no-ops.
 */
import {
  loadSkillsData,
  getCardById,
  decksForCard,
} from "@/server/skillsData";
import CardDetailModal from "@/card/CardDetailModal";

export default async function CardModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = loadSkillsData();
  const skill = getCardById(data, id);
  if (!skill) return null;
  const decks = decksForCard(data, id);
  return <CardDetailModal skill={skill} decks={decks} />;
}
