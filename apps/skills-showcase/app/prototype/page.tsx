"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LayoutGroup } from "framer-motion";
import { useSkillsData, getPackSkills, getGlobalSkills } from "@/hooks/useSkillsData";
import SealedPack, { type SealedPackHandle } from "@/components/SealedPack";
import PackOpener from "@/components/PackOpener";
import BottomSheet from "@/components/BottomSheet";
import { DebugProvider, useDebug } from "@/components/debug/DebugController";
import DebugPanel from "@/components/debug/DebugPanel";

const FEATURED_PACKS = ["global", "business-discovery", "devtool", "game"];

interface OpenPackState {
  packName: string;
  origin: { x: number; y: number };
}

export default function PrototypePage() {
  return (
    <DebugProvider>
      <PrototypeInner />
      <DebugPanel />
    </DebugProvider>
  );
}

function PrototypeInner() {
  const dbg = useDebug();
  const data = useSkillsData();
  const [openPack, setOpenPack] = useState<OpenPackState | null>(null);
  const [openedPacks, setOpenedPacks] = useState<Set<string>>(new Set());
  const [isClosing, setIsClosing] = useState(false);

  // Debug harness drives the first pack ("global") through the exact
  // production callbacks via this imperative handle.
  const targetPackRef = useRef<SealedPackHandle>(null);

  const handleOpen = useCallback((packName: string, origin: { x: number; y: number }) => {
    setOpenPack({ packName, origin });
    setOpenedPacks((prev) => {
      if (prev.has(packName)) return prev;
      const next = new Set(prev);
      next.add(packName);
      return next;
    });
  }, []);

  const handleTear = useCallback((packName: string) => {
    setOpenedPacks((prev) => {
      if (prev.has(packName)) return prev;
      const next = new Set(prev);
      next.add(packName);
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    dbg.mark("close-trigger");
    setIsClosing(true);
  }, [dbg]);

  const handleCollapseComplete = useCallback(() => {
    setIsClosing(false);
    setOpenPack(null);
  }, []);

  // Register imperative drivers for the debug panel.
  useEffect(() => {
    dbg.registerDrivers({
      openClick: () => targetPackRef.current?.openViaClick(),
      openTear: () => targetPackRef.current?.openViaTear(),
      close: () => handleClose(),
      reset: () => {
        setIsClosing(false);
        setOpenPack(null);
        setOpenedPacks(new Set());
        targetPackRef.current?.resetValues();
      },
    });
  }, [dbg, handleClose]);

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
          {packs.map((pack, index) => (
            <SealedPack
              key={pack.name}
              ref={index === 0 ? targetPackRef : undefined}
              debugTarget={index === 0}
              name={pack.name}
              skillCount={pack.skills.length}
              previewSkill={pack.skills[0] ?? null}
              onOpen={(origin) => handleOpen(pack.name, origin)}
              onTear={() => handleTear(pack.name)}
              autoOpenOnTear={openedPacks.size === 0}
              isOpened={openedPacks.has(pack.name)}
              isDrawerOpen={openPack?.packName === pack.name}
            />
          ))}
        </div>

        <BottomSheet isOpen={!!openPack} onClose={handleClose} dismissable={!isClosing}>
          {openPackData && (
            <PackOpener
              packName={openPackData.name}
              skills={openPackData.skills}
              origin={openPack!.origin}
              isClosing={isClosing}
              onCollapseComplete={handleCollapseComplete}
            />
          )}
        </BottomSheet>
      </LayoutGroup>
    </div>
  );
}
