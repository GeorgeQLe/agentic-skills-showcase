/*
 * PackRitual — the single source of truth for the tear-open booster-pack
 * ritual. It owns the `PackFlowPhase` state machine and the
 * SealedPack→BottomSheet→PackOpener composition that the running app used to
 * duplicate verbatim in two places (`PrototypeInner` in app/prototype/page.tsx
 * and `BuilderPackFlow` in src/deck-builder/DeckTableShell.tsx). Both forks now
 * consume `usePackFlow()` (the machine) and `<PackFlowSheet>` (the drawer
 * composition); each keeps only its own topology — the prototype's N-pack shelf
 * + debug harness, the builder's single deck-as-pack + card-flight wiring.
 *
 * Animation plan reference: §C lifecycle ownership. This is a pure refactor —
 * the machine, the derived flags, the 800 ms card-settling fallback, and the
 * sheet wiring are byte-for-byte the behavior both forks shipped; only their
 * home moved.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import PackOpener from "@/components/PackOpener";
import { useDebug } from "@/components/debug/DebugController";
import type { Skill } from "@/hooks/useSkillsData";

/**
 * PackFlowPhase — the tear-open booster-pack ritual machine. `sealed` is the
 * resting state; the chain `opening-apex → drawer-open` opens the fan and
 * `closing-collapse → closing-apex → sheet-exiting → card-settling` collapses
 * it back to rest.
 */
export type PackFlowPhase =
  | "sealed"
  | "opening-apex"
  | "drawer-open"
  | "closing-collapse"
  | "closing-apex"
  | "sheet-exiting"
  | "card-settling";

export interface ActivePack {
  /** Which pack is fanned open — the prototype keys its shelf by this slug. */
  packName: string;
  origin: { x: number; y: number };
}

export type PackFlow = ReturnType<typeof usePackFlow>;

/**
 * usePackFlow — owns the PackFlowPhase machine, the derived sheet flags, the
 * card-settling fallback, and the openedPacks set. Debug marks are emitted via
 * a ref so the handler identities stay stable (the DebugController's context
 * value changes identity on every mark()/report(), which would otherwise churn
 * every handler each frame).
 */
export function usePackFlow() {
  const dbg = useDebug();
  const dbgRef = useRef(dbg);
  dbgRef.current = dbg;

  const [activePack, setActivePack] = useState<ActivePack | null>(null);
  const [openedPacks, setOpenedPacks] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<PackFlowPhase>("sealed");
  const [openMorphComplete, setOpenMorphComplete] = useState(true);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const isSheetOpen =
    phase === "drawer-open" || phase === "closing-collapse" || phase === "closing-apex";
  const drawerIsClosing = phase === "closing-collapse" || phase === "closing-apex";
  const isRisingToApex = phase === "closing-apex";
  const canDismiss = phase === "drawer-open";

  const addOpened = useCallback((packName: string) => {
    setOpenedPacks((prev) => {
      if (prev.has(packName)) return prev;
      const next = new Set(prev);
      next.add(packName);
      return next;
    });
  }, []);

  const handleOpeningApex = useCallback(() => {
    setPhase((current) => (current === "sealed" ? "opening-apex" : current));
  }, []);

  const handleOpen = useCallback(
    (packName: string, origin: { x: number; y: number }) => {
      setActivePack({ packName, origin });
      setPhase("drawer-open");
      setOpenMorphComplete(false);
      addOpened(packName);
    },
    [addOpened],
  );

  const handleTear = useCallback(
    (packName: string) => {
      addOpened(packName);
    },
    [addOpened],
  );

  const handleClose = useCallback(() => {
    if (phaseRef.current !== "drawer-open") return;
    dbgRef.current.mark("close-trigger");
    setPhase("closing-collapse");
  }, []);

  const handleCollapseComplete = useCallback(() => {
    dbgRef.current.mark("drawer-teardown");
    setPhase((current) => (current === "closing-collapse" ? "closing-apex" : current));
  }, []);

  const handleApexComplete = useCallback(() => {
    setPhase((current) => (current === "closing-apex" ? "sheet-exiting" : current));
  }, []);

  const handleSheetExited = useCallback(() => {
    setPhase((current) => (current === "sheet-exiting" ? "card-settling" : current));
  }, []);

  const handleCardSettleComplete = useCallback(() => {
    setActivePack(null);
    setPhase("sealed");
  }, []);

  const handleOpenMorphComplete = useCallback(() => {
    setOpenMorphComplete(true);
  }, []);

  // card-settling fallback: if the SealedPack's settle callback never fires
  // (e.g. jsdom never animates), park back to sealed after a beat (§C).
  useEffect(() => {
    if (phase === "card-settling") {
      const timeout = setTimeout(() => {
        setActivePack(null);
        setPhase((current) => (current === "card-settling" ? "sealed" : current));
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  return {
    phase,
    phaseRef,
    setPhase,
    activePack,
    setActivePack,
    openedPacks,
    setOpenedPacks,
    openMorphComplete,
    setOpenMorphComplete,
    isSheetOpen,
    drawerIsClosing,
    isRisingToApex,
    canDismiss,
    handleOpeningApex,
    handleOpen,
    handleTear,
    handleClose,
    handleCollapseComplete,
    handleApexComplete,
    handleSheetExited,
    handleCardSettleComplete,
    handleOpenMorphComplete,
  };
}

/**
 * PackFlowSheet — the BottomSheet→PackOpener half of the ritual, driven by a
 * `usePackFlow()` instance. When no pack is active the sheet renders closed and
 * empty; when a pack is fanned the active pack's name/skills feed PackOpener.
 * The collect/wanted props are optional: absent → standalone inspect mode
 * (tap = flip, the /prototype behavior); present → card-flight source (the
 * builder behavior).
 */
export function PackFlowSheet({
  flow,
  packName,
  skills,
  onCollect,
  collectedIds,
  wantedIds,
  onCollectAll,
  onExpand,
  disableSharedMorph,
}: {
  flow: PackFlow;
  packName: string;
  skills: Skill[];
  onCollect?: (skill: Skill, sourceEl: HTMLElement | null) => void;
  collectedIds?: Set<string>;
  wantedIds?: Set<string>;
  onCollectAll?: (sources: Map<string, HTMLElement>) => void;
  onExpand?: (id: string) => void;
  disableSharedMorph?: boolean;
}) {
  const {
    phase,
    activePack,
    openMorphComplete,
    isSheetOpen,
    drawerIsClosing,
    isRisingToApex,
    canDismiss,
    handleClose,
    handleSheetExited,
    handleCollapseComplete,
    handleApexComplete,
    handleOpenMorphComplete,
  } = flow;

  return (
    <BottomSheet
      isOpen={isSheetOpen}
      onClose={handleClose}
      onExitComplete={handleSheetExited}
      dismissable={canDismiss}
      unclipContent={isRisingToApex || (phase === "drawer-open" && !openMorphComplete)}
      fadeExit={phase === "sheet-exiting"}
    >
      {activePack && (
        <PackOpener
          packName={packName}
          skills={skills}
          origin={activePack.origin}
          isClosing={drawerIsClosing}
          onCollapseComplete={handleCollapseComplete}
          isRisingToApex={isRisingToApex}
          onApexComplete={handleApexComplete}
          onOpenMorphComplete={handleOpenMorphComplete}
          onCollect={onCollect}
          collectedIds={collectedIds}
          wantedIds={wantedIds}
          onCollectAll={onCollectAll}
          onExpand={onExpand}
          disableSharedMorph={disableSharedMorph}
        />
      )}
    </BottomSheet>
  );
}
