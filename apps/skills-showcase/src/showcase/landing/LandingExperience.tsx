"use client";

/*
 * LandingExperience — the pack-first front door (`/`), Phase 4 of the
 * unified-experience build (apps/skills-showcase/docs/unified-experience.md
 * §"The journey" steps 1–4). It replaces the old marketing hero with the
 * journey: a domain picker + CTA that deals the picked domain's sealed-pack
 * allotment, runs each pack through the shared PackFlow ritual in PRE-DECK
 * INSPECT MODE (tap = flip, no collect — no `onCollect` is passed, so there is
 * no slot to fly a card to), and once every allotment pack has been opened
 * surfaces the hand-off chooser (build a custom deck vs load the domain's
 * starter deck → /deck/<slug>).
 *
 * The deck blueprint Table (DeckDebugHarness → DeckTableShell) is mounted below
 * the journey hero as the hand-off destination. The Table is the same surface
 * the routing-spike used to host; promoting it to `/` is why the spike route was
 * deleted. It stays mounted in `table` phase from first paint so the deck-routing
 * contract (stable deck-mount-id across the pushState morph, the blueprint→builder
 * morph, the debug drivers) is preserved verbatim — the journey hero sits above
 * it and never gates it.
 *
 * Scope note: inspect mode collects nothing. Collection is a builder-only
 * behavior (/deck/<slug>); the landing only flips cards for inspection.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import Link from "next/link";

import { useSkillsData, type Skill } from "@/hooks/useSkillsData";
import SealedPack, { type SealedPackHandle } from "@/components/SealedPack";
import { usePackFlow, PackFlowSheet } from "@/components/PackRitual";
import DeckDebugHarness from "@/deck-builder/DeckDebugHarness";

/** A pack rendered as a tearable sealed pack in the allotment shelf. */
interface PackCard {
  slug: string;
  name: string;
  skills: Skill[];
}

interface DomainOption {
  domain: string;
  label: string;
  blurb: string;
  packs: PackCard[];
  skillCount: number;
  /** The canonical "load this" deck for the domain (e.g. business → VARD). */
  starter: { slug: string; name: string } | null;
  /** Every deck in the domain (starter + AFPS), for the blueprint strip. */
  decks: { slug: string; name: string }[];
}

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
      // Starter = the domain's non-AFPS deck (the curated entry, e.g. VARD/ORD);
      // fall back to the AFPS deck for single-deck domains (game).
      const starter = decks.find((d) => !d.slug.endsWith("-afps")) ?? decks[0] ?? null;
      const meta = DOMAIN_META[set.domain] ?? { label: prettyPackName(set.domain), blurb: "" };
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

  if (!data || domains.length === 0) {
    return (
      <main className="landing" data-testid="landing-loading">
        <p className="landing-loading-copy">Loading packs…</p>
      </main>
    );
  }

  return <LandingInner domains={domains} />;
}

