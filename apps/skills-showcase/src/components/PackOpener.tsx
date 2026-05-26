"use client";

import { useRef, useLayoutEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import SkillCard from "./SkillCard";
import type { Skill } from "@/hooks/useSkillsData";

interface PackOpenerProps {
  skills: Skill[];
  packName: string;
  origin: { x: number; y: number };
}

export default function PackOpener({ skills, packName }: PackOpenerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fanOffsets, setFanOffsets] = useState<Array<{ x: number; y: number }> | null>(null);

  const rotations = useMemo(
    () => skills.map(() => -6 + Math.random() * 12),
    [skills]
  );

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || fanOffsets) return;
    const cards = Array.from(el.children) as HTMLElement[];
    if (cards.length < 2) return;
    const first = cards[0].getBoundingClientRect();
    setFanOffsets(
      cards.map((c) => {
        const r = c.getBoundingClientRect();
        return { x: first.left - r.left, y: first.top - r.top };
      })
    );
  }, [skills, fanOffsets]);

  return (
    <div className="relative pt-4 pb-4">
      <motion.h2
        className="text-center text-lg font-bold text-zinc-300 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {formatPackName(packName)}
      </motion.h2>

      <div ref={containerRef} className="flex flex-wrap justify-center gap-4 px-4 max-w-4xl mx-auto">
        {skills.map((skill, i) => {
          const isFirst = i === 0;

          if (isFirst) {
            return (
              <motion.div
                key={skill.id}
                layoutId={`pack-card-${packName}`}
                transition={{
                  layout: { type: "spring", stiffness: 200, damping: 25 },
                }}
              >
                <SkillCard skill={skill} />
              </motion.div>
            );
          }

          if (!fanOffsets) {
            return (
              <div
                key={skill.id}
                style={{ width: 180, height: 252, visibility: "hidden" }}
              />
            );
          }

          const offset = fanOffsets[i];
          const staggerDelay = 0.3 + Math.min(i, 12) * 0.04;

          return (
            <motion.div
              key={skill.id}
              initial={{
                x: offset.x,
                y: offset.y,
                opacity: 0,
                scale: 0.6,
                rotateZ: rotations[i],
              }}
              animate={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1,
                rotateZ: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 25,
                delay: staggerDelay,
              }}
            >
              <SkillCard skill={skill} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function formatPackName(name: string): string {
  if (name === "global") return "Global Skills";
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
