/*
 * Pack-opening prototype page - animation debug harness for the
 * sealed-pack tear / open / drawer sequence. Used to iterate on
 * motion timing and state transitions outside the production routes.
 */
"use client";

import { useRef, useEffect } from "react";
import { LayoutGroup } from "framer-motion";
import { useSkillsData } from "@/hooks/useSkillsData";
import { SETS, getSetSkills } from "@/deck-builder/decks";
import SealedPack, { type SealedPackHandle } from "@/components/SealedPack";
import { usePackFlow, PackFlowSheet } from "@/components/PackRitual";
import { DebugProvider, useDebug } from "@/components/debug/DebugController";
import DebugPanel from "@/components/debug/DebugPanel";

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
  const flow = usePackFlow();
  const {
    phase,
    activePack,
    openedPacks,
    isSheetOpen,
    drawerIsClosing,
    canDismiss,
    handleClose,
    setPhase,
    setActivePack,
    setOpenedPacks,
    setOpenMorphComplete,
  } = flow;

  const headerRef = useRef<HTMLElement>(null);

  // Debug harness drives set index 0 ("Market Intel") through the exact
  // production callbacks via this imperative handle.
  const targetPackRef = useRef<SealedPackHandle>(null);

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
  }, [dbg, handleClose, setPhase, setActivePack, setOpenedPacks, setOpenMorphComplete]);

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
                onOpeningApex={flow.handleOpeningApex}
                onOpen={(origin) => flow.handleOpen(set.slug, origin)}
                onTear={() => flow.handleTear(set.slug)}
                onCardSettleComplete={flow.handleCardSettleComplete}
                apexAlignRef={isActiveSet ? headerRef : undefined}
                autoOpenOnTear
                isOpened={openedPacks.has(set.slug)}
                isDrawerOpen={isDrawerResident}
                flowPhase={isActiveSet ? phase : "sealed"}
              />
            );
          })}
        </div>

        <PackFlowSheet
          flow={flow}
          packName={activeSetData?.name ?? ""}
          skills={activeSetData?.skills ?? []}
        />
      </LayoutGroup>
    </div>
  );
}
