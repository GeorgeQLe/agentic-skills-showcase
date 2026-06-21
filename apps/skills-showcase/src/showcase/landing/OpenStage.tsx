"use client";

/**
 * OpenStage — Stage 2 of the landing journey (landing redesign Phase 5).
 *
 * Reuses the sealed-pack shelf + PackFlowSheet ritual in PRE-DECK INSPECT MODE
 * (tap = flip, no collect — no onCollect is passed). Beneath the fan sits a
 * workflow/phase ribbon built from the selected deck's phases (e.g.
 * Scan · Align · Ship) hinting where the cards will land at Stage 3. Once every
 * allotment pack is open, the hand-off chooser offers loading the curated
 * starter (/deck/<slug>, hard load) or building in place (→ goToBuild()).
 */

import { Fragment } from "react";
import { LayoutGroup, motion } from "framer-motion";
import Link from "next/link";

import SealedPack from "@/components/SealedPack";
import { usePackFlow, PackFlowSheet } from "@/components/PackRitual";

import type { DomainOption } from "./types";
import type { StageMachine } from "./useStageMachine";

export default function OpenStage({
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
  const { allotment, selectedDeck, domain, phases } = machine;
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

      {phases.length > 0 ? (
        <div className="landing-phase-ribbon" data-testid="landing-phase-ribbon">
          <p className="landing-phase-ribbon-label">Where these cards will go.</p>
          <div className="landing-phase-chips">
            {phases.map((phase, i) => (
              <Fragment key={phase.key}>
                {i > 0 ? (
                  <span className="landing-phase-sep" aria-hidden="true">
                    ·
                  </span>
                ) : null}
                <span
                  className="landing-phase-chip"
                  data-testid={`landing-phase-${phase.key}`}
                >
                  {phase.name}
                </span>
              </Fragment>
            ))}
          </div>
        </div>
      ) : null}

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
