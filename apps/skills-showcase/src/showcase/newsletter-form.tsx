"use client";

import { useEffect } from "react";

function text(value: unknown, fallback?: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback || "";
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function NewsletterFormClient() {
  useEffect(() => {
    const form = document.querySelector("[data-newsletter-form]");
    if (!(form instanceof HTMLFormElement)) return;

    const input = form.querySelector('input[name="email"]') as HTMLInputElement | null;
    const submit = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    const status = form.querySelector("[data-newsletter-status]") as HTMLElement | null;
    const stateTags = Array.from(form.querySelectorAll("[data-newsletter-state]"));
    if (!input || !submit || !status) return;

    function endpoint(): string {
      return text((form as HTMLFormElement).dataset.providerEndpoint);
    }

    function setState(state: string, message: string) {
      (form as HTMLFormElement).dataset.newsletterStatus = state;
      status!.dataset.status = state;
      status!.textContent = message;
      input!.setAttribute("aria-invalid", String(state === "invalid-email"));
      submit!.disabled = state === "pending";
      submit!.setAttribute("aria-busy", String(state === "pending"));
      stateTags.forEach((tag) => {
        tag.setAttribute(
          "aria-current",
          String((tag as HTMLElement).dataset.newsletterState === state)
        );
      });
    }

    setState(
      endpoint() ? "ready" : "provider-missing",
      endpoint()
        ? "Provider endpoint configured. Enter an email address to join the list."
        : "Provider endpoint missing. This static page is not collecting email addresses yet."
    );

    function handleInput() {
      if (input!.getAttribute("aria-invalid") === "true" && validEmail(input!.value.trim())) {
        setState(
          endpoint() ? "ready" : "provider-missing",
          endpoint()
            ? "Email format looks valid. Submit when ready."
            : "Provider endpoint missing. This static page is not collecting email addresses yet."
        );
      }
    }

    async function handleSubmit(event: Event) {
      event.preventDefault();
      const email = input!.value.trim();
      if (!validEmail(email)) {
        setState("invalid-email", "Enter a valid email address before joining the list.");
        input!.focus();
        return;
      }

      const providerEndpoint = endpoint();
      if (!providerEndpoint) {
        setState(
          "provider-missing",
          "Provider endpoint missing. No email was collected; use YouTube, X / Twitter, GitHub, or Discord for now."
        );
        return;
      }

      setState("pending", "Submitting to the configured static provider...");
      try {
        const body = new URLSearchParams(new FormData(form as HTMLFormElement) as unknown as Record<string, string>);
        const response = await fetch(providerEndpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body
        });
        if (!response.ok) throw new Error(`Provider returned ${response.status}`);
        (form as HTMLFormElement).reset();
        setState("success", "You're on the list. Watch the public channels for the next workflow drop.");
      } catch {
        setState("error", "The provider submission failed. Try again later or follow through the public channels.");
      }
    }

    input.addEventListener("input", handleInput);
    form.addEventListener("submit", handleSubmit);

    return () => {
      input.removeEventListener("input", handleInput);
      form.removeEventListener("submit", handleSubmit);
    };
  }, []);

  return null;
}
