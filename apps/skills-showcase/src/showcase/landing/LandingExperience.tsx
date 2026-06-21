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

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";

import { useSkillsData, type GeneratedDeck, type Skill } from "@/hooks/useSkillsData";
import SealedPack from "@/components/SealedPack";
import { usePackFlow, PackFlowSheet } from "@/components/PackRitual";

import type { DomainOption, PackCard } from "./types";
import { useStageMachine, type StageMachine } from "./useStageMachine";
import StageProgress from "./StageProgress";
import BuildStage from "./BuildStage";

const DOMAIN_META: Record<string, { label: string; blurb: string }> = {
  business: {
    label: "Business",
    blurb: "Validate, align, research, decide — the market-facing decks.",
  },
  devtool: {
    label: "Devtool",
    blurb: "Operate, refactor, and ship developer tooling with proof gates.",
  },
  game: {
    label: "Game",
    blurb: "Concept, design, and prototype game systems end to end.",
  },
};

const DOMAIN_ORDER = ["business", "devtool", "game"];

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

/* --- Stage 1: SELECT (Phase 3 plain form; Phase 4 elevates to project framing) --- */

function SelectStage({
  domains,
  decks,
  onSelect,
  selectedSlug,
}: {
  domains: DomainOption[];
  decks: GeneratedDeck[];
  onSelect: (slug: string) => void;
  selectedSlug: string | null;
}) {
  const countsByDomain = useMemo(() => {
    const map = new Map<string, { packs: number; skills: number; label: string }>();
    for (const d of domains) {
      map.set(d.domain, { packs: d.packs.length, skills: d.skillCount, label: d.label });
    }
    return map;
  }, [domains]);

  return (
    <section className="select-stage" aria-labelledby="select-stage-title">
      <header className="landing-hero">
        <p className="landing-eyebrow">G Skillpacks</p>
        <h1 id="select-stage-title" className="landing-title">
          What are you building?
        </h1>
        <p className="landing-lede">
          Pick a goal. We&apos;ll deal you the starter packs for it, then help you
          build the deck.
        </p>
      </header>

      <div className="select-grid" data-testid="landing-project-grid">
        {decks.map((deck) => {
          const counts = countsByDomain.get(deck.domain);
          const isSelected = deck.slug === selectedSlug;
          return (
            <button
              key={deck.slug}
              type="button"
              className="select-card"
              data-testid={`landing-project-${deck.slug}`}
              data-selected={String(isSelected)}
              onClick={() => onSelect(deck.slug)}
            >
              <span className="select-card-name">{deck.name}</span>
              <span className="select-card-domain">{counts?.label ?? deck.domain}</span>
              {counts ? (
                <span className="select-card-meta">
                  {counts.packs} packs · {counts.skills} skills
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* --- Stage 2: OPEN (Phase 3 plain form; Phase 5 adds the workflow ribbon) --- */

function OpenStage({
  machine,
  flow,
  headerRef,
  openedInAllotment,
  allOpened,
}: {
  machine: StageMachine;
  flow: ReturnType<typeof usePackFlow>;
  headerRef: React.RefObject<HTMLElement | null>;
  openedInAllotment: number;
  allOpened: boolean;
}) {
  const { allotment, selectedDeck, domain } = machine;
  const { openedPacks, activePack } = flow;

  return (
    <section className="open-stage" aria-labelledby="open-stage-title" ref={headerRef}>
      <div className="landing-opening-head">
        <h2 id="open-stage-title" className="landing-section-title">
          {selectedDeck?.name} starter packs
        </h2>
        <p className="landing-counter" data-testid="landing-counter">
          Pack {openedInAllotment} of {allotment.length} opened
        </p>
      </div>

      <LayoutGroup>
        <div className="landing-pack-shelf" data-testid="landing-pack-shelf">
          {allotment.map((pack, index) => {
            const isActive = activePack?.packName === pack.slug;
            const isDrawerResident =
              isActive &&
              (flow.phase === "drawer-open" ||
                flow.phase === "closing-collapse" ||
                flow.phase === "closing-apex");
            return (
              <motion.div
                key={pack.slug}
                className="landing-pack-cell"
                data-testid={`landing-pack-${pack.slug}`}
                initial={{ opacity: 0, scale: 0.8, rotateZ: -4 }}
                animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 24,
                  delay: Math.min(index, 8) * 0.06,
                }}
              >
                <SealedPack
                  name={pack.slug}
                  skillCount={pack.skills.length}
                  previewSkill={pack.skills[0] ?? null}
                  onOpeningApex={flow.handleOpeningApex}
                  onOpen={(origin) => flow.handleOpen(pack.slug, origin)}
                  onTear={() => flow.handleTear(pack.slug)}
                  onCardSettleComplete={flow.handleCardSettleComplete}
                  apexAlignRef={isActive ? headerRef : undefined}
                  autoOpenOnTear
                  isOpened={openedPacks.has(pack.slug)}
                  isDrawerOpen={isDrawerResident}
                  flowPhase={isActive ? flow.phase : "sealed"}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Inspect mode: no onCollect / onCollectAll, so a fanned card flips on
            tap and there is no slot to fly to. */}
        <PackFlowSheet
          flow={flow}
          packName={
            activePack
              ? allotment.find((p) => p.slug === activePack.packName)?.name ?? ""
              : ""
          }
          skills={
            activePack
              ? allotment.find((p) => p.slug === activePack.packName)?.skills ?? []
              : []
          }
        />
      </LayoutGroup>

      {allOpened && domain ? (
        <HandoffChooser
          domain={domain}
          starterSlug={selectedDeck?.slug ?? domain.starter?.slug ?? null}
          onBuild={machine.goToBuild}
        />
      ) : (
        <p className="landing-opening-hint" data-testid="landing-opening-hint">
          Tear a pack along the dotted line to fan its cards. Open all{" "}
          {allotment.length} to choose your deck.
        </p>
      )}
    </section>
  );
}

function HandoffChooser({
  domain,
  starterSlug,
  onBuild,
}: {
  domain: DomainOption;
  starterSlug: string | null;
  onBuild: () => void;
}) {
  const starter =
    domain.decks.find((d) => d.slug === starterSlug) ?? domain.starter ?? null;
  return (
    <div className="landing-handoff" data-testid="landing-handoff">
      <h3 className="landing-handoff-title">Your packs are open — now build.</h3>
      <div className="landing-handoff-choices">
        {starter ? (
          <Link
            className="landing-handoff-primary"
            data-testid="landing-handoff-starter"
            href={`/deck/${encodeURIComponent(starter.slug)}`}
          >
            <span className="landing-handoff-kicker">Load the starter</span>
            <span className="landing-handoff-name">{starter.name}</span>
            <span className="landing-handoff-meta">
              The curated {domain.label} deck, ready to fill.
            </span>
          </Link>
        ) : null}
        <button
          type="button"
          className="landing-handoff-secondary"
          data-testid="landing-handoff-build"
          onClick={onBuild}
        >
          <span className="landing-handoff-kicker">Build in place</span>
          <span className="landing-handoff-name">Open the deck table</span>
          <span className="landing-handoff-meta">
            Stay here and build on the blueprint table.
          </span>
        </button>
      </div>
    </div>
  );
}
