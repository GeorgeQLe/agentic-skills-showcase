"use client";

import { useState, useEffect, useRef } from "react";

export function useTypewriter(text: string, charsPerTick = 2, tickMs = 30) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;

    if (!text) return;

    const id = setInterval(() => {
      indexRef.current = Math.min(indexRef.current + charsPerTick, text.length);
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(id);
    }, tickMs);

    return () => clearInterval(id);
  }, [text, charsPerTick, tickMs]);

  const done = displayed.length >= text.length;
  return { displayed, done };
}
