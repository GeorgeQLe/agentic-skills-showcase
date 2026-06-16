"use client";

/*
 * DeckTableShell — the single client owner of the deck-builder lifecycle, per
 * the approved animation plan's Lifecycle Ownership Map
 * (apps/skills-showcase/docs/animation-plan-deck-builder.md §C).
 *
 * This is the motion-free skeleton slice. It reuses the routing primitives
 * proven green by the routing spike (shallow window.history.pushState +
 * popstate + usePathname, with the mount-id-after-hydration fix) and owns the
 * DeckFlowPhase state machine plus per-slug collected-card state. Phase
 * transitions land instantly here; the morphing/dismissing phases exist in the
 * type so the later motion slice attaches animation + completion callbacks
 * without adding new control flow. No layoutId morph or FlightLayer clones yet.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { usePathname } from "next/navigation";

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
  }
}

export function deckSlugFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/deck\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

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
  const [phase, setPhase] = useState<DeckFlowPhase>(
    initialDeckSlug ? "builder-open" : "table",
  );
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

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

  // Open: legal only from `table` (contract A interruption rule). The motion
  // slice sets `blueprint-morphing` here and advances to `builder-open` from
  // onLayoutAnimationComplete; the skeleton lands on `builder-open` instantly.
  const openDeck = useCallback(
    (slug: string) => {
      if (phaseRef.current !== "table") return;
      setPhase("blueprint-morphing");
      ensureCollectedLoaded(slug);
      pushDeckPath(slug);
      setPhase("builder-open");
    },
    [ensureCollectedLoaded],
  );

  // Close: legal from `builder-open`. The motion slice parks on
  // `builder-dismissing` until the morph-back lands; the skeleton restores the
  // table instantly.
  const closeDeck = useCallback(() => {
    if (phaseRef.current !== "builder-open") return;
    setPhase("builder-dismissing");
    pushDeckPath(null);
    setPhase("table");
  }, []);

  // popstate (Back/Forward) — reconcile owned state with the URL the browser
  // restored, without remounting the shell.
  useEffect(() => {
    function handlePopState() {
      const nextDeckSlug = deckSlugFromPath(window.location.pathname);
      if (nextDeckSlug) ensureCollectedLoaded(nextDeckSlug);
      setActiveDeckSlug(nextDeckSlug);
      setPhase(nextDeckSlug ? "builder-open" : "table");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [ensureCollectedLoaded]);

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

      {/* One LayoutGroup wrapping table + builder so the morph slice can attach
          layoutId="deck-blueprint-${slug}" without restructuring. */}
      <LayoutGroup>
        <TableSurface
          decks={decks}
          phase={phase}
          activeDeckSlug={activeDeckSlug}
          onOpen={openDeck}
        />
        {activeDeck ? (
          <BuilderPanel
            deck={activeDeck}
            collectedCardIds={collectedCardIds}
            onCollect={(cardId) => collectCard(activeDeck.slug, cardId)}
            onClose={closeDeck}
          />
        ) : null}
      </LayoutGroup>
    </main>
  );
}

function TableSurface({
  decks,
  phase,
  activeDeckSlug,
  onOpen,
}: {
  decks: Deck[];
  phase: DeckFlowPhase;
  activeDeckSlug: string | null;
  onOpen: (slug: string) => void;
}) {
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
          return (
            <li key={deck.slug}>
              <button
                className="deck-blueprint"
                data-testid={`deck-blueprint-${deck.slug}`}
                data-active={String(isActive)}
                // Blueprint taps are ignored unless phase is `table`
                // (contract A interruption rule).
                disabled={phase !== "table"}
                onClick={() => onOpen(deck.slug)}
                type="button"
              >
                <span className="deck-blueprint-name">{deck.name}</span>
                <small className="deck-blueprint-meta">
                  {deck.skills.length} cards · {deck.phases.length} phases
                </small>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function BuilderPanel({
  deck,
  collectedCardIds,
  onCollect,
  onClose,
}: {
  deck: Deck;
  collectedCardIds: string[];
  onCollect: (cardId: string) => void;
  onClose: () => void;
}) {
  const collected = new Set(collectedCardIds);
  // Skeleton slot model: distribute collected cards across phase columns
  // round-robin so each phase column shows fill. The motion slice replaces
  // this with the card-flight target/slot identity model.
  const collectedSkills = deck.skills.filter((s) => collected.has(s.id));

  return (
    <section
      className="deck-builder"
      data-testid="deck-builder-panel"
      aria-label={`${deck.name} builder`}
    >
      <header className="deck-builder-head">
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
      </header>

      <div className="deck-slot-columns" data-testid="deck-slot-columns">
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
      </div>

      <div className="deck-shelf" data-testid="deck-shelf" aria-label="Card shelf">
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
      </div>
    </section>
  );
}
