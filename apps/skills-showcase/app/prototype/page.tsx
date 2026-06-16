/*
 * Pack-opening prototype page - animation debug harness for the
 * sealed-pack tear / open / drawer sequence. Used to iterate on
 * motion timing and state transitions outside the production routes.
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LayoutGroup } from "framer-motion";
import { useSkillsData } from "@/hooks/useSkillsData";
import { SETS, getSetSkills } from "@/deck-builder/decks";
import SealedPack, { type SealedPackHandle } from "@/components/SealedPack";
import PackOpener from "@/components/PackOpener";
import BottomSheet from "@/components/BottomSheet";
import { DebugProvider, useDebug } from "@/components/debug/DebugController";
import DebugPanel from "@/components/debug/DebugPanel";

interface OpenPackState {
  packName: string;
  origin: { x: number; y: number };
}

type PackFlowPhase =
  | "sealed"
  | "opening-apex"
  | "drawer-open"
  | "closing-collapse"
  | "closing-apex"
  | "sheet-exiting"
  | "card-settling";

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
  const [openMorphComplete, setOpenMorphComplete] = useState(true);

  const headerRef = useRef<HTMLElement>(null);
  const isSheetOpen = phase === "drawer-open" || phase === "closing-collapse" || phase === "closing-apex";
  const drawerIsClosing = phase === "closing-collapse" || phase === "closing-apex";
  const isRisingToApex = phase === "closing-apex";
  const canDismiss = phase === "drawer-open";

  // Debug harness drives set index 0 ("Market Intel") through the exact
  // production callbacks via this imperative handle.
  const targetPackRef = useRef<SealedPackHandle>(null);

  const handleOpeningApex = useCallback(() => {
    setPhase((current) => (current === "sealed" ? "opening-apex" : current));
  }, []);

  const handleOpen = useCallback((packName: string, origin: { x: number; y: number }) => {
    const nextActivePack = { packName, origin };
    setActivePack(nextActivePack);
    setPhase("drawer-open");
    setOpenMorphComplete(false);
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
    setPhase(current => current === "closing-collapse" ? "closing-apex" : current);
  }, [dbg]);

  const handleApexComplete = useCallback(() => {
    setPhase(current => current === "closing-apex" ? "sheet-exiting" : current);
  }, []);

  const handleSheetExited = useCallback(() => {
    setPhase(current => current === "sheet-exiting" ? "card-settling" : current);
  }, []);

  const handleCardSettleComplete = useCallback(() => {
    setActivePack(null);
    setPhase("sealed");
  }, []);

  const handleOpenMorphComplete = useCallback(() => {
    setOpenMorphComplete(true);
  }, []);

  useEffect(() => {
    if (phase === "card-settling") {
      const timeout = setTimeout(() => {
        setActivePack(null);
        setPhase(current => current === "card-settling" ? "sealed" : current);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

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
        setOpenMorphComplete(true);
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

  const sets = SETS.map((set) => ({
    ...set,
    skills: getSetSkills(data.skills, set),
  })).filter((s) => s.skills.length > 0);

  const activeSetData = activePack
    ? sets.find((s) => s.slug === activePack.packName)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f0f13] overflow-auto min-h-screen py-16 px-4">
      <header ref={headerRef} className="text-center mb-16">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          Skill Collection
        </h1>
        <p className="text-zinc-500 text-sm">
          {data.skillCount} skills across {SETS.length} sets &mdash; tear along the line to open
        </p>
      </header>

      {/* LayoutGroup scopes framer-motion's shared layout animations (layoutId
          morphs) so packs don't interfere with each other during transitions. */}
      <LayoutGroup>
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {sets.map((set, index) => {
            const isActiveSet = activePack?.packName === set.slug;
            const isDrawerResident =
              isActiveSet &&
              (phase === "drawer-open" ||
                phase === "closing-collapse" ||
                phase === "closing-apex");

            return (
              <SealedPack
                key={set.slug}
                ref={index === 0 ? targetPackRef : undefined}
                debugTarget={index === 0}
                name={set.slug}
                skillCount={set.skills.length}
                previewSkill={set.skills[0] ?? null}
                onOpeningApex={handleOpeningApex}
                onOpen={(origin) => handleOpen(set.slug, origin)}
                onTear={() => handleTear(set.slug)}
                onCardSettleComplete={handleCardSettleComplete}
                apexAlignRef={isActiveSet ? headerRef : undefined}
                autoOpenOnTear
                isOpened={openedPacks.has(set.slug)}
                isDrawerOpen={isDrawerResident}
                flowPhase={isActiveSet ? phase : "sealed"}
              />
            );
          })}
        </div>

        <BottomSheet
          isOpen={isSheetOpen}
          onClose={handleClose}
          onExitComplete={handleSheetExited}
          dismissable={canDismiss}
          unclipContent={isRisingToApex || (phase === "drawer-open" && !openMorphComplete)}
          fadeExit={phase === "sheet-exiting"}
        >
          {activeSetData && (
            <PackOpener
              packName={activeSetData.name}
              skills={activeSetData.skills}
              origin={activePack!.origin}
              isClosing={drawerIsClosing}
              onCollapseComplete={handleCollapseComplete}
              isRisingToApex={isRisingToApex}
              onApexComplete={handleApexComplete}
              onOpenMorphComplete={handleOpenMorphComplete}
            />
          )}
        </BottomSheet>
      </LayoutGroup>
    </div>
  );
}
