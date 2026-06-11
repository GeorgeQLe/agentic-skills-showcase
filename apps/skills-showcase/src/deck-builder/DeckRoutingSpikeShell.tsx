"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const TABLE_SPIKE_PATH = "/prototype/deck-routing-spike";
const DEFAULT_DECK_SLUG = "devtool-afps";

declare global {
  interface Window {
    __deckRoutingSpikeMounts?: number;
  }
}

function deckSlugFromPath(pathname: string | null): string | null {
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

interface DeckRoutingSpikeShellProps {
  hardLoad?: boolean;
  initialDeckSlug?: string | null;
}

export default function DeckRoutingSpikeShell({
  hardLoad = false,
  initialDeckSlug = null,
}: DeckRoutingSpikeShellProps) {
  const pathname = usePathname();
  const routeDeckSlug = deckSlugFromPath(pathname);
  const mountId = useRef<string | null>(null);
  const [visibleMountId, setVisibleMountId] = useState("(hydrating)");
  const [browserMountCount, setBrowserMountCount] = useState(0);
  const [activeDeckSlug, setActiveDeckSlug] = useState<string | null>(
    initialDeckSlug,
  );
  const [popCount, setPopCount] = useState(0);
  const [events, setEvents] = useState<string[]>([
    hardLoad && initialDeckSlug
      ? `hard-load:/deck/${initialDeckSlug}`
      : `table:${TABLE_SPIKE_PATH}`,
  ]);

  const phase = activeDeckSlug ? "builder-open" : "table";

  const pushEvent = useCallback((event: string) => {
    setEvents((current) => [event, ...current].slice(0, 8));
  }, []);

  useEffect(() => {
    if (!mountId.current) {
      mountId.current = makeMountId();
    }
    setVisibleMountId(mountId.current);
    window.__deckRoutingSpikeMounts =
      (window.__deckRoutingSpikeMounts ?? 0) + 1;
    setBrowserMountCount(window.__deckRoutingSpikeMounts);
  }, []);

  useEffect(() => {
    pushEvent(`usePathname:${pathname}`);
  }, [pathname, pushEvent]);

  useEffect(() => {
    function handlePopState() {
      const nextDeckSlug = deckSlugFromPath(window.location.pathname);
      setActiveDeckSlug(nextDeckSlug);
      setPopCount((current) => current + 1);
      pushEvent(`popstate:${window.location.pathname}`);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pushEvent]);

  function pushDeckPath(nextDeckSlug: string | null) {
    const nextPath = nextDeckSlug
      ? `/deck/${encodeURIComponent(nextDeckSlug)}`
      : TABLE_SPIKE_PATH;
    window.history.pushState({ deckSlug: nextDeckSlug }, "", nextPath);
    setActiveDeckSlug(nextDeckSlug);
    pushEvent(`pushState:${nextPath}`);
  }

  return (
    <main className="deck-spike-page" data-testid="deck-routing-spike-shell">
      <section className="deck-spike-panel" aria-labelledby="deck-spike-title">
        <p className="deck-spike-eyebrow">Deck-builder routing spike</p>
        <h1 id="deck-spike-title">Next 16 shallow pushState proof</h1>
        <p className="deck-spike-copy">
          This hidden implementation spike checks the load-bearing routing
          assumption from the approved animation plan: native{" "}
          <code>window.history.pushState</code> should update{" "}
          <code>usePathname</code> without unmounting the shared deck shell.
        </p>

        <div className="deck-spike-actions" aria-label="Spike controls">
          <button
            className="button"
            data-testid="spike-open-deck"
            onClick={() => pushDeckPath(DEFAULT_DECK_SLUG)}
            type="button"
          >
            Open Devtool AFPS
          </button>
          <button
            className="button secondary"
            data-testid="spike-close-deck"
            disabled={!activeDeckSlug}
            onClick={() => pushDeckPath(null)}
            type="button"
          >
            Close to spike table
          </button>
          <button
            className="button secondary"
            data-testid="spike-browser-back"
            onClick={() => window.history.back()}
            type="button"
          >
            Browser Back
          </button>
        </div>

        <div className="deck-spike-grid" aria-label="Spike state">
          <StateCell
            label="mount id"
            testId="spike-mount-id"
            value={visibleMountId}
          />
          <StateCell
            label="browser mount count"
            testId="spike-mount-count"
            value={String(browserMountCount)}
          />
          <StateCell
            label="usePathname"
            testId="spike-pathname"
            value={pathname ?? "(null)"}
          />
          <StateCell
            label="route deck"
            testId="spike-route-deck"
            value={routeDeckSlug ?? "(none)"}
          />
          <StateCell
            label="active deck"
            testId="spike-active-deck"
            value={activeDeckSlug ?? "(none)"}
          />
          <StateCell label="phase" testId="spike-phase" value={phase} />
          <StateCell
            label="popstate count"
            testId="spike-pop-count"
            value={String(popCount)}
          />
          <StateCell
            label="entry mode"
            testId="spike-entry-mode"
            value={hardLoad ? "hard-load" : "spike-table"}
          />
        </div>

        <div className="deck-spike-stage" data-phase={phase}>
          <div className="deck-spike-blueprint">
            <span>Devtool AFPS</span>
            <small>blueprint · {activeDeckSlug ? "claimed" : "table"}</small>
          </div>
          {activeDeckSlug ? (
            <div
              className="deck-spike-builder"
              data-testid="spike-builder-panel"
            >
              <strong>{activeDeckSlug}</strong>
              <span>builder-open without route remount</span>
            </div>
          ) : null}
        </div>

        <ol className="deck-spike-events" data-testid="spike-events">
          {events.map((event, index) => (
            <li key={`${event}-${index}`}>{event}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function StateCell({
  label,
  testId,
  value,
}: {
  label: string;
  testId: string;
  value: string;
}) {
  return (
    <div className="deck-spike-cell">
      <span>{label}</span>
      <strong data-testid={testId}>{value}</strong>
    </div>
  );
}
