"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className="fixed bottom-0 inset-x-0 z-50 max-h-[70vh] rounded-t-2xl bg-zinc-900 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-600" />
            </div>
            <div className="flex-1 pb-8 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
