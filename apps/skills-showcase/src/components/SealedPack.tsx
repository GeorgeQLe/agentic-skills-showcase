"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Package } from "lucide-react";

interface SealedPackProps {
  name: string;
  skillCount: number;
  previews: Array<{ title: string; type: string }>;
  onOpen: () => void;
}

const typeColors: Record<string, string> = {
  analysis: "#3b82f6",
  research: "#8b5cf6",
  generation: "#10b981",
  workflow: "#f59e0b",
  automation: "#06b6d4",
  review: "#f43f5e",
  planning: "#f97316",
};

const PACK_WIDTH = 192;
const THRESHOLD = 120;
const PERSPECTIVE = 600;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function SealedPack({ name, skillCount, previews, onOpen }: SealedPackProps) {
  const dragX = useMotionValue(0);
  const curlOpacity = useMotionValue(1);

  const flapClip = useTransform(dragX, (x) => `inset(0 0 0 ${x}px)`);
  const curlSize = useTransform(dragX, [0, PACK_WIDTH], [0, 22]);
  const curlX = useTransform([dragX, curlSize], ([x, s]: number[]) => x - s);

  const glowWidth = useTransform(dragX, [0, PACK_WIDTH], [0, PACK_WIDTH - 16]);
  const glowOpacity = useTransform(dragX, [0, 20, THRESHOLD], [0, 0.6, 1]);
  const hintOpacity = useTransform(dragX, [0, 30], [1, 0]);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const hasTriggered = useRef(false);

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
    const currentX = dragX.get();

    if (currentX >= THRESHOLD) {
      hasTriggered.current = true;
      animate(dragX, PACK_WIDTH, { duration: 0.3 });
      animate(curlOpacity, 0, { duration: 0.3 }).then(() => {
        onOpen();
      });
    }
  }

  function handleLostPointerCapture() {
    isDragging.current = false;
  }

  return (
    <div style={{ perspective: PERSPECTIVE }}>
      <div className="relative w-48 h-64 select-none">
        {/* Bottom half */}
        <div className="absolute top-[33%] left-0 right-0 bottom-0 rounded-b-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-800" />
          <div className="absolute inset-0 shimmer-foil" />
          <div className="absolute inset-x-2 top-0 bottom-2 rounded-b-xl border-b border-x border-zinc-500/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 flex flex-col items-center justify-center p-4">
            <span className="text-xs text-zinc-500">
              {skillCount} {skillCount === 1 ? "skill" : "skills"}
            </span>
          </div>
          <div className="absolute top-0 left-2 right-2 border-t border-dashed border-zinc-500/40" />
        </div>

        {/* Card preview — sits above bottom half, hidden behind the flap */}
        {previews.length > 0 && (
          <div
            className="absolute rounded-t-lg overflow-hidden shadow-md bg-zinc-800"
            style={{
              left: 8,
              right: 8,
              height: 56,
              top: "calc(33% - 28px)",
            }}
          >
            <div
              className="h-1.5 w-full"
              style={{ background: typeColors[previews[0].type] || "#71717a" }}
            />
            <div className="bg-zinc-800 px-1.5 pt-1 h-full">
              <span className="text-[8px] text-zinc-300 leading-tight line-clamp-2">
                {previews[0].title}
              </span>
            </div>
          </div>
        )}

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
          <div className="absolute inset-0 shimmer-foil" />
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

        {/* Invisible drag zone */}
        <div
          className="absolute left-0 right-0 z-10"
          style={{
            top: "20%",
            height: "26%",
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
}

function formatPackName(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
