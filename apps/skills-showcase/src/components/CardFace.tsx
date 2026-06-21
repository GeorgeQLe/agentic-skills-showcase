import { Terminal, FlaskConical } from "lucide-react";
import type { Skill } from "@/hooks/useSkillsData";

const typeColors: Record<string, string> = {
  analysis: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  research: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  generation: "bg-green-500/20 text-green-700 dark:text-green-300",
  workflow: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  automation: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  review: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  planning: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
};

export function getBenchmarkIndicator(skill: Skill) {
  const evidence = skill.benchmarkEvidence;
  if (!evidence) return null;
  const best = evidence.agents.reduce(
    (max, a) => (a.passRatePercent > max.passRatePercent ? a : max),
    evidence.agents[0]
  );
  if (!best) return null;
  // Grading thresholds are UX decisions (not statistical boundaries):
  // 80%+ = A (green), 50-79% = B (yellow), below 50% = C (red).
  const pct = best.passRatePercent;
  if (pct >= 80) return { label: "A", color: "text-emerald-600 dark:text-emerald-400" };
  if (pct >= 50) return { label: "B", color: "text-amber-600 dark:text-amber-400" };
  return { label: "C", color: "text-red-600 dark:text-red-400" };
}

export default function CardFace({ skill, className = "rounded-xl" }: { skill: Skill; className?: string }) {
  const badge = getBenchmarkIndicator(skill);
  const typeClass = typeColors[skill.type] || "bg-zinc-500/20 text-zinc-700 dark:text-zinc-300";

  return (
    <div
      className={`${className} border border-zinc-300 dark:border-zinc-700/50 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 p-3 flex flex-col h-full`}
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

      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight mb-1">
        {skill.title}
      </h3>

      <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-500 mb-2">
        <Terminal size={10} />
        <span className="font-mono">{skill.command}</span>
      </div>

      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug flex-1 line-clamp-3">
        {skill.description}
      </p>

      <div className="mt-auto pt-2 border-t border-zinc-200 dark:border-zinc-700/30 flex items-center justify-between">
        <span className="text-[9px] text-zinc-500 dark:text-zinc-600 font-mono">{skill.version}</span>
        {skill.benchmarkEvidence && (
          <FlaskConical size={10} className="text-zinc-500 dark:text-zinc-600" />
        )}
      </div>
    </div>
  );
}
