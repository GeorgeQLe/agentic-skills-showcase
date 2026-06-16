"use client";

/*
 * DeckTableShell — the single client owner of the deck-builder lifecycle, per
 * the approved animation plan's Lifecycle Ownership Map
 * (apps/skills-showcase/docs/animation-plan-deck-builder.md §C).
 *
 * This slice adds the first real motion: contract A `blueprint-morph` (§A, §D
 * open/close storyboards, §E guardrails). It reuses the routing primitives
 * proven green by the routing spike (shallow window.history.pushState +
 * popstate + usePathname, with the mount-id-after-hydration fix) and owns the
 * DeckFlowPhase state machine plus per-slug collected-card state.
 *
 * The phase machine is async-driven: framer's onLayoutAnimationComplete
 * advances `blueprint-morphing -> builder-open` (open) and
 * `builder-dismissing -> table` (close), each guarded by a one-shot ref. The
 * sequencing logic stays pure and unit-testable — Vitest drives the
 * start/complete handlers directly because jsdom never fires the framer layout
 * callbacks. Reduced motion runs the identical phase chain + callback order via
 * a crossfade with `layoutId` omitted (§E).
 *
 * Card-flight (contract B), the FlightLayer, and the §F debug-harness extension
 * are deferred to later slices; authored transitions still route through
 * `dbg.scaleT` so the harness step can drive them later with zero rework.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { usePathname } from "next/navigation";

import { useDebug } from "@/components/debug/DebugController";
import { buildDecks, getDeckBySlug, type Deck } from "@/deck-builder/decks";
import { useSkillsData, type Skill } from "@/hooks/useSkillsData";

/** Table route — the entry point that lists deck blueprints. */
const TABLE_PATH = "/prototype/deck-routing-spike";

/**
 * DeckFlowPhase — the full lifecycle from the plan. In this skeleton slice
 * `blueprint-morphing` and `builder-dismissing` are passed through instantly
 * (the motion slice parks the animation there); the observable phases are
 * `table` and `builder-open`.
 */
export type DeckFlowPhase =
  | "table"
  | "blueprint-morphing"
  | "builder-open"
  | "builder-dismissing"
  | "table-restored";

declare global {
  interface Window {
    __deckTableShellMounts?: number;
    /**
     * Test bridge for the morph-completion handlers. jsdom never fires framer's
     * onLayoutAnimationComplete, so Vitest drives the start/complete handlers
     * directly through this hook (same debug-via-window idiom as
     * __deckTableShellMounts). Harmless in production — two function refs.
     */
    __deckMorphComplete?: { open: () => void; close: () => void };
  }
}

export function deckSlugFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/deck\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Shared layout-spring for the blueprint↔builder morph. The two layoutId
// owners — the source blueprint (TableSurface) and the target panel
// (BuilderPanel) — MUST animate with the same transition or the morph-in and
// morph-back desync. Single-sourced here so they can never drift. Mirrors the
// spring in PackOpener.tsx.
const MORPH_LAYOUT_TRANSITION = {
  layout: { type: "spring", stiffness: 200, damping: 25 },
} as const;

function makeMountId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function collectedStorageKey(slug: string): string {
  return `deck:${slug}:collected`;
}

