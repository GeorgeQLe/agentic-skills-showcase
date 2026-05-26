"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import SkillCard from "./SkillCard";
import type { Skill } from "@/hooks/useSkillsData";

interface PackOpenerProps {
  skills: Skill[];
  packName: string;
  origin: { x: number; y: number };
}

export default function PackOpener({ skills, packName }: PackOpenerProps) {
  const rotations = useMemo(
    () => skills.map(() => -8 + Math.random() * 16),
    [skills]
  );

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

      <div className="flex flex-wrap justify-center gap-4 px-4 max-w-4xl mx-auto">
        {skills.map((skill, i) => {
          const isFirst = i === 0;
          const staggerDelay = Math.min(i, 12) * 0.07;

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

          return (
            <motion.div
              key={skill.id}
              initial={{
                opacity: 0,
                scale: 0.15,
                y: 100,
                rotateZ: rotations[i],
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                rotateZ: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
                delay: 0.3 + staggerDelay,
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
