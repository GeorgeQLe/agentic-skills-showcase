"use client";

import { useState, useRef, useEffect, useLayoutEffect, forwardRef, useImperativeHandle } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Package } from "lucide-react";
import type { Skill } from "@/hooks/useSkillsData";
import CardFace from "./CardFace";
import { useDebug } from "./debug/DebugController";

interface SealedPackProps {
  name: string;
  skillCount: number;
  previewSkill: Skill | null;
  onOpen: (origin: { x: number; y: number }) => void;
  onTear?: () => void;
  /** When true, tearing this pack auto-opens the drawer (first-tear onboarding). */
  autoOpenOnTear?: boolean;
  isOpened?: boolean;
  isDrawerOpen?: boolean;
  /** When true, this pack mirrors its suspect state into the debug readout. */
  debugTarget?: boolean;
}

export interface SealedPackHandle {
  openViaClick: () => void;
  openViaTear: () => void;
  resetValues: () => void;
}

const PACK_WIDTH = 192;
const THRESHOLD = 120;
const PERSPECTIVE = 600;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const DRAG_UP_THRESHOLD = 80;

const SealedPack = forwardRef<SealedPackHandle, SealedPackProps>(function SealedPack(
  { name, skillCount, previewSkill, onOpen, onTear, autoOpenOnTear, isOpened, isDrawerOpen, debugTarget },
  ref
) {
  const dbg = useDebug();

  const dragX = useMotionValue(0);
  const curlOpacity = useMotionValue(1);

  const flapClip = useTransform(dragX, (x) => `inset(0 0 0 ${x}px)`);
  const curlSize = useTransform(dragX, [0, PACK_WIDTH], [0, 22]);
  const curlX = useTransform([dragX, curlSize], ([x, s]: number[]) => x - s);

  const glowWidth = useTransform(dragX, [0, PACK_WIDTH], [0, PACK_WIDTH - 16]);
  const glowOpacity = useTransform(dragX, [0, 20, THRESHOLD], [0, 0.6, 1]);
  const hintOpacity = useTransform(dragX, [0, 30], [1, 0]);
  const sheenOpacity = useMotionValue(1);
  const sheenRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const hasTriggered = useRef(false);
  const pendingOpen = useRef(false);

  useEffect(() => {
    const el = sheenRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;

    const unsub = dragX.on("change", (x) => {
      if (x > 5 && !timer) {
        const anim = el.getAnimations()[0];
        const DURATION = 3000;
        const elapsed = anim?.currentTime != null
          ? (anim.currentTime as number) % DURATION
          : 0;
        const remaining = DURATION - elapsed;
        timer = setTimeout(() => {
          animate(sheenOpacity, 0, { duration: 0.4 });
        }, remaining);
      }
    });

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [dragX, sheenOpacity]);

  // Shared open continuation: elevate the card, then request the drawer open.
  // In stepped mode the gates park the chain; in auto/disabled the 200ms
  // setTimeout reproduces production timing exactly.
  async function proceedToOpen() {
    setCardElevated(true);
    await dbg.gate("elevate-card");
    await dbg.gate("request-open");
    if (dbg.isStepping()) {
      onOpen(getOrigin());
    } else {
      setTimeout(() => onOpen(getOrigin()), 200);
    }
  }

  function completeTear() {
    hasTriggered.current = true;
    // Tearing only unseals the pack. Auto-open is a one-time onboarding
    // affordance reserved for the very first tear on the page.
    pendingOpen.current = !!autoOpenOnTear;
    // The 600ms fallback is armed only when we intend to auto-open and it
    // can't jump a breakpoint.
    if (autoOpenOnTear && !dbg.isStepping()) {
      pendingOpenTimer.current = setTimeout(() => {
        if (pendingOpen.current) {
          pendingOpen.current = false;
          onOpen(getOrigin());
        }
      }, 600);
    }
    animate(dragX, PACK_WIDTH, dbg.scaleT({ duration: 0.3 }));
    animate(curlOpacity, 0, dbg.scaleT({ duration: 0.3 })).then(async () => {
      await dbg.gate("tear");
      onTear?.();
    });
  }

  function revertTear() {
    animate(dragX, 0, dbg.scaleT({ type: "spring", stiffness: 400, damping: 25 }));
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (hasTriggered.current) return;
    isDragging.current = true;
    startX.current = e.clientX - dragX.get();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current || hasTriggered.current) return;
    const dx = clamp(e.clientX - startX.current, 0, PACK_WIDTH);
    dragX.set(dx);
  }

  function handlePointerUp() {
    if (!isDragging.current || hasTriggered.current) return;
    isDragging.current = false;
    dragX.get() >= THRESHOLD ? completeTear() : revertTear();
  }

  function handleLostPointerCapture() {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (!hasTriggered.current) {
      dragX.get() >= THRESHOLD ? completeTear() : revertTear();
    }
  }

  function getOrigin() {
    const rect = containerRef.current?.getBoundingClientRect();
    return rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  const cardDragY = useMotionValue(0);
  const cardSlideY = useMotionValue(0);
  const isCardDragging = useRef(false);
  const cardStartY = useRef(0);
  const hasCardTriggered = useRef(false);
  const [cardElevated, setCardElevated] = useState(false);

  const prevDrawerOpen = useRef(false);
  const wasInDrawer = useRef(false);
  const pendingOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (prevDrawerOpen.current && !isDrawerOpen) {
      wasInDrawer.current = true;
      setCardElevated(true);
      cardDragY.set(0);
      cardSlideY.set(0);
    }
    prevDrawerOpen.current = !!isDrawerOpen;
  }, [isDrawerOpen, cardDragY, cardSlideY]);

  useEffect(() => {
    return () => {
      if (pendingOpenTimer.current) clearTimeout(pendingOpenTimer.current);
    };
  }, []);

  const combinedY = useTransform(
    [cardDragY, cardSlideY],
    ([drag, slide]: number[]) => slide - drag
  );

  function handleCardPointerDown(e: React.PointerEvent) {
    if (hasCardTriggered.current) return;
    e.stopPropagation();
    isCardDragging.current = true;
    cardStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleCardPointerMove(e: React.PointerEvent) {
    if (!isCardDragging.current || hasCardTriggered.current) return;
    const dy = clamp(cardStartY.current - e.clientY, 0, 100);
    cardDragY.set(dy);
  }

  function handleCardPointerUp() {
    if (!isCardDragging.current || hasCardTriggered.current) return;
    isCardDragging.current = false;
    const current = cardDragY.get();

    if (current >= DRAG_UP_THRESHOLD) {
      hasCardTriggered.current = true;
      animate(cardDragY, 180, dbg.scaleT({ type: "spring", stiffness: 300, damping: 30 })).then(async () => {
        await dbg.gate("card-lift");
        await proceedToOpen();
      });
    } else {
      animate(cardDragY, 0, dbg.scaleT({ type: "spring", stiffness: 400, damping: 25 }));
    }
  }

  function handleCardLostCapture() {
    if (isCardDragging.current && !hasCardTriggered.current) {
      isCardDragging.current = false;
      animate(cardDragY, 0, dbg.scaleT({ type: "spring", stiffness: 400, damping: 25 }));
    }
  }

  function handlePackClick() {
    if (hasCardTriggered.current) return;
    hasCardTriggered.current = true;
    animate(cardSlideY, -180, dbg.scaleT({
      type: "spring",
      stiffness: 400,
      damping: 25,
    })).then(async () => {
      await dbg.gate("card-click-rise");
      await proceedToOpen();
    });
  }

  const isClosingFromDrawer = prevDrawerOpen.current && !isDrawerOpen;

  // Mirror the suspect state into the debug readout (target pack only).
  useEffect(() => {
    if (!debugTarget) return;
    const z: number | "unset" = cardElevated || isClosingFromDrawer ? 60 : "unset";
    dbg.report({
      cardElevated,
      cardZIndex: z,
      isClosingFromDrawer,
      isDrawerOpen: !!isDrawerOpen,
    });
  }, [debugTarget, cardElevated, isClosingFromDrawer, isDrawerOpen, dbg]);

  useImperativeHandle(
    ref,
    (): SealedPackHandle => ({
      openViaClick: () => handlePackClick(),
      openViaTear: () => completeTear(),
      resetValues: () => {
        hasTriggered.current = false;
        pendingOpen.current = false;
        hasCardTriggered.current = false;
        isDragging.current = false;
        isCardDragging.current = false;
        wasInDrawer.current = false;
        if (pendingOpenTimer.current) {
          clearTimeout(pendingOpenTimer.current);
          pendingOpenTimer.current = null;
        }
        setCardElevated(false);
        dragX.set(0);
        curlOpacity.set(1);
        cardDragY.set(0);
        cardSlideY.set(0);
        sheenOpacity.set(1);
      },
    })
  );

  if (isOpened) {
    return (
      <div>
        <div
          ref={containerRef}
          className="relative w-48 h-64 select-none cursor-pointer"
          onClick={handlePackClick}
        >
          {/* Card — full height, sits behind the bottom half */}
          {previewSkill && (
            <motion.div
              layoutId={`pack-card-${name}`}
              transition={dbg.scaleT({ layout: { duration: 0.3, ease: [0.42, 0, 0.58, 1] } })}
              className="absolute rounded-lg overflow-hidden shadow-md cursor-grab active:cursor-grabbing"
              style={{
                left: 6,
                right: 6,
                height: 252,
                top: 2,
                y: combinedY,
                zIndex: (cardElevated || isClosingFromDrawer) ? 60 : undefined,
                touchAction: "none",
              }}
              onPointerDown={handleCardPointerDown}
              onPointerMove={handleCardPointerMove}
              onPointerUp={handleCardPointerUp}
              onLostPointerCapture={handleCardLostCapture}
              onLayoutAnimationComplete={async () => {
                if (pendingOpenTimer.current) {
                  clearTimeout(pendingOpenTimer.current);
                  pendingOpenTimer.current = null;
                }
                // OPEN (tear) continuation — part of the open sequence.
                if (pendingOpen.current) {
                  pendingOpen.current = false;
                  if (!isDrawerOpen) {
                    animate(cardSlideY, -180, dbg.scaleT({
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    })).then(() => {
                      proceedToOpen();
                    });
                  }
                  return;
                }
                // CLOSE morph-back — THE APEX. Gate before touching elevation so
                // the z-index-60 frame can be held and inspected. Never reorder
                // the three statements below.
                if (!isDrawerOpen && wasInDrawer.current) {
                  await dbg.gate("layout-morph-out");
                  await dbg.gate("drop-elevation");
                  wasInDrawer.current = false;
                  setCardElevated(false);
                  hasCardTriggered.current = false;
                }
              }}
            >
              <CardFace skill={previewSkill} className="rounded-lg" />
            </motion.div>
          )}

          {/* Bottom half — paints on top of the card to hide its lower portion */}
          <div className="absolute top-[33%] left-0 right-0 bottom-0 rounded-b-2xl overflow-hidden z-[1]">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-800" />
            <div className="absolute inset-x-2 top-0 bottom-2 rounded-b-xl border-b border-x border-zinc-500/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 flex flex-col items-center justify-center p-4">
              <span className="text-xs text-zinc-500">
                {skillCount} {skillCount === 1 ? "skill" : "skills"}
              </span>
            </div>
            <div className="absolute top-0 left-2 right-2 border-t border-dashed border-zinc-500/40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ perspective: PERSPECTIVE }}>
      <div ref={containerRef} className="relative w-48 h-64 select-none">
        {/* Card — full height, hidden behind flap and bottom half */}
        {previewSkill && (
          <motion.div
            layoutId={`pack-card-${name}`}
            className="absolute rounded-lg overflow-hidden shadow-md"
            style={{
              left: 6,
              right: 6,
              height: 252,
              top: 2,
            }}
          >
            <CardFace skill={previewSkill} className="rounded-lg" />
          </motion.div>
        )}

        {/* Bottom half */}
        <div className="absolute top-[33%] left-0 right-0 bottom-0 rounded-b-2xl overflow-hidden z-[1]">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-800" />
          <div className="absolute inset-x-2 top-0 bottom-2 rounded-b-xl border-b border-x border-zinc-500/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 flex flex-col items-center justify-center p-4">
            <span className="text-xs text-zinc-500">
              {skillCount} {skillCount === 1 ? "skill" : "skills"}
            </span>
          </div>
          <div className="absolute top-0 left-2 right-2 border-t border-dashed border-zinc-500/40" />
        </div>

        {/* Tear glow line */}
        <motion.div
          className="absolute h-1 rounded-full"
          style={{
            top: "33%",
            left: 8,
            width: glowWidth,
            opacity: glowOpacity,
            background: "linear-gradient(90deg, rgba(251,191,36,0.6), rgba(251,191,36,0.9))",
            boxShadow: "0 0 8px rgba(251,191,36,0.4)",
          }}
        />

        {/* Tear start arrow */}
        <motion.div
          className="absolute z-10"
          style={{ left: 4, top: "33%", y: "-50%", opacity: hintOpacity }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="tear-hint-arrow">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>

        {/* Top flap — clips from left as tear progresses */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[calc(33%+1px)] rounded-t-2xl overflow-hidden"
          style={{ clipPath: flapClip }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-800" />
          <div className="absolute inset-x-2 top-2 bottom-0 rounded-t-xl border-t border-x border-zinc-500/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 flex flex-col items-center justify-end pb-2">
            <Package size={28} className="text-zinc-400 mb-2" />
            <h3 className="text-sm font-bold text-zinc-200 text-center leading-tight">
              {formatPackName(name)}
            </h3>
          </div>
          <div className="absolute bottom-0 left-2 right-2 border-b border-dashed border-zinc-500/40" />
        </motion.div>

        {/* Curl roll — cylindrical element at tear edge */}
        <motion.div
          className="absolute top-0 left-0 shimmer-foil"
          style={{
            height: "33%",
            width: curlSize,
            x: curlX,
            opacity: curlOpacity,
            rotateX: -15,
            transformOrigin: "bottom center",
            background: "linear-gradient(90deg, #3f3f46 0%, #71717a 30%, #a1a1aa 55%, #71717a 75%, #52525b 100%)",
            borderRadius: "0 50% 50% 0",
            boxShadow: "-2px 2px 6px rgba(0,0,0,0.3)",
          }}
        />

        {/* Unified shimmer overlay */}
        <motion.div
          ref={sheenRef}
          className="absolute inset-0 rounded-2xl shimmer-foil pointer-events-none z-[2]"
          style={{ opacity: sheenOpacity }}
        />

        {/* Invisible drag zone */}
        <div
          className="absolute left-0 right-0 z-10"
          style={{
            top: "0%",
            height: "33%",
            touchAction: "none",
            cursor: "grab",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onLostPointerCapture={handleLostPointerCapture}
        />
      </div>
    </div>
  );
});

export default SealedPack;

function formatPackName(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
