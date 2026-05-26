"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import type { Skill } from "@/hooks/useSkillsData";
import CardFace from "./CardFace";

export default function SkillCard({ skill }: { skill: Skill }) {
  const [flipped, setFlipped] = useState(false);

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
          className="absolute inset-0 shadow-lg shadow-black/30"
          style={{ backfaceVisibility: "hidden" }}
        >
          <CardFace skill={skill} className="rounded-xl" />
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
