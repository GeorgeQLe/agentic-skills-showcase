/*
 * /card/[id] — the indexed, statically-generated card-detail surface. One page
 * per mirrorKey-deduped card (the same ~190 logical cards the catalog and
 * benchmarks views show). The @modal/(.)card/[id] route intercepts soft
 * navigations here and renders CardDetail as an overlay instead; a hard load or
 * direct link lands on this standalone page.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import {
  loadSkillsData,
  dedupeCards,
  getCardById,
  decksForCard,
} from "@/server/skillsData";
import CardDetail from "@/card/CardDetail";

// Only the mirrorKey-deduped (claude-variant) ids get a page. dynamicParams=false
// makes every other id — codex mirror variants and unknown ids alike — 404
// instead of rendering an on-demand duplicate-content page, so the indexed
// surface is exactly the deduped set generateStaticParams enumerates.
export const dynamicParams = false;

export function generateStaticParams() {
  const data = loadSkillsData();
  return dedupeCards(data.skills).map((skill) => ({ id: skill.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const skill = getCardById(loadSkillsData(), id);
  if (!skill) return { title: "Card not found" };
  return {
    title: `${skill.title} — Skill Card`,
    description: skill.description,
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = loadSkillsData();
  const skill = getCardById(data, id);
  if (!skill) notFound();
  const decks = decksForCard(data, id);

  return (
    <main className="card-detail-page min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-300 mb-8 transition-colors"
        >
          ← Back to cards
        </Link>
        <CardDetail skill={skill} decks={decks} />
      </div>
    </main>
  );
}
