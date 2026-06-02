/**
 * Invisible render-null component that wires client-side interactivity
 * (mobile menu toggle, Escape key handler) onto the server-rendered header.
 * Returns null - exists purely for side effects. Keeps the header as plain
 * server-rendered HTML (fast initial paint, SEO) while adding JS behavior.
 */
"use client";

import { useCallback, useEffect, useRef } from "react";

export default function ShowcaseShell() {
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  const resolveRefs = useCallback(() => {
    if (!menuButtonRef.current) {
      menuButtonRef.current = document.querySelector("[data-menu-button]");
    }
    if (!mobilePanelRef.current) {
      mobilePanelRef.current = document.querySelector("[data-mobile-panel]");
    }
  }, []);

  const setMenu = useCallback(
    (open: boolean) => {
      resolveRefs();
      const button = menuButtonRef.current;
      const panel = mobilePanelRef.current;
      if (!button || !panel) return;
      button.setAttribute("aria-expanded", String(open));
      panel.dataset.open = String(open);
    },
    [resolveRefs]
  );

  useEffect(() => {
    resolveRefs();
    const button = menuButtonRef.current;
    const panel = mobilePanelRef.current;
    if (!button || !panel) return;

    function handleMenuClick() {
      const isOpen = menuButtonRef.current?.getAttribute("aria-expanded") === "true";
      setMenu(!isOpen);
    }

    function handlePanelClick(event: MouseEvent) {
      if (event.target instanceof HTMLAnchorElement) {
        setMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && mobilePanelRef.current?.dataset.open === "true") {
        setMenu(false);
        menuButtonRef.current?.focus();
      }
    }

    button.addEventListener("click", handleMenuClick);
    panel.addEventListener("click", handlePanelClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      button.removeEventListener("click", handleMenuClick);
      panel.removeEventListener("click", handlePanelClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [resolveRefs, setMenu]);

  return null;
}
