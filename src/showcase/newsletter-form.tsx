/**
 * Controlled newsletter subscription form with a state machine
 * (ready -> invalid-email/pending -> success/error). Validates email
 * client-side before hitting the tRPC endpoint.
 */
"use client";

import { useState, useRef } from "react";
import { trpc } from "@/trpc/client";

type FormState = "ready" | "invalid-email" | "pending" | "success" | "error";

const STATE_MESSAGES: Record<FormState, string> = {
  ready: "Enter an email address to join the list.",
  "invalid-email": "Enter a valid email address before joining the list.",
  pending: "Submitting...",
  success:
    "You're on the list. Watch the public channels for the next workflow drop.",
  error:
    "The submission failed. Try again later or follow through the public channels.",
};

const VISIBLE_STATES = ["invalid-email", "pending", "success", "error"] as const;

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function NewsletterFormClient() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("ready");
  const inputRef = useRef<HTMLInputElement>(null);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setEmail("");
      setFormState("success");
    },
    onError: () => {
      setFormState("error");
    },
  });

  function handleInput(value: string) {
    setEmail(value);
    if (formState === "invalid-email" && validEmail(value.trim())) {
      setFormState("ready");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!validEmail(trimmed)) {
      setFormState("invalid-email");
      inputRef.current?.focus();
      return;
    }
    setFormState("pending");
    subscribe.mutate({
      email: trimmed,
      sourcePage: window.location.pathname,
      consentTextVersion: "1.0",
    });
  }

  return (
    <form
      className="form-panel span-12 newsletter-form"
      aria-labelledby="newsletter-title"
      data-newsletter-form=""
      data-newsletter-status={formState}
      onSubmit={handleSubmit}
    >
      <div>
        <p className="eyebrow">Newsletter</p>
        <h2 id="newsletter-title">Get the next workflow drop.</h2>
        <p className="lede">
          Join the mailing list for workflow drops, build notes, and community
          routes.
        </p>
      </div>
      <div className="newsletter-controls" data-newsletter-controls="">
        <label>
          <span className="eyebrow">Email</span>
          <input
            ref={inputRef}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="email@example.com"
            aria-describedby="newsletter-status"
            aria-invalid={formState === "invalid-email"}
            value={email}
            onChange={(e) => handleInput(e.target.value)}
          />
        </label>
        <button
          className="button secondary"
          type="submit"
          disabled={formState === "pending"}
          aria-busy={formState === "pending"}
        >
          Join the list
        </button>
      </div>
      <div className="newsletter-state-row" aria-label="Newsletter form states">
        {VISIBLE_STATES.map((state) => (
          <span
            key={state}
            className="tag"
            data-newsletter-state={state}
            aria-current={formState === state}
          >
            {state.replace("-", " ")}
          </span>
        ))}
      </div>
      <p
        className="notice newsletter-status"
        id="newsletter-status"
        role="status"
        aria-live="polite"
        data-newsletter-status=""
        data-status={formState}
      >
        {STATE_MESSAGES[formState]}
      </p>
    </form>
  );
}
