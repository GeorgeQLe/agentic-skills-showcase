"use client";

import { type ReactNode } from "react";
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
  children: ReactNode;
  dismissable?: boolean;
}

export default function BottomSheet({ isOpen, onClose, children, dismissable = true }: BottomSheetProps) {
  const dbg = useDebug();
  const sheetY = useMotionValue(0);
  const dragControls = useDragControls();

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    } else {
      animate(sheetY, 0, dbg.scaleT({ type: "spring", stiffness: 300, damping: 30 }));
    }
  }

  return (
    <AnimatePresence onExitComplete={() => dbg.mark("sheet-exit")}>
      {isOpen && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={dbg.scaleT({ duration: 0.3 })}
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
            exit={{ y: "100%" }}
            transition={dbg.scaleT({ duration: 0.3 })}
            onAnimationComplete={() => dbg.mark("sheet-open")}
            style={{ y: sheetY, overscrollBehavior: "contain" }}
          >
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-zinc-600" />
            </div>
            <div className="flex-1 pb-8 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
