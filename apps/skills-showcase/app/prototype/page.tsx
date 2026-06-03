/*
 * Pack-opening prototype page - animation debug harness for the
 * sealed-pack tear / open / drawer sequence. Used to iterate on
 * motion timing and state transitions outside the production routes.
 */
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

type PackFlowPhase =
  | "sealed"
  | "opening-apex"
  | "drawer-open"
  | "closing-collapse"
  | "sheet-exiting"
  | "layout-morph-out"
  | "drop-elevation";

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
  const debugReport = dbg.report;
  const data = useSkillsData();
  const [activePack, setActivePack] = useState<OpenPackState | null>(null);
  const [openedPacks, setOpenedPacks] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<PackFlowPhase>("sealed");

  const isSheetOpen = phase === "drawer-open" || phase === "closing-collapse";
  const drawerIsClosing = phase === "closing-collapse";
  const canDismiss = phase === "drawer-open";

  // Debug harness drives pack index 0 ("global") through the exact
  // production callbacks via this imperative handle. Index 0 is the
  // canonical test target so every debug session starts deterministic.
  const targetPackRef = useRef<SealedPackHandle>(null);

  const handleOpeningApex = useCallback(() => {
    setPhase((current) => (current === "sealed" ? "opening-apex" : current));
  }, []);

  const handleOpen = useCallback((packName: string, origin: { x: number; y: number }) => {
    const nextActivePack = { packName, origin };
    setActivePack(nextActivePack);
    setPhase("drawer-open");
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
    if (phase !== "drawer-open") return;
    dbg.mark("close-trigger");
    setPhase("closing-collapse");
  }, [dbg, phase]);

  const handleCollapseComplete = useCallback(() => {
    dbg.mark("drawer-teardown");
    setPhase("sheet-exiting");
  }, [dbg]);

  const handleSheetExited = useCallback(() => {
    setPhase((current) =>
      current === "sheet-exiting" ? "layout-morph-out" : current
    );
  }, []);

  const handleCloseMorphComplete = useCallback(() => {
    setPhase((current) =>
      current === "layout-morph-out" ? "drop-elevation" : current
    );
  }, []);

  const handleDropElevationComplete = useCallback(() => {
    setActivePack(null);
    setPhase("sealed");
  }, []);

  // Register imperative drivers for the debug panel.
  useEffect(() => {
    dbg.registerDrivers({
      openClick: () => targetPackRef.current?.openViaClick(),
      openTear: () => targetPackRef.current?.openViaTear(),
      close: () => handleClose(),
      reset: () => {
        setPhase("sealed");
        setActivePack(null);
        setOpenedPacks(new Set());
        targetPackRef.current?.resetValues();
      },
    });
  }, [dbg, handleClose]);

  useEffect(() => {
    debugReport({
      machine: {
        page: {
          phase,
          activePack: activePack?.packName ?? null,
          openedPacks: [...openedPacks],
          isSheetOpen,
          isDrawerClosing: drawerIsClosing,
          canDismiss,
        },
      },
    });
  }, [debugReport, activePack, openedPacks, phase, isSheetOpen, drawerIsClosing, canDismiss]);

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

  const activePackData = activePack
    ? packs.find((p) => p.name === activePack.packName)
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

      {/* LayoutGroup scopes framer-motion's shared layout animations (layoutId
          morphs) so packs don't interfere with each other during transitions. */}
      <LayoutGroup>
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {packs.map((pack, index) => {
            const isActivePack = activePack?.packName === pack.name;
            const isDrawerResident =
              isActivePack &&
              (phase === "drawer-open" ||
                phase === "closing-collapse" ||
                phase === "sheet-exiting");

            return (
              <SealedPack
                key={pack.name}
                ref={index === 0 ? targetPackRef : undefined}
                debugTarget={index === 0}
                name={pack.name}
                skillCount={pack.skills.length}
                previewSkill={pack.skills[0] ?? null}
                onOpeningApex={handleOpeningApex}
                onOpen={(origin) => handleOpen(pack.name, origin)}
                onTear={() => handleTear(pack.name)}
                onCloseMorphComplete={handleCloseMorphComplete}
                onDropElevationComplete={handleDropElevationComplete}
                autoOpenOnTear={openedPacks.size === 0}
                isOpened={openedPacks.has(pack.name)}
                isDrawerOpen={isDrawerResident}
                flowPhase={isActivePack ? phase : "sealed"}
              />
            );
          })}
        </div>

        <BottomSheet
          isOpen={isSheetOpen}
          onClose={handleClose}
          onExitComplete={handleSheetExited}
          dismissable={canDismiss}
        >
          {activePackData && (
            <PackOpener
              packName={activePackData.name}
              skills={activePackData.skills}
              origin={activePack!.origin}
              isClosing={drawerIsClosing}
              onCollapseComplete={handleCollapseComplete}
            />
          )}
        </BottomSheet>
      </LayoutGroup>
    </div>
  );
}
