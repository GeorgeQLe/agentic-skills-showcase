"use client";

import { useRef, useLayoutEffect, useState, useMemo, useCallback } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import SkillCard from "./SkillCard";
import type { Skill } from "@/hooks/useSkillsData";
import { useDebug } from "./debug/DebugController";

const COLLAPSE_FADE_DURATION = 0.15;

interface PackOpenerProps {
  skills: Skill[];
  packName: string;
  origin: { x: number; y: number };
  isClosing?: boolean;
  onCollapseComplete?: () => void;
  isRisingToApex?: boolean;
  onApexComplete?: () => void;
  onOpenMorphComplete?: () => void;
}

interface CollapseState {
  targetIndex: number;
  offsets: Array<{ x: number; y: number }>;
  animatedSet: Set<number>;
}

export default function PackOpener({ skills, packName, isClosing, onCollapseComplete, isRisingToApex, onApexComplete, onOpenMorphComplete }: PackOpenerProps) {
  const dbg = useDebug();
  const debugEnabled = dbg.enabled;
  const debugReport = dbg.report;
  const containerRef = useRef<HTMLDivElement>(null);
  const [fanOffsets, setFanOffsets] = useState<Array<{ x: number; y: number }> | null>(null);
  const [collapseState, setCollapseState] = useState<CollapseState | null>(null);
  const card0X = useMotionValue(0);
  const card0Y = useMotionValue(0);

  const collapseCompleteFiredRef = useRef(false);
  const onCollapseCompleteRef = useRef(onCollapseComplete);
  onCollapseCompleteRef.current = onCollapseComplete;
  const onApexCompleteRef = useRef(onApexComplete);
  onApexCompleteRef.current = onApexComplete;

  // Keep the latest debug context in a ref so callbacks running outside render
  // (animation .then / onAnimationComplete) never read stale closures and the
  // collapse useLayoutEffect doesn't churn on speed changes.
  const dbgRef = useRef(dbg);
  dbgRef.current = dbg;

  useLayoutEffect(() => {
    if (!isRisingToApex) return;
    const currentY = card0Y.get();
    animate(card0Y, currentY - 180, dbgRef.current.scaleT({ type: "spring", stiffness: 400, damping: 25 }))
      .then(() => onApexCompleteRef.current?.());
  }, [isRisingToApex, card0Y]);

  const completeCollapse = useCallback(() => {
    if (collapseCompleteFiredRef.current) return;
    collapseCompleteFiredRef.current = true;
    debugReport({
      machine: {
        drawer: {
          collapseCompleteFiredRef: true,
        },
      },
    });
    void (async () => {
      await dbgRef.current.gate("collapse-complete");
      onCollapseCompleteRef.current?.();
    })();
  }, [debugReport]);

  const rotations = useMemo(
    () => skills.map(() => -6 + Math.random() * 12),
    [skills]
  );

  // Fan-out offset measurement
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || fanOffsets) return;
    const cards = Array.from(el.children) as HTMLElement[];
    if (cards.length < 2) return;
    const first = cards[0].getBoundingClientRect();
    setFanOffsets(
      cards.map((c) => {
        const r = c.getBoundingClientRect();
        return { x: first.left - r.left, y: first.top - r.top };
      })
    );
  }, [skills, fanOffsets]);

  // Collapse: measure positions and compute offsets when isClosing flips to true
  useLayoutEffect(() => {
    if (!isClosing || collapseState) return;

    dbgRef.current.mark("collapse-measure");

    if (skills.length <= 1) {
      collapseCompleteFiredRef.current = false;
      completeCollapse();
      return;
    }

    const container = containerRef.current;
    if (!container) {
      collapseCompleteFiredRef.current = false;
      completeCollapse();
      return;
    }

    const cards = Array.from(container.children) as HTMLElement[];

    // Walk up to find the overflow-y-auto scroll container
    let scrollContainer: HTMLElement | null = null;
    let parent = container.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        scrollContainer = parent;
        break;
      }
      parent = parent.parentElement;
    }

    const viewport = scrollContainer?.getBoundingClientRect() ??
      { top: 0, bottom: window.innerHeight };

    // Find the visible top-left card
    let targetIndex = 0;
    let bestTop = Infinity;
    let bestLeft = Infinity;
    const TOP_TOLERANCE = 10;

    cards.forEach((cardEl, i) => {
      const rect = cardEl.getBoundingClientRect();
      if (rect.bottom < viewport.top || rect.top > viewport.bottom) return;
      if (rect.top < bestTop - TOP_TOLERANCE) {
        bestTop = rect.top;
        bestLeft = rect.left;
        targetIndex = i;
      } else if (Math.abs(rect.top - bestTop) <= TOP_TOLERANCE && rect.left < bestLeft) {
        bestLeft = rect.left;
        targetIndex = i;
      }
    });

    const targetRect = cards[targetIndex].getBoundingClientRect();
    const offsets = cards.map((card, i) => {
      if (i === targetIndex) return { x: 0, y: 0 };
      const rect = card.getBoundingClientRect();
      return { x: targetRect.left - rect.left, y: targetRect.top - rect.top };
    });

    // Group cards into rows by top position, then determine which rows are
    // visible in the scroll viewport + 1 buffer row above/below.
    const cardTops = cards.map((c) => c.getBoundingClientRect().top);
    const rowTopValues: number[] = [];
    const cardRowIndex: number[] = [];
    for (let i = 0; i < cardTops.length; i++) {
      let matched = false;
      for (let r = 0; r < rowTopValues.length; r++) {
        if (Math.abs(cardTops[i] - rowTopValues[r]) <= TOP_TOLERANCE) {
          cardRowIndex[i] = r;
          matched = true;
          break;
        }
      }
      if (!matched) {
        cardRowIndex[i] = rowTopValues.length;
        rowTopValues.push(cardTops[i]);
      }
    }

    const totalRows = rowTopValues.length;
    const visibleRows = new Set<number>();
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (rect.bottom >= viewport.top && rect.top <= viewport.bottom) {
        visibleRows.add(cardRowIndex[i]);
      }
    }

    const minVisible = Math.min(...visibleRows);
    const maxVisible = Math.max(...visibleRows);
    const animatedRows = new Set(visibleRows);
    if (minVisible > 0) animatedRows.add(minVisible - 1);
    if (maxVisible < totalRows - 1) animatedRows.add(maxVisible + 1);

    const animatedSet = new Set<number>();
    for (let i = 0; i < cards.length; i++) {
      if (animatedRows.has(cardRowIndex[i])) animatedSet.add(i);
    }
    animatedSet.add(targetIndex);
    animatedSet.add(0);

    collapseCompleteFiredRef.current = false;
    setCollapseState({ targetIndex, offsets, animatedSet });
    debugReport({
      machine: {
        drawer: {
          collapseState: { targetIndex, offsets },
          animatedSetSize: animatedSet.size,
          targetIndex,
          collapseCompleteFiredRef: false,
        },
      },
    });

    dbgRef.current.mark("collapse-fan");

    // Card 0 owns the shared layoutId, so framer controls its animate prop
    // for the morph. Drive collapse imperatively via motion values instead.
    if (targetIndex !== 0 && animatedSet.has(0)) {
      const springConfig = dbgRef.current.scaleT({ type: "spring" as const, stiffness: 200, damping: 25, restDelta: 0.5, restSpeed: 10, delay: COLLAPSE_FADE_DURATION });
      animate(card0X, offsets[0].x, springConfig);
      animate(card0Y, offsets[0].y, springConfig).then(() => {
        completeCollapse();
      });
    } else if (targetIndex === 0) {
      setTimeout(() => completeCollapse(), COLLAPSE_FADE_DURATION * 1000);
    }
  }, [isClosing, collapseState, skills.length, card0X, card0Y, completeCollapse]);

  useLayoutEffect(() => {
    debugReport({
      machine: {
        drawer: {
          fanOffsets,
          collapseState,
          targetIndex: collapseState?.targetIndex ?? null,
          collapseCompleteFiredRef: collapseCompleteFiredRef.current,
        },
      },
    });
  }, [debugReport, fanOffsets, collapseState]);

  useLayoutEffect(() => {
    if (!debugEnabled) return;

    const reportCard0 = () => {
      debugReport({
        machine: {
          drawer: {
            card0X: roundMotionValue(card0X.get()),
            card0Y: roundMotionValue(card0Y.get()),
          },
        },
      });
    };

    reportCard0();
    const unsubscribers = [
      card0X.on("change", reportCard0),
      card0Y.on("change", reportCard0),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [debugEnabled, debugReport, card0X, card0Y]);

  return (
    <div className="relative pt-4 pb-4">
      <motion.h2
        className="text-center text-lg font-bold text-zinc-300 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={isClosing ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
        transition={isClosing ? { duration: 0.15 } : { delay: 0.15 }}
      >
        {formatPackName(packName)}
      </motion.h2>

      <div ref={containerRef} className="flex flex-wrap justify-center gap-4 px-4 max-w-4xl mx-auto">
        {skills.map((skill, i) => {
          if (i === 0) {
            return (
              <motion.div
                key={skill.id}
                layoutId={`pack-card-${packName}`}
                style={{ x: card0X, y: card0Y, zIndex: collapseState ? 50 : undefined }}
                transition={dbg.scaleT({
                  layout: { type: "spring", stiffness: 200, damping: 25 },
                })}
                onLayoutAnimationComplete={() => {
                  dbg.mark("layout-morph-in");
                  onOpenMorphComplete?.();
                }}
              >
                <SkillCard skill={skill} />
              </motion.div>
            );
          }

          if (!fanOffsets && !collapseState) {
            return (
              <div
                key={skill.id}
                style={{ width: 180, height: 252, visibility: "hidden" }}
              />
            );
          }

          if (collapseState) {
            const offset = collapseState.offsets[i] || { x: 0, y: 0 };
            const isTarget = i === collapseState.targetIndex;
            const isAnimated = collapseState.animatedSet.has(i);

            if (!isAnimated) {
              return (
                <motion.div
                  key={skill.id}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0 }}
                >
                  <SkillCard skill={skill} />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={skill.id}
                animate={{
                  x: offset.x,
                  y: offset.y,
                  opacity: isTarget ? 1 : 0,
                  scale: isTarget ? 1 : 0.8,
                  rotateZ: isTarget ? 0 : rotations[i],
                }}
                transition={dbg.scaleT({
                  duration: COLLAPSE_FADE_DURATION,
                })}
              >
                <SkillCard skill={skill} />
              </motion.div>
            );
          }

          const offset = fanOffsets![i];
          const staggerDelay = 0.3 + Math.min(i, 12) * 0.04;
          const isLastFan = i === skills.length - 1;

          return (
            <motion.div
              key={skill.id}
              initial={{
                x: offset.x,
                y: offset.y,
                opacity: 0,
                scale: 0.8,
                rotateZ: rotations[i],
              }}
              animate={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1,
                rotateZ: 0,
              }}
              transition={dbg.scaleT({
                type: "spring",
                stiffness: 200,
                damping: 25,
                delay: staggerDelay,
              })}
              onAnimationComplete={isLastFan ? () => dbg.mark("fan-out") : undefined}
            >
              <SkillCard skill={skill} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function formatPackName(name: string): string {
  if (name === "global") return "Global Skills";
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function roundMotionValue(value: number): number {
  return Math.round(value * 100) / 100;
}
