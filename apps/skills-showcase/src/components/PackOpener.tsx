"use client";

import { motion, AnimatePresence } from "framer-motion";
import SkillCard from "./SkillCard";
import type { Skill } from "@/hooks/useSkillsData";

interface PackOpenerProps {
  skills: Skill[];
  packName: string;
  isOpen: boolean;
}

export default function PackOpener({ skills, packName, isOpen }: PackOpenerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden"
        >
          <div className="relative pt-8 pb-4">
            {/* Pack name label */}
            <motion.h2
              className="text-center text-lg font-bold text-zinc-300 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {formatPackName(packName)}
            </motion.h2>

            {/* Card grid */}
            <div className="flex flex-wrap justify-center gap-4 px-4 max-w-4xl mx-auto">
              {skills.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 40, rotateZ: -5 + Math.random() * 10 }}
                  animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.15 + i * 0.08,
                  }}
                >
                  <SkillCard skill={skill} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatPackName(name: string): string {
  if (name === "global") return "Global Skills";
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
