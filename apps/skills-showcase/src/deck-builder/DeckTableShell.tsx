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
 * This slice adds contract B `card-flight` (§B, §D card-flight storyboard, §F
 * flight portion): a FlightLayer portal-clone overlay flies the tapped fan card
 * to its phase slot with an imperative `animate()` while the data commits
 * optimistically; the slot fills + pulses only when the clone lands, the
 * presentation counter ticks then, and a staggered add-all variant plus a
 * `finishAllFlightsImmediately()` interrupt path keep the counter reconciled.
 * Reduced motion mounts no clone and fills the slot with a fade. All authored
 * transitions route through `dbg.scaleT`, and the stepped-mode `gate()` calls
 * for the morph boundaries (`blueprint-morph-in`/`-out`) and the flight
 * boundaries (`flight-launch`/`-land`) the §F harness step deferred are wired in.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useMotionValue,
} from "framer-motion";
import { createPortal } from "react-dom";
import { Maximize2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useDebug } from "@/components/debug/DebugController";
import SealedPack, { type SealedPackHandle } from "@/components/SealedPack";
import { usePackFlow, PackFlowSheet } from "@/components/PackRitual";
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
    /**
     * Test bridge for card-flight landings. framer's imperative animate()
     * never settles deterministically under jsdom, so Vitest drives flight
     * landings/flushes through this hook (same idiom as __deckMorphComplete).
     * `landAll` settles in-flight clones as if they landed (with pulse);
     * `finishAll` runs the interrupt flush; `inFlight` reads the live ids.
     * The completion `gather` (settled slot cards flying into the stack before
     * it flips) rides the same idiom: `gatherInFlight` reads the live gather
     * clone ids, `landGather` settles them as if they landed (triggering the
     * stack flip once the last lands).
     */
    __deckFlight?: {
      inFlight: () => string[];
      landAll: () => void;
      finishAll: () => void;
      gatherInFlight: () => string[];
      landGather: () => void;
    };
    /**
     * Test bridge for the tear-open pack ritual. jsdom can't perform the
     * SealedPack drag gesture, so Vitest (and the Playwright flight specs) fan
     * the pack through this hook before tapping a card. `open` fans the deck,
     * `close` collapses it, `phase` reads the live PackFlowPhase.
     */
    __deckPack?: {
      open: () => void;
      close: () => void;
      phase: () => string;
    };
  }
}

/** Source/target geometry captured at launch time (§D card-flight step 2). */
interface FlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface FlightRecord {
  id: string;
  label: string;
  from: FlightRect;
  to: FlightRect;
}

// Imperative clone spring from the storyboard (§D card-flight step 4). Single-
// sourced so the clone motion stays debug-speed scalable via dbg.scaleT.
const FLIGHT_SPRING = { type: "spring", stiffness: 260, damping: 26 } as const;
// Slot pulse + reduced-motion fill durations (§D step 5 / §E).
const FLIGHT_PULSE_MS = 250;
// Add-all stagger between launches (§D: 70 ms/flight).
const FLIGHT_STAGGER_MS = 70;

