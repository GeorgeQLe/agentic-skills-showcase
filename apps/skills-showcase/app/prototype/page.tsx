"use client";

import { useState, useCallback } from "react";
import { LayoutGroup } from "framer-motion";
import { useSkillsData, getPackSkills, getGlobalSkills } from "@/hooks/useSkillsData";
import SealedPack from "@/components/SealedPack";
import PackOpener from "@/components/PackOpener";
import BottomSheet from "@/components/BottomSheet";

const FEATURED_PACKS = ["global", "business-discovery", "devtool", "game"];

interface OpenPackState {
  packName: string;
  origin: { x: number; y: number };
}

export default function PrototypePage() {
  const data = useSkillsData();
  const [openPack, setOpenPack] = useState<OpenPackState | null>(null);
  const [openedPacks, setOpenedPacks] = useState<Set<string>>(new Set());

  const handleOpen = useCallback((packName: string, origin: { x: number; y: number }) => {
    setOpenPack({ packName, origin });
    setOpenedPacks((prev) => {
      if (prev.has(packName)) return prev;
      const next = new Set(prev);
      next.add(packName);
      return next;
    });
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

  const openPackData = openPack
    ? packs.find((p) => p.name === openPack.packName)
    : null;

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
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {packs.map((pack) => (
            <SealedPack
              key={pack.name}
              name={pack.name}
              skillCount={pack.skills.length}
              previewSkill={pack.skills[0] ?? null}
              onOpen={(origin) => handleOpen(pack.name, origin)}
              isOpened={openedPacks.has(pack.name)}
              isDrawerOpen={openPack?.packName === pack.name}
            />
          ))}
        </div>

        <BottomSheet isOpen={!!openPack} onClose={handleClose}>
          {openPackData && (
            <PackOpener
              packName={openPackData.name}
              skills={openPackData.skills}
              origin={openPack!.origin}
            />
          )}
        </BottomSheet>
      </LayoutGroup>
    </div>
  );
}
