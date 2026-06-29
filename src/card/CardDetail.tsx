"use client";

/*
 * CardDetail — the shared card-detail renderer behind both the indexed
 * /card/[id] standalone page and the @modal intercepting overlay. It pairs an
 * enlarged flip card (front CardFace / back the quick facts, mirroring
 * SkillCard at a larger scale) with an always-rendered stats panel carrying the
 * benchmark evidence and deck membership. Every fact lives in the DOM
 * regardless of flip state so the standalone page is fully indexable.
 */
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Tag, Terminal, FlaskConical } from "lucide-react";
import Link from "next/link";

import type { Skill } from "@/hooks/useSkillsData";
import CardFace, { getBenchmarkIndicator } from "@/components/CardFace";
import type { CardDeckRef } from "@/server/skillsData";

export default function CardDetail({
  skill,
  decks,
}: {
  skill: Skill;
  decks: CardDeckRef[];
}) {
  const [flipped, setFlipped] = useState(false);
  const reduceMotion = useReducedMotion();
  const badge = getBenchmarkIndicator(skill);
  const agents = skill.benchmarkEvidence?.agents ?? [];

  return (
    <div
      className="card-detail flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start"
      data-testid="card-detail"
      data-card-id={skill.id}
    >
      {/* Enlarged flip card — front CardFace, back the quick facts. */}
      <div
        className="perspective-[1000px] cursor-pointer shrink-0"
        style={{ width: 280, height: 392 }}
        role="button"
        tabIndex={0}
        aria-label={`Flip ${skill.title} card`}
        data-testid="card-detail-flip"
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div
            className="absolute inset-0 shadow-xl shadow-black/40"
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardFace skill={skill} className="rounded-2xl" />
          </div>

          <div
            className="absolute inset-0 rounded-2xl border border-zinc-300 dark:border-zinc-700/50 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 p-4 flex flex-col shadow-xl shadow-black/40"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{skill.title}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug mb-3 flex-1">{skill.description}</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-500">
                <span>Platform</span>
                <span className="text-zinc-700 dark:text-zinc-300">{skill.platform}</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-500">
                <span>Scope</span>
                <span className="text-zinc-700 dark:text-zinc-300">{skill.scope}</span>
              </div>
              {skill.pack && (
                <div className="flex justify-between text-zinc-500 dark:text-zinc-500">
                  <span>Pack</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{skill.pack}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500 dark:text-zinc-500">
                <span>Version</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">{skill.version}</span>
              </div>
            </div>
            <div className="mt-auto pt-2 border-t border-zinc-200 dark:border-zinc-700/30 flex flex-wrap gap-1">
              {skill.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 text-[10px] text-zinc-600 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded"
                >
                  <Tag size={8} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats panel — always in the DOM (indexable), independent of flip. */}
      <div className="card-detail-stats w-full max-w-md text-zinc-700 dark:text-zinc-300">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{skill.title}</h1>
          {badge && (
            <span
              className={`text-lg font-bold ${badge.color}`}
              data-testid="card-detail-grade"
              title="Benchmark grade"
            >
              {badge.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 mb-3">
          <Terminal size={12} />
          <span className="font-mono">{skill.command}</span>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{skill.description}</p>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-4">
          <Fact label="Type" value={skill.type} />
          <Fact label="Platform" value={skill.platform} />
          <Fact label="Scope" value={skill.scope} />
          <Fact label="Version" value={skill.version} mono />
          {skill.pack && <Fact label="Pack" value={skill.pack} />}
        </dl>

        {skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4" data-testid="card-detail-tags">
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded"
              >
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        )}

        <section className="mb-4" data-testid="card-detail-benchmark">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500 mb-2">
            <FlaskConical size={12} /> Benchmark
          </h2>
          {agents.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-500 text-left">
                  <th className="font-medium pb-1">Agent</th>
                  <th className="font-medium pb-1">Pass rate</th>
                  <th className="font-medium pb-1">Cost / run</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.agent} className="text-zinc-700 dark:text-zinc-300">
                    <td className="py-0.5 font-mono">{agent.agent}</td>
                    <td className="py-0.5">{agent.passRate}</td>
                    <td className="py-0.5">{agent.costPerRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-500">No benchmark evidence yet.</p>
          )}
        </section>

        <section data-testid="card-detail-decks">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500 mb-2">
            Part of decks
          </h2>
          {decks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {decks.map((deck) => (
                <Link
                  key={deck.slug}
                  href={`/deck/${deck.slug}`}
                  className="inline-flex items-center text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700/50 px-2 py-1 rounded transition-colors"
                  data-testid={`card-detail-deck-${deck.slug}`}
                >
                  {deck.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-500">Not part of any deck.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1">
      <dt className="text-zinc-500 dark:text-zinc-500">{label}</dt>
      <dd className={`text-zinc-700 dark:text-zinc-300 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