function LandingInner({ domains }: { domains: DomainOption[] }) {
  // Default to business (AFPS) per the journey spec.
  const defaultDomain =
    domains.find((d) => d.domain === "business") ?? domains[0];
  const [pickedDomain, setPickedDomain] = useState(defaultDomain.domain);
  const [started, setStarted] = useState(false);

  const active =
    domains.find((d) => d.domain === pickedDomain) ?? defaultDomain;

  const flow = usePackFlow();
  const { openedPacks, activePack, setOpenedPacks, setActivePack, setPhase } = flow;
  const headerRef = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const allotment = active.packs;
  const openedInAllotment = allotment.filter((p) => openedPacks.has(p.slug)).length;
  const allOpened = allotment.length > 0 && openedInAllotment === allotment.length;

  const pick = useCallback(
    (domain: string) => {
      // Switching domains mid-journey resets the ritual so the new allotment
      // opens from sealed (opened-pack state is session-only anyway).
      setPickedDomain(domain);
      setActivePack(null);
      setPhase("sealed");
      setOpenedPacks(new Set());
    },
    [setActivePack, setOpenedPacks, setPhase],
  );

  const begin = useCallback(() => setStarted(true), []);

  const restart = useCallback(() => {
    setStarted(false);
    setActivePack(null);
    setPhase("sealed");
    setOpenedPacks(new Set());
  }, [setActivePack, setOpenedPacks, setPhase]);

  const scrollToTable = useCallback(() => {
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Test bridge: jsdom can't perform the SealedPack tear gesture or framer
  // entrances, so Vitest/e2e drive the journey through this hook (mirrors the
  // __deckPack / __deckFlight idioms in DeckTableShell). Latest closures via a
  // ref so the installed bridge stays fresh without re-installing each render.
  const bridgeRef = useRef({
    state: "picker",
    domain: pickedDomain,
    pick,
    begin,
    restart,
    openAll: () => {},
  });
  bridgeRef.current = {
    state: started ? (allOpened ? "handoff" : "opening") : "picker",
    domain: pickedDomain,
    pick,
    begin,
    restart,
    openAll: () => setOpenedPacks(new Set(allotment.map((p) => p.slug))),
  };
  useEffect(() => {
    const w = window as unknown as { __landing?: unknown };
    w.__landing = {
      state: () => bridgeRef.current.state,
      domain: () => bridgeRef.current.domain,
      pick: (d: string) => bridgeRef.current.pick(d),
      start: () => bridgeRef.current.begin(),
      restart: () => bridgeRef.current.restart(),
      openAll: () => bridgeRef.current.openAll(),
    };
    return () => {
      delete w.__landing;
    };
  }, []);

  return (
    <>
      <main className="landing" data-testid="landing" data-started={String(started)}>
        <header className="landing-hero" ref={headerRef}>
          <p className="landing-eyebrow">G Skillpacks</p>
          <h1 className="landing-title">Open a pack. Build your workflow deck.</h1>
          <p className="landing-lede">
            Sealed skill packs for Claude Code and Codex. Pick a domain, tear open
            its starter packs to see what is inside, then deal them into a deck.
          </p>
        </header>

        {!started ? (
          <section className="landing-picker" aria-labelledby="landing-picker-title">
            <h2 id="landing-picker-title" className="landing-section-title">
              Pick a domain
            </h2>
            <div className="landing-domain-row" role="radiogroup" aria-label="Domain">
              {domains.map((d) => {
                const isPicked = d.domain === pickedDomain;
                return (
                  <button
                    key={d.domain}
                    type="button"
                    role="radio"
                    aria-checked={isPicked}
                    className="landing-domain-tile"
                    data-testid={`landing-domain-${d.domain}`}
                    data-picked={String(isPicked)}
                    onClick={() => pick(d.domain)}
                  >
                    <span className="landing-domain-label">{d.label}</span>
                    <span className="landing-domain-blurb">{d.blurb}</span>
                    <span className="landing-domain-meta">
                      {d.packs.length} packs · {d.skillCount} skills
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="landing-cta"
              data-testid="landing-cta"
              onClick={begin}
            >
              Open your {active.label} starter packs
              <span className="landing-cta-sub" data-testid="landing-cta-sub">
                {active.packs.length} packs · {active.skillCount} skills
              </span>
            </button>
          </section>
        ) : (
          <section className="landing-opening" aria-labelledby="landing-opening-title">
            <div className="landing-opening-head">
              <h2 id="landing-opening-title" className="landing-section-title">
                {active.label} starter packs
              </h2>
              <p className="landing-counter" data-testid="landing-counter">
                Pack {openedInAllotment} of {allotment.length} opened
              </p>
              <button
                type="button"
                className="landing-restart"
                data-testid="landing-restart"
                onClick={restart}
              >
                ← Change domain
              </button>
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

              {/* Inspect mode: no onCollect / onCollectAll, so a fanned card flips
                  on tap and there is no slot to fly to (the /prototype behavior). */}
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

            {allOpened ? (
              <HandoffChooser domain={active} onBuild={scrollToTable} />
            ) : (
              <p className="landing-opening-hint" data-testid="landing-opening-hint">
                Tear a pack along the dotted line to fan its cards. Open all{" "}
                {allotment.length} to choose your deck.
              </p>
            )}
          </section>
        )}
      </main>

      {/* Hand-off destination: the deck blueprint Table. Mounted from first paint
          so the deck-routing contract (mount-id stability, blueprint↔builder
          morph, debug drivers) is preserved at `/`. */}
      <section className="landing-table" data-testid="landing-table" ref={tableRef}>
        <DeckDebugHarness />
      </section>
    </>
  );
}

function HandoffChooser({
  domain,
  onBuild,
}: {
  domain: DomainOption;
  onBuild: () => void;
}) {
  return (
    <div className="landing-handoff" data-testid="landing-handoff">
      <h3 className="landing-handoff-title">Your packs are open — now build.</h3>
      <div className="landing-handoff-choices">
        {domain.starter ? (
          <Link
            className="landing-handoff-primary"
            data-testid="landing-handoff-starter"
            href={`/deck/${encodeURIComponent(domain.starter.slug)}`}
          >
            <span className="landing-handoff-kicker">Load the starter</span>
            <span className="landing-handoff-name">{domain.starter.name}</span>
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
          <span className="landing-handoff-kicker">Build a deck</span>
          <span className="landing-handoff-name">Pick any blueprint</span>
          <span className="landing-handoff-meta">
            Jump to the full deck table below.
          </span>
        </button>
      </div>
      {domain.decks.length > 1 ? (
        <div className="landing-handoff-strip" data-testid="landing-handoff-strip">
          <p className="landing-handoff-strip-label">Other starters</p>
          <ul>
            {domain.decks
              .filter((d) => d.slug !== domain.starter?.slug)
              .map((d) => (
                <li key={d.slug}>
                  <Link
                    data-testid={`landing-handoff-blueprint-${d.slug}`}
                    href={`/deck/${encodeURIComponent(d.slug)}`}
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
