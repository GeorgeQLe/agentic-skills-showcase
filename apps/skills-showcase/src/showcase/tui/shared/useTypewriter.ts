/**
 * Character-at-a-time text reveal hook for the TUI workflow player's agent
 * response animation. Returns the progressively-revealed substring and a
 * `done` flag that gates downstream playback logic.
 */
"use client";

import { useState, useEffect, useRef } from "react";

export function useTypewriter(text: string, charsPerTick = 2, tickMs = 30, enabled = true) {
  const [displayed, setDisplayed] = useState("");
  // Ref instead of state for the character index: avoids a re-render on every
  // tick. The ref holds the mutable cursor; only `displayed` (the sliced
  // string) triggers a render - one setState per tick instead of two.
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      indexRef.current = text.length;
      return;
    }

    setDisplayed("");
    indexRef.current = 0;

    if (!text) return;

    const id = setInterval(() => {
      indexRef.current = Math.min(indexRef.current + charsPerTick, text.length);
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(id);
    }, tickMs);

    return () => clearInterval(id);
  }, [text, charsPerTick, tickMs, enabled]);

  const done = displayed.length >= text.length;
  return { displayed, done };
}
