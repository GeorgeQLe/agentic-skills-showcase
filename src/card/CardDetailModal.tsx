"use client";

/*
 * CardDetailModal — the overlay shell the @modal intercepting route renders
 * over the current context (the deck builder, the catalog) when a card's expand
 * affordance soft-navigates to /card/[id]. Dismiss returns through the router so
 * the URL and the preserved background slot reconcile together; the builder's
 * own pushState morph lives in a different subtree and is untouched.
 *
 * Mobile collapses to a full-screen sheet with a swipe-down dismiss (mirroring
 * BottomSheet's drag threshold). Reduced motion renders instant.
 */
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Skill } from "@/hooks/useSkillsData";
import type { CardDeckRef } from "@/server/skillsData";
import CardDetail from "./CardDetail";

export default function CardDetailModal({
  skill,
  decks,
}: {
  skill: Skill;
  decks: CardDeckRef[];
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    if (reduceMotion) router.back();
    // Otherwise the dialog's onAnimationComplete fires router.back() once the
    // exit transition lands (see below).
  }, [leaving, reduceMotion, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 120 || info.velocity.y > 500) dismiss();
  }

  return (
    <motion.div
      className="card-modal-scrim fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-6"
      data-testid="card-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${skill.title} card detail`}
      initial={{ opacity: reduceMotion ? 1 : 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      onClick={dismiss}
    >
      <motion.div
        className="card-modal-dialog relative w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-2xl border border-zinc-300 dark:border-zinc-700/50 bg-white/95 dark:bg-zinc-950/95 shadow-2xl shadow-black/50 overflow-y-auto p-6 sm:p-8"
        data-testid="card-modal-dialog"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={leaving ? { opacity: 0, scale: 0.96, y: 12 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }}
        onAnimationComplete={() => {
          if (leaving && !reduceMotion) router.back();
        }}
        drag={reduceMotion ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab affordance. */}
        <div className="sm:hidden flex justify-center pt-1 pb-3">
          <span className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        <button
          type="button"
          className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
          data-testid="card-modal-close"
          onClick={dismiss}
        >
          <X size={18} />
        </button>

        <CardDetail skill={skill} decks={decks} />
      </motion.div>
    </motion.div>
  );
}
