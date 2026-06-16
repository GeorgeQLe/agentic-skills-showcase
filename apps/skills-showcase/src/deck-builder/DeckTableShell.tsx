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
    /**
     * Test bridge for card-flight landings. framer's imperative animate()
     * never settles deterministically under jsdom, so Vitest drives flight
     * landings/flushes through this hook (same idiom as __deckMorphComplete).
     * `landAll` settles in-flight clones as if they landed (with pulse);
     * `finishAll` runs the interrupt flush; `inFlight` reads the live ids.
     */
    __deckFlight?: {
      inFlight: () => string[];
      landAll: () => void;
      finishAll: () => void;
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
  const panelRef = useRef<HTMLElement | null>(null);

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

  // Stable slot identity: a card maps to the same phase column for its whole
  // lifetime (its position in deck.skills, round-robin over phases). This is the
  // flight's continuity target, so it must not depend on collection order.
  const slotColumnIndex = useCallback(
    (skillId: string) => {
      const i = deck.skills.findIndex((s) => s.id === skillId);
      return i < 0 ? 0 : i % deck.phases.length;
    },
    [deck.phases.length, deck.skills],
  );
  const targetPhaseId = useCallback(
    (skillId: string) => deck.phases[slotColumnIndex(skillId)],
    [deck.phases, slotColumnIndex],
  );

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
      // Off-screen slot: instant-scroll into view, then re-measure next frame so
      // the clone targets the on-screen rect (§D card-flight step 2).
      if (isOffscreen(targetEl)) {
        targetEl.scrollIntoView({ behavior: "instant", block: "nearest" });
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
    };
    return () => {
      delete window.__deckFlight;
    };
  }, [settle, finishAllFlightsImmediately]);

  // Chrome morph: the layoutId rectangle animates chrome only (no declarative
  // transform on it, §E); content motion lives on the child wrappers below.
  // Reduced motion omits the layoutId and crossfades the panel over 120 ms,
  // firing the same completion callback order (§E) — the open/close handlers
  // fire those synchronously, so no layout callback is wired in that mode.
  const layoutId = reducedMotion ? undefined : `deck-blueprint-${deck.slug}`;
  const contentState = phase === "builder-open" ? "visible" : "hidden";
  const settledCount = settledIds.size;
  const uncollectedCount = deck.skills.filter((s) => !collected.has(s.id)).length;

  // Gather every shelf card element as a flight source for the add-all batch.
  const collectAll = useCallback(() => {
    const panel = panelRef.current;
    const sources = new Map<string, HTMLElement>();
    panel?.querySelectorAll<HTMLElement>("[data-card-id]").forEach((el) => {
      const id = el.dataset.cardId;
      if (id) sources.set(id, el);
    });
    flyAll(sources);
  }, [flyAll]);

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
          const slotSkills = deck.skills.filter(
            (s) => settledIds.has(s.id) && slotColumnIndex(s.id) === index,
          );
          return (
            <div
              className="deck-slot-column"
              key={phaseId}
              data-phase-slot={phaseId}
              data-testid={`deck-slot-${phaseId}`}
            >
              <p className="deck-slot-label">{phaseId}</p>
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
        <button
          className="deck-collect-all"
          data-testid="deck-collect-all"
          onClick={collectAll}
          disabled={uncollectedCount === 0}
          type="button"
        >
          Collect all {uncollectedCount}
        </button>
        {deck.skills.map((skill: Skill) => {
          const isCollected = collected.has(skill.id);
          return (
            <button
              key={skill.id}
              className="deck-card"
              data-testid={`deck-card-${skill.id}`}
              data-card-id={skill.id}
              data-collected={String(isCollected)}
              // Re-tap of a collected/in-flight card is a no-op (guarded in flyCard).
              onClick={(event) => flyCard(skill, event.currentTarget)}
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

      <FlightLayer flights={flights} reducedMotion={reducedMotion} dbg={dbg} onLand={settle} />
    </motion.section>
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
  const scale = useMotionValue(1);

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
    const targetScale = flight.from.width > 0 ? flight.to.width / flight.from.width : 1;

    void (async () => {
      // flight-launch gate (§F): freeze the launch frame in stepped mode.
      await dbgRef.current.gate("flight-launch");
      if (stopped) return;
      const spring = dbgRef.current.scaleT(FLIGHT_SPRING);
      const ax = animate(x, dx, spring);
      stops.push(ax);
      stops.push(animate(y, dy, spring));
      stops.push(animate(scale, targetScale, spring));
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
        scale,
      }}
    >
      {flight.label}
    </motion.div>
  );
}
