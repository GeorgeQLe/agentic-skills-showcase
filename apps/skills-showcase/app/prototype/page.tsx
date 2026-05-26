"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useSkillsData, getPackSkills, getGlobalSkills } from "@/hooks/useSkillsData";
import SealedPack from "@/components/SealedPack";
import PackOpener from "@/components/PackOpener";

const FEATURED_PACKS = ["global", "business-discovery", "devtool", "game"];

interface OpenPackState {
  packName: string;
  origin: { x: number; y: number };
}

export default function PrototypePage() {
  const data = useSkillsData();
  const [openPack, setOpenPack] = useState<OpenPackState | null>(null);

  const handleOpen = useCallback((packName: string, origin: { x: number; y: number }) => {
    setOpenPack({ packName, origin });
  }, []);

  const handleClose = useCallback(() => {
    setOpenPack(null);
  }, []);

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0f0f13] flex items-center justify-center min-h-screen">
        <p className="text-zinc-500 animate-pulse">Loading skills...</p>
      </div>
    );
  }

  const packs = FEATURED_PACKS.map((name) => {
    const skills =
      name === "global"
        ? getGlobalSkills(data.skills).slice(0, 20)
        : getPackSkills(data.skills, name);
    return { name, skills };
  }).filter((p) => p.skills.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f0f13] overflow-auto min-h-screen py-16 px-4">
      <header className="text-center mb-16">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          Skill Card Packs
        </h1>
        <p className="text-zinc-500 text-sm">
          Tear along the line to open a pack
        </p>
      </header>

      <LayoutGroup>
        <AnimatePresence mode="sync">
          {!openPack && (
            <motion.div
              key="sealed-packs"
              className="flex flex-wrap justify-center gap-6 mb-12"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {packs.map((pack) => (
                <SealedPack
                  key={pack.name}
                  name={pack.name}
                  skillCount={pack.skills.length}
                  previews={pack.skills.slice(0, 3).map((s) => ({ title: s.title, type: s.type }))}
                  onOpen={(origin) => handleOpen(pack.name, origin)}
                />
              ))}
            </motion.div>
          )}

          {openPack && (
            <motion.div
              key="opened-pack"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-center mb-6">
                <motion.button
                  onClick={handleClose}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-700 rounded-lg px-4 py-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  &larr; Back to packs
                </motion.button>
              </div>
              {packs
                .filter((pack) => pack.name === openPack.packName)
                .map((pack) => (
                  <PackOpener
                    key={pack.name}
                    packName={pack.name}
                    skills={pack.skills}
                    origin={openPack.origin}
                    isOpen
                  />
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