function rectOf(el: Element): FlightRect {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

const rectCenterX = (r: FlightRect) => r.left + r.width / 2;
const rectCenterY = (r: FlightRect) => r.top + r.height / 2;

function isOffscreen(el: Element): boolean {
  const r = el.getBoundingClientRect();
  // A zero-size rect carries no usable geometry (jsdom, or a not-yet-laid-out
  // node) — treat it as on-screen so the flight registers synchronously rather
  // than waiting on a scroll-then-measure that will never produce a real rect.
  if (r.width === 0 && r.height === 0) return false;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  return r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw;
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

/** Unique packs feeding a deck, in stable card order — the `enabled_packs` set. */
function deckPacks(deck: Deck): string[] {
  const seen = new Set<string>();
  const packs: string[] = [];
  for (const skill of deck.skills) {
    if (skill.pack && !seen.has(skill.pack)) {
      seen.add(skill.pack);
      packs.push(skill.pack);
    }
  }
  return packs;
}

/**
 * buildDeckProjectJson — the deck's `.agents/project.json` payload (§6 output).
 * Mirrors the project designation shape (`enabled_packs` + `skill_pack_version`)
 * per docs/skillpacks-npm-distribution.md, plus `deck` metadata so the file
 * records which canonical deck produced it. Exported for direct unit assertion.
 */
export function buildDeckProjectJson(deck: Deck): string {
  return JSON.stringify(
    {
      enabled_packs: deckPacks(deck),
      skill_pack_version: 1,
      deck: { slug: deck.slug, name: deck.name },
    },
    null,
    2,
  );
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
  // Inert NOOP context when no DebugProvider is mounted (the shell renders
  // standalone too), so gate() resolves immediately and debug-off is unchanged.
  const dbg = useDebug();

  // BuilderPanel publishes finishAllFlightsImmediately() here so closeDeck can
  // flush in-flight clones BEFORE the dismiss (§C: runs before any builder
  // dismiss). Returns true if anything was flushed.
  const flushFlightsRef = useRef<null | (() => boolean)>(null);

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
    // teardown and the focus is lost to <body>. A double rAF clears that race:
    // the exiting panel now carries a heavier subtree (the pack flow + its
    // body-portaled sheet), so framer's unmount/cleanup can land a frame later
    // and blur a single-rAF focus; deferring one more frame lands focus last.
    const originButton = originButtonRef.current;
    if (originButton) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => originButton.focus({ preventScroll: true })),
      );
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
    // Snap all in-flight clones to end before the dismiss so the morph-back
    // never races a flight (§C). No-op when nothing is in flight.
    flushFlightsRef.current?.();
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
    () => (data ? buildDecks(data) : []),
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
        {/* Close apex (§D close step 3 / §F): gate the morph-back boundary so
            stepped mode can freeze the flash apex frame. In auto/disabled mode
            gate() resolves immediately, so behavior is unchanged. */}
        <AnimatePresence
          mode="sync"
          onExitComplete={() => {
            void dbg.gate("blueprint-morph-out").then(onCloseMorphComplete);
          }}
        >
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
              flushFlightsRef={flushFlightsRef}
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
  flushFlightsRef,
}: {
  deck: Deck;
  phase: DeckFlowPhase;
  reducedMotion: boolean;
  collectedCardIds: string[];
  onCollect: (cardId: string) => void;
  onClose: () => void;
  onOpenMorphComplete: () => void;
  flushFlightsRef: MutableRefObject<null | (() => boolean)>;
}) {
  const dbg = useDebug();
  const router = useRouter();
  const panelRef = useRef<HTMLElement | null>(null);

  // Expand = info, not collect. Soft-navigate to the card-detail surface, which
  // the @modal/(.)card/[id] intercepting route renders as an overlay over the
  // builder (the deck's own pushState morph is a separate subtree, untouched).
  const expandCard = useCallback(
    (cardId: string) => {
      router.push(`/card/${encodeURIComponent(cardId)}`);
    },
    [router],
  );

  // collectedCardIds is the committed (optimistic) truth from the shell — it
  // drives the fan card's dim + "in deck" badge from the tap frame. collectedRef
  // mirrors it for synchronous reads inside the tap handlers (the prop only
  // updates on the next render).
  const collected = useMemo(() => new Set(collectedCardIds), [collectedCardIds]);
  const collectedRef = useRef(collected);
  collectedRef.current = collected;

  // Presentation state. A card is *settled* once its clone lands (or, on
  // mount/hard-load/reduced-motion, immediately). Slots fill and the counter
  // tick off settledIds, NEVER off the optimistic commit (§B "never: slot
  // filling before the clone lands except reduced motion"). Seeded once per
  // mounted deck (BuilderPanel is keyed by slug) from the already-collected set.
  const [settledIds, setSettledIds] = useState<Set<string>>(
    () => new Set(collectedCardIds),
  );
  const settledRef = useRef(settledIds);
  settledRef.current = settledIds;

  // Live clones + the flight bookkeeping the interrupt/batch paths read.
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(() => new Set());
  const inFlightIdsRef = useRef<Set<string>>(new Set());
  const batchRemainingRef = useRef(0);

  // Completion gather (§6 "slots briefly gather into a stacked deck"): on the
  // completion edge a clone per settled slot card flies into the completion
  // stack's rect (the same FlightClone/FlightLayer primitive, target = the
  // stack), then the stack flips. revealCompletion gates the flip so it begins
  // only after the gather clones land; reduced motion skips the gather and
  // reveals immediately. gatherFiredRef one-shots the launch per mounted deck.
  const [gatherFlights, setGatherFlights] = useState<FlightRecord[]>([]);
  const gatherFlightsRef = useRef(gatherFlights);
  gatherFlightsRef.current = gatherFlights;
  const [revealCompletion, setRevealCompletion] = useState(false);
  const gatherRemainingRef = useRef(0);
  const gatherFiredRef = useRef(false);

  // Settle one gather clone: drop it and, once the last lands, trigger the
  // stack flip. Idempotent — a late animate .then() after the bridge already
  // reconciled is clamped to a no-op by the Math.max guard.
  const onGatherLand = useCallback((id: string) => {
    setGatherFlights((prev) => prev.filter((f) => f.id !== id));
    gatherRemainingRef.current = Math.max(0, gatherRemainingRef.current - 1);
    if (gatherRemainingRef.current === 0) setRevealCompletion(true);
  }, []);

  // Stable slot identity: a card maps to the named phase that suggests it (its
  // real workflow-chain column), for its whole lifetime. This is the flight's
  // continuity target, so it must not depend on collection order; a card with
  // no owning phase falls back to the first column.
  const slotColumnIndex = useCallback(
    (skillId: string) => {
      const i = deck.phases.findIndex((phase) =>
        phase.suggestedSkills.some((s) => s.id === skillId),
      );
      return i < 0 ? 0 : i;
    },
    [deck.phases],
  );
  const targetPhaseId = useCallback(
    (skillId: string) => deck.phases[slotColumnIndex(skillId)].key,
    [deck.phases, slotColumnIndex],
  );

  // wantedIds — the "collect me next" hint set surfaced on the open fan. A phase
  // column is *empty* until a card settles into it; for each still-empty column
  // the first uncollected card mapping to it is "wanted", so the fan glows the
  // one card to grab next per phase. Tracks settledIds (slot fill) AND collected
  // (optimistic commit), so a wanted rim clears the frame its card is tapped and
  // the column's next card lights up only once a slot actually fills. PackOpener
  // additionally gates the rim on !isCollected, so an in-flight card never glows.
  const wantedIds = useMemo(() => {
    const wanted = new Set<string>();
    deck.phases.forEach((phase) => {
      const columnFilled = phase.suggestedSkills.some((s) => settledIds.has(s.id));
      if (columnFilled) return;
      const firstUncollected = phase.suggestedSkills.find((s) => !collected.has(s.id));
      if (firstUncollected) wanted.add(firstUncollected.id);
    });
    return wanted;
  }, [collected, deck.phases, settledIds]);

  // Report the flight runtime slice to the harness graph (enabled-gated so
  // debug-off stays zero-overhead, matching the bridge).
  const reportFlight = useCallback(() => {
    if (!dbg.enabled) return;
    dbg.report({
      machine: {
        builder: { collectedCount: settledRef.current.size },
        flightLayer: {
          inFlightCount: inFlightIdsRef.current.size,
          settledCount: settledRef.current.size,
          batchRemaining: batchRemainingRef.current,
        },
      },
    });
  }, [dbg]);

  // Settle one card: remove its clone, fill its slot, tick the counter, and
  // (on a real land) pulse the slot once. Idempotent — a late animate .then()
  // after an interrupt flush is a no-op.
  const settle = useCallback(
    (id: string, { pulse }: { pulse: boolean }) => {
      if (settledRef.current.has(id)) return;
      const nextSettled = new Set(settledRef.current);
      nextSettled.add(id);
      settledRef.current = nextSettled;
      inFlightIdsRef.current.delete(id);
      setSettledIds(nextSettled);
      setFlights((prev) => prev.filter((f) => f.id !== id));
      if (pulse) {
        setPulsingIds((prev) => new Set(prev).add(id));
        window.setTimeout(() => {
          setPulsingIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, FLIGHT_PULSE_MS);
      }
      if (batchRemainingRef.current > 0) {
        batchRemainingRef.current -= 1;
        if (batchRemainingRef.current === 0) dbg.mark("flight-batch-complete");
      }
      reportFlight();
    },
    [dbg, reportFlight],
  );

  // §C finishAllFlightsImmediately: snap every in-flight clone to its end,
  // remove the clones, force the slots filled, and reconcile the counter.
  // Returns true if anything was flushed (drives the conditional §F step).
  const finishAllFlightsImmediately = useCallback(() => {
    const ids = [...inFlightIdsRef.current];
    if (ids.length === 0) return false;
    dbg.mark("flights-flushed");
    const nextSettled = new Set(settledRef.current);
    ids.forEach((id) => nextSettled.add(id));
    settledRef.current = nextSettled;
    inFlightIdsRef.current.clear();
    batchRemainingRef.current = 0;
    setSettledIds(nextSettled);
    setFlights([]); // unmounting clones stops their animations via cleanup
    setPulsingIds(new Set()); // no pulse on a forced finish
    reportFlight();
    return true;
  }, [dbg, reportFlight]);

  // Mount the clone + begin the flight. The imperative animate() lives in
  // FlightClone; this only measures and registers the record.
  const launchFlight = useCallback(
    (skill: Skill, sourceEl: HTMLElement | null) => {
      if (inFlightIdsRef.current.has(skill.id) || settledRef.current.has(skill.id)) {
        return;
      }
      // Reduced motion (or no measurable source): no clone, slot fades, no pulse,
      // launch/land marks fire back-to-back (§E).
      if (reducedMotion || !sourceEl) {
        dbg.mark("flight-launch");
        settle(skill.id, { pulse: false });
        return;
      }
      dbg.mark("flight-measure");
      const targetEl = panelRef.current?.querySelector<HTMLElement>(
        `[data-phase-slot="${targetPhaseId(skill.id)}"]`,
      );
      if (!targetEl) {
        settle(skill.id, { pulse: false });
        return;
      }
      const from = rectOf(sourceEl);
      const begin = () => {
        inFlightIdsRef.current.add(skill.id);
        setFlights((prev) => [
          ...prev,
          { id: skill.id, label: skill.title || skill.name, from, to: rectOf(targetEl) },
        ]);
        reportFlight();
      };
      // The fan is a fixed bottom sheet (covers ~70vh), so a slot that's
      // off-screen OR sitting in the lower viewport is hidden behind the sheet —
      // flying a clone there would clip at the bottom edge. Scroll such a slot up
      // into the region above the sheet (block: "start" + the slot's
      // scroll-margin-top), then re-measure next frame so the clone targets the
      // now-visible rect (§D card-flight step 2). The source is in the fixed
      // sheet, so the scroll never moves it.
      const slotTop = targetEl.getBoundingClientRect().top;
      const sheetCovered = slotTop > window.innerHeight * 0.3;
      if (isOffscreen(targetEl) || sheetCovered) {
        targetEl.scrollIntoView({ behavior: "instant", block: "start" });
        requestAnimationFrame(begin);
      } else {
        begin();
      }
    },
    [dbg, reducedMotion, reportFlight, settle, targetPhaseId],
  );

  // Single card-flight: optimistic commit (dims the fan card this frame), then
  // launch. Re-tap of a collected or in-flight card is a no-op (§B).
  const flyCard = useCallback(
    (skill: Skill, sourceEl: HTMLElement | null) => {
      if (collectedRef.current.has(skill.id) || inFlightIdsRef.current.has(skill.id)) {
        return;
      }
      dbg.mark("flight-tap");
      onCollect(skill.id);
      collectedRef.current = new Set(collectedRef.current).add(skill.id);
      launchFlight(skill, sourceEl);
    },
    [dbg, launchFlight, onCollect],
  );

  // Add-all: commit every uncollected card up front (all fan cards dim), then
  // launch a staggered batch of clones (§D: 70 ms/flight). Reduced motion fills
  // with no stagger and no clone (§E).
  const flyAll = useCallback(
    (sources: Map<string, HTMLElement>) => {
      const targets = deck.skills.filter(
        (s) =>
          !collectedRef.current.has(s.id) &&
          !inFlightIdsRef.current.has(s.id) &&
          !settledRef.current.has(s.id),
      );
      if (targets.length === 0) return;
      dbg.mark("flight-tap");
      batchRemainingRef.current = targets.length;
      let committed = collectedRef.current;
      targets.forEach((s) => {
        onCollect(s.id);
        committed = new Set(committed).add(s.id);
      });
      collectedRef.current = committed;
      reportFlight();
      const staggerMs =
        FLIGHT_STAGGER_MS * (dbg.enabled && dbg.speed ? 1 / dbg.speed : 1);
      targets.forEach((skill, i) => {
        const src = sources.get(skill.id) ?? null;
        if (reducedMotion) {
          launchFlight(skill, src);
        } else {
          window.setTimeout(() => launchFlight(skill, src), i * staggerMs);
        }
      });
    },
    [dbg, deck.skills, launchFlight, onCollect, reducedMotion, reportFlight],
  );

  // Publish the flush so closeDeck can run it before the dismiss (§C).
  useEffect(() => {
    flushFlightsRef.current = finishAllFlightsImmediately;
    return () => {
      flushFlightsRef.current = null;
    };
  }, [finishAllFlightsImmediately, flushFlightsRef]);

  // Test bridge: jsdom never settles framer's imperative animate(), so Vitest
  // drives landings/flushes here (mirrors __deckMorphComplete).
  useEffect(() => {
    window.__deckFlight = {
      inFlight: () => [...inFlightIdsRef.current],
      landAll: () =>
        [...inFlightIdsRef.current].forEach((id) => settle(id, { pulse: true })),
      finishAll: () => {
        finishAllFlightsImmediately();
      },
      gatherInFlight: () => gatherFlightsRef.current.map((f) => f.id),
      landGather: () =>
        gatherFlightsRef.current.forEach((f) => onGatherLand(f.id)),
    };
    return () => {
      delete window.__deckFlight;
    };
  }, [settle, finishAllFlightsImmediately, onGatherLand]);

  // Chrome morph: the layoutId rectangle animates chrome only (no declarative
  // transform on it, §E); content motion lives on the child wrappers below.
  // Reduced motion omits the layoutId and crossfades the panel over 120 ms,
  // firing the same completion callback order (§E) — the open/close handlers
  // fire those synchronously, so no layout callback is wired in that mode.
  const layoutId = reducedMotion ? undefined : `deck-blueprint-${deck.slug}`;
  const contentState = phase === "builder-open" ? "visible" : "hidden";
  const settledCount = settledIds.size;
  // Deck completion (§6): every card has settled into its slot. The celebratory
  // completion panel mounts on this edge; "keep editing" dismisses it back to the
  // builder for the rest of the session (re-arms per deck — BuilderPanel is keyed
  // by slug). No new collection state — derived purely from settledIds.
  const deckComplete = deck.skills.length > 0 && settledCount === deck.skills.length;
  const [completionDismissed, setCompletionDismissed] = useState(false);
  // Settled cards in stable deck order for the overlay row — the persistent
  // "here's your deck so far" strip. Off settledIds (slot truth), not the
  // optimistic commit, so a card appears here the same frame its slot fills.
  const settledSkills = useMemo(
    () => deck.skills.filter((s) => settledIds.has(s.id)),
    [deck.skills, settledIds],
  );

  // Launch the completion gather on the completion edge (§6). The effect runs
  // after the commit that mounts DeckCompletionPanel, so both the settled slot
  // cards and the stack target ([data-completion-target]) are in the DOM —
  // measure synchronously (no rAF) and register a FlightRecord per settled card
  // flying into the stack's rect. One-shot per mounted deck. Reduced motion (or
  // a missing target/source) skips straight to the reveal, matching the
  // existing flight reduced-motion path.
  useEffect(() => {
    if (!deckComplete || completionDismissed || gatherFiredRef.current) return;
    gatherFiredRef.current = true;
    // On a hydrated full-deck mount this one-shot can fire before the shell's
    // matchMedia effect has propagated `reducedMotion` (child effects run before
    // parent effects), so read the query directly here as the source of truth.
    const prefersReduced =
      reducedMotion ||
      (typeof window !== "undefined" &&
        (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false));
    if (prefersReduced) {
      setRevealCompletion(true);
      return;
    }
    const targetEl = panelRef.current?.querySelector<HTMLElement>(
      "[data-completion-target]",
    );
    const sources = settledSkills
      .map((s) => {
        const el = panelRef.current?.querySelector<HTMLElement>(
          `[data-testid="deck-slot-card-${s.id}"]`,
        );
        return el ? { skill: s, el } : null;
      })
      .filter((x): x is { skill: Skill; el: HTMLElement } => x !== null);
    if (!targetEl || sources.length === 0) {
      setRevealCompletion(true);
      return;
    }
    const to = rectOf(targetEl);
    const records = sources.map(({ skill, el }) => ({
      id: `gather-${skill.id}`,
      label: skill.title || skill.name,
      from: rectOf(el),
      to,
    }));
    gatherRemainingRef.current = records.length;
    setGatherFlights(records);
  }, [deckComplete, completionDismissed, reducedMotion, settledSkills]);

  return (
    <motion.section
      ref={panelRef}
      className="deck-builder"
      data-testid="deck-builder-panel"
      aria-label={`${deck.name} builder`}
      layoutId={layoutId}
      transition={dbg.scaleT(
        reducedMotion ? { duration: 0.12 } : MORPH_LAYOUT_TRANSITION,
      )}
      // Open morph land (§D open step 3 / §F): gate the boundary so stepped mode
      // can freeze it; in auto/disabled mode gate() resolves immediately. The
      // Vitest bridge calls onOpenMorphComplete directly, bypassing the gate.
      onLayoutAnimationComplete={
        reducedMotion
          ? undefined
          : () => {
              void dbg.gate("blueprint-morph-in").then(onOpenMorphComplete);
            }
      }
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
            {settledCount} / {deck.skills.length} collected
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

      {/* Deck-complete output panel (§6): on the completion edge the deck gathers
          and flips (card-flip primitive, scaled up) to reveal the output surface
          — install command, project.json download, share. Gated on the morph
          being settled (contentState) so it never paints during the morph-back. */}
      {contentState === "visible" && deckComplete && !completionDismissed ? (
        <DeckCompletionPanel
          deck={deck}
          reducedMotion={reducedMotion}
          revealed={revealCompletion}
          onKeepEditing={() => {
            setCompletionDismissed(true);
            setGatherFlights([]); // drop any clones mid-gather on dismiss
          }}
        />
      ) : null}

      <motion.div
        className="deck-slot-columns"
        data-testid="deck-slot-columns"
        custom={1}
        variants={contentVariants}
        initial="hidden"
        animate={contentState}
        exit={contentExit}
      >
        {deck.phases.map((phase, index) => {
          const slotSkills = deck.skills.filter(
            (s) => settledIds.has(s.id) && slotColumnIndex(s.id) === index,
          );
          return (
            <div
              className="deck-slot-column"
              key={phase.key}
              data-phase-slot={phase.key}
              data-testid={`deck-slot-${phase.key}`}
            >
              <p className="deck-slot-label">{phase.name}</p>
              {slotSkills.length === 0 ? (
                <p className="deck-slot-empty">empty</p>
              ) : (
                <ul className="deck-slot-cards">
                  {slotSkills.map((s) => (
                    <li
                      key={s.id}
                      className="deck-slot-card"
                      data-testid={`deck-slot-card-${s.id}`}
                      data-pulse={String(pulsingIds.has(s.id))}
                    >
                      <span className="deck-slot-card-label">{s.title || s.name}</span>
                      <button
                        type="button"
                        className="deck-slot-card-expand"
                        data-testid={`deck-slot-card-expand-${s.id}`}
                        aria-label={`Expand ${s.title || s.name}`}
                        onClick={() => expandCard(s.id)}
                      >
                        <Maximize2 size={11} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* In-deck overlay row (§2 "OVERLAYS"): a persistent, compact strip of the
          cards settled into the deck so far, always visible in the builder
          independent of whether the pack fan is torn open — the slot columns
          group by phase and the fan badges only show while the pack is open, so
          this is the single at-a-glance "here's your deck" readout. Driven off
          settledIds (never the optimistic commit, matching the slots) and reuses
          pulsingIds for a one-shot pulse the frame a card lands. */}
      <motion.div
        className="deck-overlay-row"
        data-testid="deck-overlay-row"
        custom={2}
        variants={contentVariants}
        initial="hidden"
        animate={contentState}
        exit={contentExit}
      >
        <p className="deck-overlay-label">In deck</p>
        {settledSkills.length === 0 ? (
          <p className="deck-overlay-empty" data-testid="deck-overlay-empty">
            No cards collected yet — tear the pack and tap a card.
          </p>
        ) : (
          <ul className="deck-overlay-chips">
            {settledSkills.map((s) => (
              <li
                key={s.id}
                className="deck-overlay-chip"
                data-testid={`deck-overlay-chip-${s.id}`}
                data-pulse={String(pulsingIds.has(s.id))}
              >
                {s.title || s.name}
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <BuilderPackFlow
        deck={deck}
        collected={collected}
        wantedIds={wantedIds}
        contentState={contentState}
        // The fanned cards are the card-flight source: a tap feeds the tapped
        // skill + its wrapper element straight into the existing flyCard handler;
        // "Collect all" (rendered inside the fan) hands flyAll the fan sources.
        onCollect={flyCard}
        onCollectAll={flyAll}
        onExpand={expandCard}
      />

      {/* Locked/unlocked CLI panel (§2 "🔒 fill core" / §6): the always-visible
          install-command destination. Visible from the first frame in a locked
          state ("🔒 N more to unlock") so the output is never a surprise (§ design
          principle "Browsing always converges on output"). Unlocks — revealing
          the command + copy affordance — once every deck card has settled. Locked
          status is derived from settledIds vs the deck requirement (all
          deck.skills settled), reusing the existing collection state; no new state
          is introduced. A core/overlay split can refine the requirement later. */}
      <BuilderCliPanel
        deck={deck}
        settledCount={settledCount}
        contentState={contentState}
      />

      <FlightLayer flights={flights} reducedMotion={reducedMotion} dbg={dbg} onLand={settle} />
      {/* Completion gather clones (§6): a separate FlightLayer so the gather's
          onLand (trigger the flip) never crosses the card-flight settle path. */}
      <FlightLayer
        flights={gatherFlights}
        reducedMotion={reducedMotion}
        dbg={dbg}
        onLand={onGatherLand}
      />
    </motion.section>
  );
}

/**
 * BuilderCliPanel — the locked/unlocked install-command destination pinned at
 * the bottom of the builder (§2 "🔒 fill core", §6 deck completion / output).
 * It is visible from the first frame so the output is never a surprise: while
 * the deck is incomplete it shows the install command in a locked state with a
 * "🔒 N more to unlock" hint; once every card has settled it unlocks, revealing
 * the command and a copy button. Locked/unlocked is derived purely from
 * settledCount vs the deck's card requirement — no new collection state.
 */
function BuilderCliPanel({
  deck,
  settledCount,
  contentState,
}: {
  deck: Deck;
  settledCount: number;
  contentState: "visible" | "hidden";
}) {
  const required = deck.skills.length;
  const remaining = Math.max(0, required - settledCount);
  const unlocked = required > 0 && remaining === 0;
  const command = `npx skillpacks install-deck ${deck.slug}`;

  // Transient "Copied" affordance feedback. Cleared on a timer so a second copy
  // re-flashes it; best-effort because clipboard access can reject (no HTTPS /
  // permission denied) — the command stays visible to copy manually.
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    },
    [],
  );
  const handleCopy = useCallback(() => {
    void navigator.clipboard?.writeText(command).then(
      () => {
        setCopied(true);
        if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
      },
      () => {
        /* clipboard unavailable; the command text stays selectable. */
      },
    );
  }, [command]);

  return (
    <motion.div
      className="deck-cli-panel"
      data-testid="deck-cli-panel"
      data-unlocked={String(unlocked)}
      custom={4}
      variants={contentVariants}
      initial="hidden"
      animate={contentState}
      exit={contentExit}
    >
      <code className="deck-cli-command" data-testid="deck-cli-command">
        {command}
      </code>
      {unlocked ? (
        <button
          type="button"
          className="deck-cli-copy"
          data-testid="deck-cli-copy"
          onClick={handleCopy}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      ) : (
        <span className="deck-cli-lock" data-testid="deck-cli-lock">
          🔒 {remaining} more to unlock
        </span>
      )}
    </motion.div>
  );
}

/**
 * DeckCompletionPanel — the celebratory deck-complete output surface (§6). When
 * every card has settled the deck "completes": the panel gathers in (scale, the
 * collapse-to-target read) and flips (the SkillCard card-flip idiom — rotateY +
 * backface-visibility, scaled up; "promote, don't rewrite") to reveal its back,
 * which emits the canonical `install-deck` command, a `project.json` download
 * mirroring the `.agents/project.json` shape, a share affordance, and a "keep
 * editing" dismiss. The back face is always in the DOM (hidden by backface) so
 * the output is testable independent of the flip frame. The flip is sequenced by
 * the parent: `revealed` flips to the output only after the per-slot gather
 * clones land (§6). Reduced motion reveals immediately (no gather/flip, §E).
 */
function DeckCompletionPanel({
  deck,
  reducedMotion,
  revealed,
  onKeepEditing,
}: {
  deck: Deck;
  reducedMotion: boolean;
  revealed: boolean;
  onKeepEditing: () => void;
}) {
  const dbg = useDebug();
  const command = `npx skillpacks install-deck ${deck.slug}`;

  // Transient affordance feedback for share (link copied) and download, mirroring
  // the CLI panel's best-effort clipboard pattern. Cleared on a timer.
  const [shared, setShared] = useState(false);
  const shareTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);
    },
    [],
  );

  const handleShare = useCallback(() => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/deck/${deck.slug}`
        : `/deck/${deck.slug}`;
    void navigator.clipboard?.writeText(url).then(
      () => {
        setShared(true);
        if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);
        shareTimerRef.current = window.setTimeout(() => setShared(false), 1500);
      },
      () => {
        /* clipboard unavailable; the deck URL is still the slug route. */
      },
    );
  }, [deck.slug]);

  const handleDownload = useCallback(() => {
    const json = buildDeckProjectJson(deck);
    try {
      if (typeof URL.createObjectURL !== "function") return;
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "project.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* Blob/anchor download unavailable; the command path still installs. */
    }
  }, [deck]);

  return (
    <motion.div
      className="deck-completion"
      data-testid="deck-completion"
      data-revealed={String(revealed)}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.62 }}
      animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={dbg.scaleT(
        reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 26 },
      )}
    >
      <motion.div
        className="deck-completion-card"
        data-completion-target
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={dbg.scaleT(
          reducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
        )}
      >
        <div className="deck-completion-front">
          <p className="deck-completion-eyebrow">Deck complete</p>
          <p className="deck-completion-title">{deck.name}</p>
          <p className="deck-completion-sub">{deck.skills.length} cards stacked</p>
        </div>

        <div className="deck-completion-back">
          <p className="deck-completion-eyebrow">Deck complete · {deck.name}</p>
          <code
            className="deck-completion-command"
            data-testid="deck-completion-command"
          >
            {command}
          </code>
          <div className="deck-completion-actions">
            <button
              type="button"
              className="deck-completion-btn"
              data-testid="deck-completion-download"
              onClick={handleDownload}
            >
              ⬇ project.json
            </button>
            <button
              type="button"
              className="deck-completion-btn"
              data-testid="deck-completion-share"
              onClick={handleShare}
            >
              {shared ? "Link copied ✓" : "Share deck"}
            </button>
            <button
              type="button"
              className="deck-completion-btn is-ghost"
              data-testid="deck-completion-keep"
              onClick={onKeepEditing}
            >
              Keep editing
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * BuilderPackFlow — the tear-open booster-pack ritual wired into the builder.
 * Drives the shared PackFlowPhase machine via usePackFlow() (src/components/
 * PackRitual.tsx, §C) and renders the deck-as-pack SealedPack plus the shared
 * PackFlowSheet (BottomSheet → PackOpener). The fan's cards are the card-flight
 * source — PackOpener's onCollect feeds the builder's flyCard.
 *
 * Structure note: the SealedPack tear affordance lives inside the staggered
 * content wrapper (custom={2}, contentVariants — matching the old .deck-shelf),
 * but the BottomSheet is a sibling OUTSIDE that wrapper. A motion content
 * wrapper keeps a `transform` at rest, which would become the containing block
 * for the sheet's `position: fixed` scrim/drawer and break full-viewport
 * layout; keeping the sheet out of the transformed subtree avoids that. Both
 * sit in one LayoutGroup so the shared `pack-card-${slug}` layoutId morph
 * between the SealedPack card and PackOpener's card 0 still fires.
 */
function BuilderPackFlow({
  deck,
  collected,
  wantedIds,
  contentState,
  onCollect,
  onCollectAll,
  onExpand,
}: {
  deck: Deck;
  collected: Set<string>;
  wantedIds?: Set<string>;
  contentState: "visible" | "hidden";
  onCollect: (skill: Skill, sourceEl: HTMLElement | null) => void;
  onCollectAll: (sources: Map<string, HTMLElement>) => void;
  onExpand: (id: string) => void;
}) {
  const flow = usePackFlow();
  const {
    phase,
    phaseRef,
    openedPacks,
    isSheetOpen,
    setPhase,
    setActivePack,
    setOpenMorphComplete,
    handleOpen,
    handleClose,
  } = flow;

  const headerRef = useRef<HTMLDivElement>(null);
  const targetPackRef = useRef<SealedPackHandle>(null);

  // When the builder leaves builder-open (Back / dismiss), the content wrapper
  // hides — snap the ritual shut so an open sheet never dangles through the
  // morph-back. closeDeck already flushed in-flight clones before this fires.
  useEffect(() => {
    if (contentState === "hidden" && phaseRef.current !== "sealed") {
      setActivePack(null);
      setPhase("sealed");
      setOpenMorphComplete(true);
    }
  }, [contentState, phaseRef, setActivePack, setPhase, setOpenMorphComplete]);

  // Test bridge: jsdom can't perform the SealedPack tear gesture, so Vitest
  // drives the ritual through this hook (mirrors __deckFlight / __deckMorphComplete).
  // It is also the open affordance the Playwright flight specs use to fan the
  // pack before tapping a card.
  useEffect(() => {
    window.__deckPack = {
      open: () =>
        handleOpen(deck.slug, { x: window.innerWidth / 2, y: window.innerHeight / 2 }),
      close: () => handleClose(),
      phase: () => phaseRef.current,
    };
    return () => {
      delete window.__deckPack;
    };
  }, [handleOpen, handleClose, phaseRef, deck.slug]);

  return (
    <LayoutGroup>
      <motion.div
        className="deck-pack-flow"
        data-testid="deck-pack-flow"
        custom={3}
        variants={contentVariants}
        initial="hidden"
        animate={contentState}
        exit={contentExit}
      >
        <span className="deck-debug" data-testid="deck-pack-phase" hidden>
          {phase}
        </span>
        <SealedPack
          ref={targetPackRef}
          name={deck.slug}
          skillCount={deck.skills.length}
          previewSkill={deck.skills[0] ?? null}
          onOpeningApex={flow.handleOpeningApex}
          onOpen={(origin) => handleOpen(deck.slug, origin)}
          onTear={() => flow.handleTear(deck.slug)}
          onCardSettleComplete={flow.handleCardSettleComplete}
          apexAlignRef={headerRef}
          autoOpenOnTear
          isOpened={openedPacks.has(deck.slug)}
          isDrawerOpen={isSheetOpen}
          flowPhase={phase}
        />
        <div className="deck-pack-flow-aside" ref={headerRef}>
          <p className="deck-pack-flow-hint">
            Tear the pack to fan its cards, then tap one to collect it into its phase slot.
          </p>
        </div>
      </motion.div>

      <PackFlowSheet
        flow={flow}
        packName={deck.name}
        skills={deck.skills}
        onCollect={onCollect}
        collectedIds={collected}
        wantedIds={wantedIds}
        onCollectAll={onCollectAll}
        onExpand={onExpand}
        disableSharedMorph
      />
    </LayoutGroup>
  );
}

/**
 * FlightLayer — the fixed, pointer-events-none clone overlay (§ Mechanism
 * Decision). Portaled to <body> so a clone never paints under the builder's
 * scrim/slot strip or gets clipped by an ancestor's overflow. z-[70] per the
 * lifecycle map. Reduced motion mounts no clones (the slot fade covers it).
 */
function FlightLayer({
  flights,
  reducedMotion,
  dbg,
  onLand,
}: {
  flights: FlightRecord[];
  reducedMotion: boolean;
  dbg: ReturnType<typeof useDebug>;
  onLand: (id: string, opts: { pulse: boolean }) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || reducedMotion || flights.length === 0) return null;
  return createPortal(
    <div className="deck-flight-layer" data-testid="deck-flight-layer" aria-hidden>
      {flights.map((flight) => (
        <FlightClone key={`flight-${flight.id}`} flight={flight} dbg={dbg} onLand={onLand} />
      ))}
    </div>,
    document.body,
  );
}

function FlightClone({
  flight,
  dbg,
  onLand,
}: {
  flight: FlightRecord;
  dbg: ReturnType<typeof useDebug>;
  onLand: (id: string, opts: { pulse: boolean }) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Non-uniform scale: the source is now a tall fan card (180×252) while a slot
  // is wide and short. A single width-ratio scale would balloon the clone's
  // height past the viewport (clip). Scaling each axis to the target box makes
  // the clone converge onto the slot footprint instead.
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);

  // Latest debug context + land callback via refs so the one-shot flight effect
  // below can run on mount only. The provider's context value changes identity
  // on every mark()/report() (reachedSteps/runtime state), so depending on `dbg`
  // would re-fire the effect and its cleanup would stop the animation mid-flight,
  // freezing the clone — the same stale-closure guard PackOpener uses.
  const dbgRef = useRef(dbg);
  dbgRef.current = dbg;
  const onLandRef = useRef(onLand);
  onLandRef.current = onLand;

  useLayoutEffect(() => {
    let stopped = false;
    const stops: Array<{ stop: () => void }> = [];

    const dx = rectCenterX(flight.to) - rectCenterX(flight.from);
    const dy = rectCenterY(flight.to) - rectCenterY(flight.from);
    const targetScaleX = flight.from.width > 0 ? flight.to.width / flight.from.width : 1;
    const targetScaleY = flight.from.height > 0 ? flight.to.height / flight.from.height : 1;

    void (async () => {
      // flight-launch gate (§F): freeze the launch frame in stepped mode.
      await dbgRef.current.gate("flight-launch");
      if (stopped) return;
      const spring = dbgRef.current.scaleT(FLIGHT_SPRING);
      const ax = animate(x, dx, spring);
      stops.push(ax);
      stops.push(animate(y, dy, spring));
      stops.push(animate(scaleX, targetScaleX, spring));
      stops.push(animate(scaleY, targetScaleY, spring));
      await ax; // x finishing ≈ the flight landing
      if (stopped) return;
      // flight-land gate (§F): freeze the landing frame in stepped mode.
      await dbgRef.current.gate("flight-land");
      if (stopped) return;
      onLandRef.current(flight.id, { pulse: true });
    })();

    return () => {
      stopped = true;
      stops.forEach((s) => s.stop());
    };
    // One-shot on mount: flight geometry is fixed; latest dbg/onLand via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="deck-flight-clone"
      data-testid={`deck-flight-clone-${flight.id}`}
      style={{
        position: "fixed",
        left: flight.from.left,
        top: flight.from.top,
        width: flight.from.width,
        height: flight.from.height,
        x,
        y,
        scaleX,
        scaleY,
      }}
    >
      {flight.label}
    </motion.div>
  );
}
