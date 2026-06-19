"use client";

/*
 * DeckDebugHarness — mounts the animation debug harness (DebugProvider +
 * DebugPanel) on the deck-builder routes, per animation-plan-deck-builder.md §F.
 *
 * DeckTableShell already routes its authored morph transitions through
 * `dbg.scaleT`, so providing the context is purely additive — speed scaling and
 * stepping primitives light up with zero rework in the shell. The deck drivers
 * and the deck-shell/builder runtime reporting live HERE, in a bridge that reads
 * the shell's rendered debug testids and drives its real DOM affordances. That
 * keeps DeckTableShell free of any debug-only branching.
 *
 * Scope: the bridge MARKS the §F blueprint-morph step boundaries from observed
 * phase transitions, reports the deck-shell/builder runtime slice, and registers
 * the imperative drivers (openDeck/dismissDeck/flyCard/flyAll/reset). The morph
 * boundaries now also `gate()` in stepped mode (wired inside DeckTableShell), and
 * the card-flight slice marks FLIGHT_STEPS + reports the flight-layer slice from
 * BuilderPanel directly (it owns the clones and already has the debug context),
 * so the flight drivers here only need to tap the shell's real DOM affordances.
 */

import { useEffect, useRef, type ReactNode } from "react";

import DeckTableShell from "@/deck-builder/DeckTableShell";
import { DebugProvider, useDebug } from "@/components/debug/DebugController";
import DebugPanel from "@/components/debug/DebugPanel";

interface DeckDebugHarnessProps {
  hardLoad?: boolean;
  initialDeckSlug?: string | null;
}

export default function DeckDebugHarness(props: DeckDebugHarnessProps) {
  return (
    <DebugProvider>
      <DeckDebugBridge>
        <DeckTableShell {...props} />
      </DeckDebugBridge>
      <DebugPanel />
    </DebugProvider>
  );
}

// Step marks emitted per observed DeckFlowPhase. Each phase contributes the
// boundaries that have demonstrably elapsed once that phase is reached; the
// builder-open set is the no-origin hard-load path too (it enters builder-open
// directly), so its mounts/morph-land steps mark either way.
const OPEN_MORPHING_STEPS = ["blueprint-tap", "url-push", "builder-mount"];
const OPEN_LANDED_STEPS = ["builder-mount", "blueprint-morph-in", "builder-content-in"];
const CLOSE_STEPS = ["dismiss-trigger", "builder-exit"];
const CLOSE_LANDED_STEPS = ["blueprint-morph-out", "table-restored"];

function DeckDebugBridge({ children }: { children: ReactNode }) {
  const dbg = useDebug();
  const { enabled, mark, report, registerDrivers } = dbg;

  const containerRef = useRef<HTMLDivElement>(null);
  const lastPhaseRef = useRef<string | null>(null);
  // Remembers the active slug so closingSlug can be reported during
  // builder-dismissing, when the shell has already cleared activeDeckSlug.
  const lastSlugRef = useRef<string | null>(null);

  // Drivers act on the shell's real DOM affordances (the same surfaces a user
  // taps), so the morph runs through its production callbacks verbatim.
  useEffect(() => {
    const root = () => containerRef.current;
    const clickBack = () =>
      root()
        ?.querySelector<HTMLButtonElement>('[data-testid="deck-back"]')
        ?.click();

    registerDrivers({
      openDeck: () => {
        root()
          ?.querySelector<HTMLButtonElement>(
            '[data-testid^="deck-blueprint-"]:not([disabled])',
          )
          ?.click();
      },
      dismissDeck: clickBack,
      // flyCard taps the first uncollected fan card (the same surface a user
      // taps), so the real flyCard → optimistic-commit → clone path runs. The
      // fan lives in the body-portaled sheet (outside the harness container), so
      // query the document rather than the local root.
      flyCard: () => {
        document
          .querySelector<HTMLElement>(
            '.deck-fan-card[data-collected="false"]',
          )
          ?.click();
      },
      // flyAll taps the "Collect all" button inside the fan, launching the
      // staggered batch (also in the body portal — query the document).
      flyAll: () => {
        document
          .querySelector<HTMLButtonElement>('[data-testid="deck-collect-all"]:not([disabled])')
          ?.click();
      },
      // DebugProvider.reset() already cleared the machine runtime; returning the
      // DOM to the table keeps the shell and the graph in agreement.
      reset: clickBack,
    });
  }, [registerDrivers]);

  // Bridge observed phase → step marks + runtime report. Re-runs when `enabled`
  // flips so enabling the panel mid-flow syncs the current state immediately.
  // `mark`/`report` are stable controller callbacks, so reporting never
  // re-triggers this effect (no feedback loop).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const readText = (testid: string) =>
      container
        .querySelector(`[data-testid="${testid}"]`)
        ?.textContent?.trim() ?? null;
    const readSlug = () => {
      const value = readText("deck-active-slug");
      return value && value !== "(none)" ? value : null;
    };
    const readCount = () => {
      const match = readText("deck-collected-count")?.match(/^(\d+)/);
      return match ? Number(match[1]) : 0;
    };
    const markAll = (ids: string[]) => ids.forEach((id) => mark(id));

    const sync = (force: boolean) => {
      if (!enabled) return;
      const phase = readText("deck-phase");
      if (!phase) return; // shell still in its loading branch
      const prev = lastPhaseRef.current;
      if (!force && phase === prev) return;
      lastPhaseRef.current = phase;

      const slug = readSlug();
      if (slug) lastSlugRef.current = slug;
      const collectedCount = readCount();

      switch (phase) {
        case "blueprint-morphing":
          markAll(OPEN_MORPHING_STEPS);
          report({
            machine: {
              deckShell: { phase, activeDeckSlug: slug, closingSlug: null, reducedMotion },
              builder: { mounted: true, morphing: true, contentState: "hidden", collectedCount },
            },
          });
          break;
        case "builder-open":
          markAll(OPEN_LANDED_STEPS);
          report({
            machine: {
              deckShell: { phase, activeDeckSlug: slug, closingSlug: null, reducedMotion },
              builder: { mounted: true, morphing: false, contentState: "visible", collectedCount },
            },
          });
          break;
        case "builder-dismissing":
          markAll(CLOSE_STEPS);
          report({
            machine: {
              deckShell: {
                phase,
                activeDeckSlug: null,
                closingSlug: slug ?? lastSlugRef.current,
                reducedMotion,
              },
              builder: { mounted: true, morphing: true, contentState: "hidden", collectedCount },
            },
          });
          break;
        case "table":
        case "table-restored":
          if (prev === "builder-dismissing") markAll(CLOSE_LANDED_STEPS);
          lastSlugRef.current = null;
          report({
            machine: {
              deckShell: { phase: "table", activeDeckSlug: null, closingSlug: null, reducedMotion },
              builder: { mounted: false, morphing: false, contentState: "hidden", collectedCount: 0 },
            },
          });
          break;
      }
    };

    sync(true);
    // Subscribe only while the harness is on, so debug-off is strictly
    // zero-overhead. The effect re-runs when `enabled` flips (it is a dep), so
    // enabling the panel mid-flow both syncs current state and starts observing.
    if (!enabled) return;
    const observer = new MutationObserver(() => sync(false));
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [enabled, mark, report]);

  return <div ref={containerRef}>{children}</div>;
}
