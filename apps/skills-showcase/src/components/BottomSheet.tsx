/**
 * BottomSheet.tsx - slide-up drawer container for the pack-opener content.
 *
 * AnimatePresence exit drives the close morph-back sequence: when isOpen flips
 * false the sheet slides out, and onExitComplete advances the page phase so
 * the shared-layout card can morph back to the SealedPack while activePack is
 * still retained.
 */
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
  useDragControls,
  type PanInfo,
} from "framer-motion";
import { useDebug } from "./debug/DebugController";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onExitComplete?: () => void;
  children: ReactNode;
  dismissable?: boolean;
  unclipContent?: boolean;
  fadeExit?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  onExitComplete,
  children,
  dismissable = true,
  unclipContent = false,
  fadeExit = false,
}: BottomSheetProps) {
  const dbg = useDebug();
  const debugEnabled = dbg.enabled;
  const debugReport = dbg.report;
  const sheetY = useMotionValue(0);
  const dragControls = useDragControls();
  const [isExiting, setIsExiting] = useState(false);
  const [scrimPulse, setScrimPulse] = useState(false);
  const prevDismissable = useRef(dismissable);
  // Track prior open state in a ref so the effect below can detect the
  // open-to-closed transition and trigger exit animation before AnimatePresence
  // unmounts the children.
  const wasOpenRef = useRef(isOpen);

  // Portal the sheet to <body> so its fixed scrim/drawer escape any transformed
  // ancestor (e.g. the builder's layoutId panel), which would otherwise become
  // the containing block and place the "fixed" sheet deep in the document
  // instead of over the viewport. Same rationale as FlightLayer's body portal.
  // The shared `pack-card` layoutId morph still resolves across the portal: it
  // uses viewport coordinates and the LayoutGroup React context crosses portals.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    } else {
      animate(sheetY, 0, dbg.scaleT({ type: "spring", stiffness: 300, damping: 30 }));
    }
  }

  useEffect(() => {
    if (!prevDismissable.current && dismissable) {
      setScrimPulse(true);
    }
    if (!dismissable) {
      setScrimPulse(false);
    }
    prevDismissable.current = dismissable;
  }, [dismissable]);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      setIsExiting(true);
    }
    if (isOpen) {
      setIsExiting(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    debugReport({
      machine: {
        sheet: {
          mounted: isOpen,
          open: isOpen && !isExiting,
          exiting: isExiting,
          dismissable,
        },
      },
    });
  }, [debugReport, isOpen, isExiting, dismissable]);

  useEffect(() => {
    if (!debugEnabled) return;

    const reportSheetY = () => {
      debugReport({
        machine: {
          sheet: {
            sheetY: roundMotionValue(sheetY.get()),
          },
        },
      });
    };

    reportSheetY();
    const unsubscribe = sheetY.on("change", reportSheetY);
    return () => unsubscribe();
  }, [debugEnabled, debugReport, sheetY]);

  const tree = (
    <AnimatePresence
      onExitComplete={() => {
        setIsExiting(false);
        dbg.mark("sheet-exit");
        debugReport({
          machine: {
            sheet: {
              mounted: false,
              open: false,
              exiting: false,
              sheetY: 0,
            },
          },
        });
        onExitComplete?.();
      }}
    >
      {isOpen && (
        <>
          <motion.div
            key="scrim"
            className={`fixed inset-0 z-40 bg-black/50${scrimPulse ? " scrim-pulse" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={fadeExit
              ? { opacity: 0, transition: { duration: 0.01 } }
              : { opacity: 0 }}
            transition={dbg.scaleT({ duration: 0.15 })}
            onClick={dismissable ? onClose : undefined}
          />
          <motion.div
            key="sheet"
            className="fixed bottom-0 inset-x-0 z-50 max-h-[70vh] rounded-t-2xl bg-zinc-900 flex flex-col"
            drag={dismissable ? "y" : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={fadeExit
              ? { opacity: 0, transition: { duration: 0.01 } }
              : { y: "100%" }}
            transition={dbg.scaleT({ duration: 0.15 })}
            onAnimationComplete={() => {
              dbg.mark("sheet-open");
              debugReport({
                machine: {
                  sheet: {
                    mounted: true,
                    open: true,
                    exiting: false,
                    sheetY: 0,
                  },
                },
              });
            }}
            style={{ y: sheetY, overscrollBehavior: "contain" }}
          >
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-zinc-600" />
            </div>
            <div className={`flex-1 pb-8 ${unclipContent ? 'overflow-visible' : 'overflow-y-auto'}`} style={{ overscrollBehavior: "contain" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(tree, document.body);
}

function roundMotionValue(value: number): number {
  return Math.round(value * 100) / 100;
}
