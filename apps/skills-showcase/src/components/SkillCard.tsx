"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, FlaskConical, Tag } from "lucide-react";
import type { Skill } from "@/hooks/useSkillsData";

const typeColors: Record<string, string> = {
  analysis: "bg-blue-500/20 text-blue-300",
  research: "bg-purple-500/20 text-purple-300",
  generation: "bg-green-500/20 text-green-300",
  workflow: "bg-amber-500/20 text-amber-300",
  automation: "bg-cyan-500/20 text-cyan-300",
  review: "bg-rose-500/20 text-rose-300",
  planning: "bg-orange-500/20 text-orange-300",
};

function getBenchmarkIndicator(skill: Skill) {
  const evidence = skill.benchmarkEvidence;
  if (!evidence) return null;
  const best = evidence.agents.reduce(
    (max, a) => (a.passRatePercent > max.passRatePercent ? a : max),
    evidence.agents[0]
  );
  if (!best) return null;
  const pct = best.passRatePercent;
  if (pct >= 80) return { label: "A", color: "text-emerald-400" };
  if (pct >= 50) return { label: "B", color: "text-amber-400" };
  return { label: "C", color: "text-red-400" };
}

export default function SkillCard({ skill }: { skill: Skill }) {
  const [flipped, setFlipped] = useState(false);
  const badge = getBenchmarkIndicator(skill);
  const typeClass = typeColors[skill.type] || "bg-zinc-500/20 text-zinc-300";

  return (
    <div
      className="perspective-[800px] cursor-pointer"
      style={{ width: 180, height: 252 }}
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800 to-zinc-900 p-3 flex flex-col shadow-lg shadow-black/30"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-start justify-between mb-2">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${typeClass}`}>
              {skill.type}
            </span>
            {badge && (
              <span className={`text-xs font-bold ${badge.color}`}>
                {badge.label}
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-zinc-100 leading-tight mb-1">
            {skill.title}
          </h3>

          <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-2">
            <Terminal size={10} />
            <span className="font-mono">{skill.command}</span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-snug flex-1 line-clamp-3">
            {skill.description}
          </p>

          <div className="mt-auto pt-2 border-t border-zinc-700/30 flex items-center justify-between">
            <span className="text-[9px] text-zinc-600 font-mono">{skill.version}</span>
            {skill.benchmarkEvidence && (
              <FlaskConical size={10} className="text-zinc-600" />
            )}
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900 to-zinc-800 p-3 flex flex-col shadow-lg shadow-black/30"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <h3 className="text-sm font-semibold text-zinc-100 mb-2">
            {skill.title}
          </h3>

          <p className="text-[11px] text-zinc-400 leading-snug mb-3 flex-1">
            {skill.description}
          </p>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between text-zinc-500">
              <span>Platform</span>
              <span className="text-zinc-300">{skill.platform}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Scope</span>
              <span className="text-zinc-300">{skill.scope}</span>
            </div>
            {skill.pack && (
              <div className="flex justify-between text-zinc-500">
                <span>Pack</span>
                <span className="text-zinc-300">{skill.pack}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-500">
              <span>Version</span>
              <span className="text-zinc-300 font-mono">{skill.version}</span>
            </div>
            {skill.benchmarkEvidence && (
              <div className="flex justify-between text-zinc-500">
                <span>Benchmark</span>
                <span className="text-zinc-300">
                  {skill.benchmarkEvidence.agents[0]?.passRate || "N/A"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-2 border-t border-zinc-700/30 flex flex-wrap gap-1">
            {skill.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[9px] text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded"
              >
                <Tag size={7} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
