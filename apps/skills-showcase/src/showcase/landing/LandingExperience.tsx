"use client";

/*
 * LandingExperience — the pack-first front door (`/`), redesigned into a guided
 * three-stage journey (landing redesign):
 *
 *   Stage 1 SELECT  pick a project/goal → its starter deck
 *   Stage 2 OPEN    tear that deck's domain pack allotment (inspect mode) +
 *                   a workflow ribbon hinting where the cards belong
 *   Stage 3 BUILD   the deck blueprint table (DeckDebugHarness → DeckTableShell)
 *
 * Stages 1 and 2 mount/unmount through <AnimatePresence>; Stage 3 is the
 * always-mounted <BuildStage/> whose visibility is toggled. This is the load-
 * bearing structural rule: DeckTableShell must mount exactly once and never
 * remount so the /deck/[slug] pushState morph and the stable deck-mount-id
 * (locked by e2e/deck-table-shell.spec.ts) survive every stage change. The
 * pack-flow hook and the harness mount therefore live at the controller level,
 * persisting across stage transitions.
 *
 * Scope note: Stage 2 inspect mode collects nothing — tapping a fanned card just
 * flips it. Collection is a builder-only behavior reached at Stage 3.
 */

import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useSkillsData, type GeneratedDeck, type Skill } from "@/hooks/useSkillsData";
import { usePackFlow } from "@/components/PackRitual";

import type { DomainOption, PackCard } from "./types";
import { useStageMachine } from "./useStageMachine";
import { DOMAIN_META, DOMAIN_ORDER } from "./projectMeta";
import StageProgress from "./StageProgress";
import SelectStage from "./SelectStage";
import OpenStage from "./OpenStage";
import BuildStage from "./BuildStage";

function prettyPackName(name: string): string {
  return name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function LandingExperience() {
  const data = useSkillsData();

  const domains = useMemo<DomainOption[]>(() => {
    if (!data) return [];
    const skillsByPack = new Map<string, Skill[]>();
    for (const skill of data.skills) {
      if (!skill.pack) continue;
      const list = skillsByPack.get(skill.pack);
      if (list) list.push(skill);
      else skillsByPack.set(skill.pack, [skill]);
    }
    const deckBySlug = new Map(data.decks.map((d) => [d.slug, d]));

    const options = data.sets.map((set) => {
      const packs: PackCard[] = set.packs
        .map((pack) => ({
          slug: pack,
          name: prettyPackName(pack),
          skills: skillsByPack.get(pack) ?? [],
        }))
        .filter((p) => p.skills.length > 0);
      const skillCount = packs.reduce((sum, p) => sum + p.skills.length, 0);
      const decks = set.decks
        .map((slug) => deckBySlug.get(slug))
        .filter((d): d is NonNullable<typeof d> => Boolean(d))
        .map((d) => ({ slug: d.slug, name: d.name }));
      const starter =
        decks.find((d) => !d.slug.endsWith("-afps")) ?? decks[0] ?? null;
      const meta =
        DOMAIN_META[set.domain] ?? { label: prettyPackName(set.domain), blurb: "" };
      return {
        domain: set.domain,
        label: meta.label,
        blurb: meta.blurb,
        packs,
        skillCount,
        starter,
        decks,
      };
    });

    return options.sort(
      (a, b) => DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain),
    );
  }, [data]);

  const deckBySlug = useMemo(
    () => new Map((data?.decks ?? []).map((d) => [d.slug, d] as const)),
    [data],
  );

  if (!data || domains.length === 0) {
    return (
      <main className="landing" data-testid="landing-loading">
        <p className="landing-loading-copy">Loading packs…</p>
      </main>
    );
  }

  return (
    <StageController
      domains={domains}
      decks={data.decks}
      deckBySlug={deckBySlug}
    />
  );
}

function StageController({
  domains,
  decks,
  deckBySlug,
}: {
  domains: DomainOption[];
  decks: GeneratedDeck[];
  deckBySlug: Map<string, GeneratedDeck>;
}) {
  const flow = usePackFlow();
  const { openedPacks, setOpenedPacks, setActivePack, setPhase } = flow;
  const headerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const machine = useStageMachine({
    domains,
    deckBySlug,
    flow: { setActivePack, setPhase, setOpenedPacks },
  });
  const { stage, selectedDeck, allotment } = machine;

  const openedInAllotment = allotment.filter((p) => openedPacks.has(p.slug)).length;
  const allOpened = allotment.length > 0 && openedInAllotment === allotment.length;

  // Test bridge: jsdom can't tear packs or run framer entrances, so Vitest/e2e
  // drive the journey through this hook. Latest closures via a ref so the
  // installed bridge stays fresh without re-installing each render. Back-compat
  // keys (domain/pick/openAll) are preserved; staged keys (stage/select/build/
  // back) are added.
  const bridgeRef = useRef({
    stage: 1 as number,
    state: "picker",
    domain: null as string | null,
    selectProject: machine.selectProject,
    goToBuild: machine.goToBuild,
    back: machine.back,
    restart: machine.restart,
    openAll: () => {},
  });
  bridgeRef.current = {
    stage,
    state: stage === 1 ? "picker" : stage === 3 ? "build" : allOpened ? "handoff" : "opening",
    domain: selectedDeck?.domain ?? null,
    selectProject: machine.selectProject,
    goToBuild: machine.goToBuild,
    back: machine.back,
    restart: machine.restart,
    openAll: () => setOpenedPacks(new Set(allotment.map((p) => p.slug))),
  };
  useEffect(() => {
    const w = window as unknown as { __landing?: unknown };
    w.__landing = {
      stage: () => bridgeRef.current.stage,
      state: () => bridgeRef.current.state,
      domain: () => bridgeRef.current.domain,
      select: (slug: string) => bridgeRef.current.selectProject(slug),
      // Back-compat alias — now takes a deck slug rather than a domain.
      pick: (slug: string) => bridgeRef.current.selectProject(slug),
      build: () => bridgeRef.current.goToBuild(),
      back: () => bridgeRef.current.back(),
      restart: () => bridgeRef.current.restart(),
      openAll: () => bridgeRef.current.openAll(),
    };
    return () => {
      delete w.__landing;
    };
  }, []);

  const variants = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
      };

  return (
    <>
      <main className="landing" data-testid="landing" data-stage={stage}>
        <StageProgress
          stage={stage}
          onBack={machine.back}
          contextLabel={selectedDeck?.name ?? null}
        />

        {/* Default (sync) mode — not "wait" — so the entering stage mounts
            immediately while the leaving one slides out (a clean cross-slide),
            and so jsdom (which never completes the exit animation) still mounts
            the next stage's content. */}
        <AnimatePresence initial={false}>
          {stage === 1 ? (
            <motion.div
              key="select"
              className="stage-screen"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: reduceMotion ? 0.18 : 0.32, ease: "easeOut" }}
            >
              <SelectStage
                domains={domains}
                decks={decks}
                onSelect={machine.selectProject}
                selectedSlug={machine.selectedDeckSlug}
              />
            </motion.div>
          ) : stage === 2 ? (
            <motion.div
              key="open"
              className="stage-screen"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: reduceMotion ? 0.18 : 0.32, ease: "easeOut" }}
            >
              <OpenStage
                machine={machine}
                flow={flow}
                headerRef={headerRef}
                openedInAllotment={openedInAllotment}
                allOpened={allOpened}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Stage 3: always mounted, visibility-toggled (see BuildStage contract). */}
      <BuildStage active={stage === 3} />
    </>
  );
}