function readCollected(slug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(collectedStorageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeCollected(slug: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(collectedStorageKey(slug), JSON.stringify(ids));
  } catch {
    /* localStorage may be unavailable (private mode); commit is best-effort. */
  }
}

interface DeckTableShellProps {
  hardLoad?: boolean;
  initialDeckSlug?: string | null;
}

export default function DeckTableShell({
  hardLoad = false,
  initialDeckSlug = null,
}: DeckTableShellProps) {
  const pathname = usePathname();
  const data = useSkillsData();

  // Route-truth source. activeDeckSlug is the owned state the phase machine
  // reads; it is seeded from the hard-load slug and kept in sync with the URL
  // via pushDeckPath (open/close) and the popstate listener (Back/Forward).
  const [activeDeckSlug, setActiveDeckSlug] = useState<string | null>(initialDeckSlug);
  const activeDeckSlugRef = useRef(activeDeckSlug);
  activeDeckSlugRef.current = activeDeckSlug;

  // closingSlug keeps the dismissing deck's blueprint hidden through the
  // morph-back. activeDeckSlug clears the instant Back/dismiss fires, but if the
  // source blueprint became visible that early it would paint at its small grid
  // box while the panel is still at full size — the morph-back flash / double-
  // vision the contract forbids. Instead the exiting panel morphs back to the
  // source box while the source stays at opacity 0, and the source only
  // reappears (seamlessly, where the panel landed) once the exit completes.
  const [closingSlug, setClosingSlug] = useState<string | null>(null);
  const [phase, setPhaseState] = useState<DeckFlowPhase>(
    initialDeckSlug ? "builder-open" : "table",
  );
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // setPhase keeps phaseRef in sync synchronously so the morph-completion
  // guards (and the reduced-motion back-to-back calls) read the true current
  // phase within a single event, before React re-renders.
  const setPhase = useCallback((next: DeckFlowPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  // One-shot completion latches per morph cycle (the PackOpener
  // collapseCompleteFiredRef idiom). Reset at the start of each open/close so
  // the next cycle re-arms; a duplicate framer callback is then a no-op.
  const openMorphFiredRef = useRef(false);
  const closeMorphFiredRef = useRef(false);

  // The blueprint button that originated the open, captured at tap time so
  // focus can be restored to it when the morph-back lands (§A: no focus loss).
  const originButtonRef = useRef<HTMLButtonElement | null>(null);

  // prefers-reduced-motion read (no shared util exists; mirrors
  // useWorkflowPlayer.ts). reducedMotionRef lets the open/close handlers fire
  // completions synchronously without waiting on a re-render.
  const [reducedMotion, setReducedMotion] = useState(false);
  const reducedMotionRef = useRef(false);
  useEffect(() => {
    const prefers =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    reducedMotionRef.current = prefers;
    setReducedMotion(prefers);
  }, []);

  // collectedCardIds keyed per slug, localStorage-backed. Hydrated lazily per
  // deck on first open / hard-load.
  const [collectedBySlug, setCollectedBySlug] = useState<Record<string, string[]>>(
    () => (initialDeckSlug ? { [initialDeckSlug]: readCollected(initialDeckSlug) } : {}),
  );

  // Mount-id-after-hydration: assign the id in an effect, never during render.
  // This is the fix for the hydration-mismatch bug the routing spike caught —
  // server and first client render must produce identical markup.
  const mountId = useRef<string | null>(null);
  const [visibleMountId, setVisibleMountId] = useState("(hydrating)");

  useEffect(() => {
    if (!mountId.current) {
      mountId.current = makeMountId();
    }
    setVisibleMountId(mountId.current);
    window.__deckTableShellMounts = (window.__deckTableShellMounts ?? 0) + 1;
  }, []);

  const ensureCollectedLoaded = useCallback((slug: string) => {
    setCollectedBySlug((current) => {
      if (current[slug]) return current;
      return { ...current, [slug]: readCollected(slug) };
    });
  }, []);

  function pushDeckPath(nextDeckSlug: string | null) {
    const nextPath = nextDeckSlug
      ? `/deck/${encodeURIComponent(nextDeckSlug)}`
      : TABLE_PATH;
    window.history.pushState({ deckSlug: nextDeckSlug }, "", nextPath);
    setActiveDeckSlug(nextDeckSlug);
  }

  // Advance the open morph: `blueprint-morphing -> builder-open`. Fired by the
  // BuilderPanel chrome's onLayoutAnimationComplete (the morph landing), or
  // synchronously by openDeck under reduced motion. Phase-guarded so the
  // source blueprint's own layout callbacks never cross-fire it.
  const onOpenMorphComplete = useCallback(() => {
    if (openMorphFiredRef.current) return;
    if (phaseRef.current !== "blueprint-morphing") return;
    openMorphFiredRef.current = true;
    setPhase("builder-open");
  }, [setPhase]);

  // Advance the close morph: `builder-dismissing -> table`. Fired by the source
  // blueprint's onLayoutAnimationComplete once it reclaims the layoutId and the
  // morph-back lands; focus returns to the originating blueprint (§A).
  const onCloseMorphComplete = useCallback(() => {
    if (closeMorphFiredRef.current) return;
    if (phaseRef.current !== "builder-dismissing") return;
    closeMorphFiredRef.current = true;
    setPhase("table");
    setClosingSlug(null);
    // Restore focus to the originating blueprint after the commit/unmount
    // settles — focusing inside the exit-complete callback races React's DOM
    // teardown and the focus is lost to <body>.
    const originButton = originButtonRef.current;
    if (originButton) {
      requestAnimationFrame(() => originButton.focus());
    }
  }, [setPhase]);

  // Open: legal only from `table` (contract A interruption rule). Parks on
  // `blueprint-morphing` while the chrome morphs; onOpenMorphComplete advances
  // to `builder-open`. Under reduced motion the completion fires back-to-back
  // so the phase chain and one-shot order are identical (§E).
  const openDeck = useCallback(
    (slug: string, originButton: HTMLButtonElement | null) => {
      if (phaseRef.current !== "table") return;
      openMorphFiredRef.current = false;
      originButtonRef.current = originButton;
      setPhase("blueprint-morphing");
      ensureCollectedLoaded(slug);
      pushDeckPath(slug);
      if (reducedMotionRef.current) onOpenMorphComplete();
    },
    [ensureCollectedLoaded, onOpenMorphComplete, setPhase],
  );

  // Close: legal from `builder-open`. Parks on `builder-dismissing` and clears
  // activeDeckSlug, triggering the panel's AnimatePresence exit; the source
  // blueprint reclaims the layoutId and onCloseMorphComplete lands the table.
  const closeDeck = useCallback(() => {
    if (phaseRef.current !== "builder-open") return;
    closeMorphFiredRef.current = false;
    setClosingSlug(activeDeckSlugRef.current);
    setPhase("builder-dismissing");
    pushDeckPath(null);
    if (reducedMotionRef.current) onCloseMorphComplete();
  }, [onCloseMorphComplete, setPhase]);

  // Test bridge: expose the completion handlers so Vitest can drive the morph
  // boundaries jsdom won't animate. See the Window augmentation above.
  useEffect(() => {
    window.__deckMorphComplete = {
      open: onOpenMorphComplete,
      close: onCloseMorphComplete,
    };
    return () => {
      delete window.__deckMorphComplete;
    };
  }, [onOpenMorphComplete, onCloseMorphComplete]);

  // popstate (Back/Forward) — reconcile owned state with the URL the browser
  // restored, without remounting the shell. Back/Forward carry no morph
  // origin, so jump straight to the reconciled phase (the correct no-origin
  // fallback) and re-arm both one-shot latches for the next user-driven morph.
  useEffect(() => {
    function handlePopState() {
      const nextDeckSlug = deckSlugFromPath(window.location.pathname);
      if (nextDeckSlug) ensureCollectedLoaded(nextDeckSlug);
      openMorphFiredRef.current = false;
      closeMorphFiredRef.current = false;
      setClosingSlug(null);
      setActiveDeckSlug(nextDeckSlug);
      setPhase(nextDeckSlug ? "builder-open" : "table");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [ensureCollectedLoaded, setPhase]);

  const collectCard = useCallback(
    (slug: string, cardId: string) => {
      setCollectedBySlug((current) => {
        const existing = current[slug] ?? readCollected(slug);
        if (existing.includes(cardId)) return current; // re-tap is a no-op
        const next = [...existing, cardId];
        writeCollected(slug, next); // optimistic commit, no rollback
        return { ...current, [slug]: next };
      });
    },
    [],
  );

  const decks = useMemo<Deck[]>(
    () => (data ? buildDecks(data.skills) : []),
    [data],
  );
  const activeDeck = getDeckBySlug(decks, activeDeckSlug);
  const collectedCardIds = activeDeckSlug
    ? collectedBySlug[activeDeckSlug] ?? []
    : [];

  if (!data) {
    return (
      <main className="deck-table-shell" data-testid="deck-table-shell" data-phase={phase}>
        <p className="deck-loading">Loading decks…</p>
      </main>
    );
  }

  return (
    <main className="deck-table-shell" data-testid="deck-table-shell" data-phase={phase}>
      <span className="deck-debug" data-testid="deck-mount-id" hidden>
        {visibleMountId}
      </span>
      <span className="deck-debug" data-testid="deck-phase" hidden>
        {phase}
      </span>
      <span className="deck-debug" data-testid="deck-pathname" hidden>
        {pathname ?? "(null)"}
      </span>
      <span className="deck-debug" data-testid="deck-active-slug" hidden>
        {activeDeckSlug ?? "(none)"}
      </span>
      <span className="deck-debug" data-testid="deck-entry-mode" hidden>
        {hardLoad ? "hard-load" : "table"}
      </span>

      {/* One LayoutGroup wrapping table + builder carries the shared
          layoutId="deck-blueprint-${slug}" across the morph. BuilderPanel is the
          AnimatePresence-mounted target; the active blueprint in TableSurface is
          the source, kept mounted at opacity 0 — exactly one mounted layoutId
          owner at a time (§ Identity Rules). mode="sync" per §E. */}
      <LayoutGroup>
        <TableSurface
          decks={decks}
          phase={phase}
          activeDeckSlug={activeDeckSlug}
          hiddenSlug={activeDeckSlug ?? closingSlug}
          reducedMotion={reducedMotion}
          onOpen={openDeck}
        />
        <AnimatePresence mode="sync" onExitComplete={onCloseMorphComplete}>
          {activeDeck ? (
            <BuilderPanel
              key={activeDeck.slug}
              deck={activeDeck}
              phase={phase}
              reducedMotion={reducedMotion}
              collectedCardIds={collectedCardIds}
              onCollect={(cardId) => collectCard(activeDeck.slug, cardId)}
              onClose={closeDeck}
              onOpenMorphComplete={onOpenMorphComplete}
            />
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
    </main>
  );
}

function TableSurface({
  decks,
  phase,
  activeDeckSlug,
  hiddenSlug,
  reducedMotion,
  onOpen,
}: {
  decks: Deck[];
  phase: DeckFlowPhase;
  activeDeckSlug: string | null;
  // The blueprint kept at opacity 0 because the builder owns its rectangle —
  // the active deck while open/morphing, and the dismissing deck until the
  // morph-back exit completes.
  hiddenSlug: string | null;
  reducedMotion: boolean;
  onOpen: (slug: string, originButton: HTMLButtonElement | null) => void;
}) {
  const dbg = useDebug();
  return (
    <section className="deck-table" data-testid="deck-table-surface" aria-label="Deck table">
      <header className="deck-table-head">
        <p className="deck-eyebrow">Deck builder</p>
        <h1>Build a deck</h1>
        <p className="deck-table-copy">
          Tap a blueprint to open its builder. Collect cards into phase slots.
        </p>
      </header>
      <ul className="deck-blueprint-grid">
        {decks.map((deck) => {
          const isActive = deck.slug === activeDeckSlug;
          const isHidden = deck.slug === hiddenSlug;
          // Every blueprint persistently owns its shared layoutId (the SealedPack
          // pattern) so framer always has a prior box to morph from/to — a
          // layoutId minted only on open has no origin and the morph never
          // fires. The source stays mounted at opacity 0 while the builder owns
          // the visible rectangle; the exiting panel morphs back onto this box.
          // Under reduced motion the layoutId is omitted (§E) — the crossfade
          // lives on BuilderPanel.
          const sourceLayoutId = reducedMotion
            ? undefined
            : `deck-blueprint-${deck.slug}`;
          return (
            <li key={deck.slug}>
              <motion.button
                className="deck-blueprint"
                data-testid={`deck-blueprint-${deck.slug}`}
                data-active={String(isActive)}
                layoutId={sourceLayoutId}
                transition={dbg.scaleT(MORPH_LAYOUT_TRANSITION)}
                style={{ opacity: isHidden ? 0 : 1 }}
                // Blueprint taps are ignored unless phase is `table`
                // (contract A interruption rule).
                disabled={phase !== "table"}
                onClick={(event) => onOpen(deck.slug, event.currentTarget)}
                type="button"
              >
                <span className="deck-blueprint-name">{deck.name}</span>
                <small className="deck-blueprint-meta">
                  {deck.skills.length} cards · {deck.phases.length} phases
                </small>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Content wrappers stagger in once the morph lands (phase === "builder-open"),
// using the capped-delay pattern from PackOpener (0.2 + min(i,12)*0.04). They
// stay hidden during `blueprint-morphing` so only the chrome rectangle morphs
// (§E), and fast-fade on close (storyboard §D close step 1) so the morph reads.
const contentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + Math.min(i, 12) * 0.04, duration: 0.2 },
  }),
};
const contentExit = { opacity: 0, transition: { duration: 0.01 } };

function BuilderPanel({
  deck,
  phase,
  reducedMotion,
  collectedCardIds,
  onCollect,
  onClose,
  onOpenMorphComplete,
}: {
  deck: Deck;
  phase: DeckFlowPhase;
  reducedMotion: boolean;
  collectedCardIds: string[];
  onCollect: (cardId: string) => void;
  onClose: () => void;
  onOpenMorphComplete: () => void;
}) {
  const dbg = useDebug();
  const collected = new Set(collectedCardIds);
  // Skeleton slot model: distribute collected cards across phase columns
  // round-robin so each phase column shows fill. The card-flight slice replaces
  // this with the target/slot identity model.
  const collectedSkills = deck.skills.filter((s) => collected.has(s.id));

  // Chrome morph: the layoutId rectangle animates chrome only (no declarative
  // transform on it, §E); content motion lives on the child wrappers below.
  // Reduced motion omits the layoutId and crossfades the panel over 120 ms,
  // firing the same completion callback order (§E) — the open/close handlers
  // fire those synchronously, so no layout callback is wired in that mode.
  const layoutId = reducedMotion ? undefined : `deck-blueprint-${deck.slug}`;
  const contentState = phase === "builder-open" ? "visible" : "hidden";

  return (
    <motion.section
      className="deck-builder"
      data-testid="deck-builder-panel"
      aria-label={`${deck.name} builder`}
      layoutId={layoutId}
      transition={dbg.scaleT(
        reducedMotion ? { duration: 0.12 } : MORPH_LAYOUT_TRANSITION,
      )}
      onLayoutAnimationComplete={reducedMotion ? undefined : onOpenMorphComplete}
      initial={reducedMotion ? { opacity: 0 } : false}
      animate={reducedMotion ? { opacity: 1 } : undefined}
      exit={reducedMotion ? { opacity: 0 } : undefined}
    >
      <motion.header
        className="deck-builder-head"
        custom={0}
        variants={contentVariants}
        initial="hidden"
        animate={contentState}
        exit={contentExit}
      >
        <div>
          <p className="deck-eyebrow">Builder</p>
          <h2>{deck.name}</h2>
          <small data-testid="deck-collected-count">
            {collectedCardIds.length} / {deck.skills.length} collected
          </small>
        </div>
        <button
          className="deck-back"
          data-testid="deck-back"
          onClick={onClose}
          type="button"
        >
          ← Back to table
        </button>
      </motion.header>

      <motion.div
        className="deck-slot-columns"
        data-testid="deck-slot-columns"
        custom={1}
        variants={contentVariants}
        initial="hidden"
        animate={contentState}
        exit={contentExit}
      >
        {deck.phases.map((phaseId, index) => {
          const slotSkills = collectedSkills.filter(
            (_s, i) => i % deck.phases.length === index,
          );
          return (
            <div className="deck-slot-column" key={phaseId} data-phase-slot={phaseId}>
              <p className="deck-slot-label">{phaseId}</p>
              {slotSkills.length === 0 ? (
                <p className="deck-slot-empty">empty</p>
              ) : (
                <ul className="deck-slot-cards">
                  {slotSkills.map((s) => (
                    <li key={s.id} className="deck-slot-card">
                      {s.title || s.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </motion.div>

      <motion.div
        className="deck-shelf"
        data-testid="deck-shelf"
        aria-label="Card shelf"
        custom={2}
        variants={contentVariants}
        initial="hidden"
        animate={contentState}
        exit={contentExit}
      >
        {deck.skills.map((skill: Skill) => {
          const isCollected = collected.has(skill.id);
          return (
            <button
              key={skill.id}
              className="deck-card"
              data-testid={`deck-card-${skill.id}`}
              data-collected={String(isCollected)}
              // Re-tap of a collected card is a no-op at the data level.
              onClick={() => onCollect(skill.id)}
              type="button"
            >
              <span className="deck-card-name">{skill.title || skill.name}</span>
              {isCollected ? (
                <span className="deck-card-badge" data-testid={`deck-card-badge-${skill.id}`}>
                  in deck
                </span>
              ) : null}
            </button>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
