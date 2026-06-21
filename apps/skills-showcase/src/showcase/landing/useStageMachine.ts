"use client";

/**
 * useStageMachine — the staged-journey controller for the landing (landing
 * redesign Phase 3). The journey is three full-screen stages:
 *
 *   1 SELECT  pick a project/goal (→ a starter deck)
 *   2 OPEN    tear the selected deck's domain pack allotment
 *   3 BUILD   the deck table (always mounted; visibility-toggled)
 *
 * The machine owns `stage` + `selectedDeckSlug` and derives the selected deck,
 * its domain allotment, and its phases. Transitions that leave SELECT reset the
 * PackFlow ritual (exactly as the former `pick()` did) so a freshly selected
 * project always opens from sealed.
 *
 * Contract note: this hook NEVER unmounts the build stage — stage 3 is reached
 * by toggling visibility on an always-rendered <BuildStage/>, preserving the
 * deck-routing morph + stable mount id. The machine only flips `stage`.
 */

import { useCallback, useMemo, useState } from "react";

import type { GeneratedDeck, GeneratedPhase } from "@/hooks/useSkillsData";
import type { DomainOption, PackCard } from "./types";

export type Stage = 1 | 2 | 3;

/** Stable PackFlow setters used to reset the ritual on (re)select. */
interface FlowReset {
  setActivePack: (pack: null) => void;
  setPhase: (phase: "sealed") => void;
  setOpenedPacks: (packs: Set<string>) => void;
}

export interface StageMachine {
  stage: Stage;
  selectedDeckSlug: string | null;
  selectedDeck: GeneratedDeck | null;
  domain: DomainOption | null;
  /** The selected deck's domain pack allotment (sealed packs to open). */
  allotment: PackCard[];
  /** The selected deck's phases (drives the Stage 2 workflow ribbon). */
  phases: GeneratedPhase[];
  selectProject: (slug: string) => void;
  goToBuild: () => void;
  back: () => void;
  restart: () => void;
}

export function useStageMachine({
  domains,
  deckBySlug,
  flow,
}: {
  domains: DomainOption[];
  deckBySlug: Map<string, GeneratedDeck>;
  flow: FlowReset;
}): StageMachine {
  const [stage, setStage] = useState<Stage>(1);
  const [selectedDeckSlug, setSelectedDeckSlug] = useState<string | null>(null);

  const { setActivePack, setPhase, setOpenedPacks } = flow;

  const selectedDeck = selectedDeckSlug
    ? deckBySlug.get(selectedDeckSlug) ?? null
    : null;

  const domain = useMemo(
    () =>
      selectedDeck
        ? domains.find((d) => d.domain === selectedDeck.domain) ?? null
        : null,
    [domains, selectedDeck],
  );

  const allotment: PackCard[] = domain?.packs ?? [];
  const phases: GeneratedPhase[] = selectedDeck?.phases ?? [];

  const resetFlow = useCallback(() => {
    setActivePack(null);
    setPhase("sealed");
    setOpenedPacks(new Set());
  }, [setActivePack, setPhase, setOpenedPacks]);

  const selectProject = useCallback(
    (slug: string) => {
      setSelectedDeckSlug(slug);
      resetFlow();
      setStage(2);
    },
    [resetFlow],
  );

  const goToBuild = useCallback(() => setStage(3), []);

  const back = useCallback(() => {
    setStage((s) => (s === 3 ? 2 : 1));
  }, []);

  const restart = useCallback(() => {
    setSelectedDeckSlug(null);
    resetFlow();
    setStage(1);
  }, [resetFlow]);

  return {
    stage,
    selectedDeckSlug,
    selectedDeck,
    domain,
    allotment,
    phases,
    selectProject,
    goToBuild,
    back,
    restart,
  };
}
