import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import NewsletterFormClient from "./newsletter-form";

function newsletterFormDOM(endpoint = "") {
  document.body.innerHTML = `
    <form data-newsletter-form data-provider-endpoint="${endpoint}">
      <input name="email" type="email" />
      <button type="submit">Join</button>
      <span data-newsletter-state="provider-missing">provider missing</span>
      <span data-newsletter-state="invalid-email">invalid email</span>
      <span data-newsletter-state="pending">pending</span>
      <span data-newsletter-state="success">success</span>
      <span data-newsletter-state="error">error</span>
      <p data-newsletter-status></p>
    </form>
  `;
}

describe("NewsletterFormClient", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("initial state without endpoint", () => {
    it("sets provider-missing state when no endpoint configured", () => {
      newsletterFormDOM();
      render(<NewsletterFormClient />);

      const form = document.querySelector("[data-newsletter-form]") as HTMLElement;
      expect(form.dataset.newsletterStatus).toBe("provider-missing");

      const status = document.querySelector("[data-newsletter-status]")!;
      expect(status.textContent).toMatch(/endpoint missing/i);
    });

    it("marks provider-missing tag as current", () => {
      newsletterFormDOM();
      render(<NewsletterFormClient />);

      const providerTag = document.querySelector('[data-newsletter-state="provider-missing"]')!;
      expect(providerTag.getAttribute("aria-current")).toBe("true");

      const successTag = document.querySelector('[data-newsletter-state="success"]')!;
      expect(successTag.getAttribute("aria-current")).toBe("false");
    });
  });

  describe("initial state with endpoint", () => {
    it("sets ready state when endpoint is configured", () => {
      newsletterFormDOM("https://example.com/subscribe");
      render(<NewsletterFormClient />);

      const form = document.querySelector("[data-newsletter-form]") as HTMLElement;
      expect(form.dataset.newsletterStatus).toBe("ready");
    });
  });

  describe("email validation", () => {
    it("shows invalid-email state on submit with bad email", () => {
      newsletterFormDOM("https://example.com/subscribe");
      render(<NewsletterFormClient />);

      const input = document.querySelector('input[name="email"]') as HTMLInputElement;
      input.value = "not-an-email";

      const form = document.querySelector("[data-newsletter-form]") as HTMLFormElement;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      expect(input.getAttribute("aria-invalid")).toBe("true");
      const status = document.querySelector("[data-newsletter-status]")!;
      expect(status.textContent).toMatch(/valid email/i);
    });

    it("clears invalid state when input becomes valid", () => {
      newsletterFormDOM("https://example.com/subscribe");
      render(<NewsletterFormClient />);

      const input = document.querySelector('input[name="email"]') as HTMLInputElement;
      input.value = "bad";
      const form = document.querySelector("[data-newsletter-form]") as HTMLFormElement;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      expect(input.getAttribute("aria-invalid")).toBe("true");

      input.value = "valid@example.com";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(input.getAttribute("aria-invalid")).toBe("false");
    });
  });

  describe("submission flow", () => {
    beforeEach(() => {
      newsletterFormDOM("https://example.com/subscribe");
    });

    it("enters pending state during submission", async () => {
      let resolveResponse!: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      });
      vi.spyOn(globalThis, "fetch").mockReturnValue(fetchPromise);

      render(<NewsletterFormClient />);

      const input = document.querySelector('input[name="email"]') as HTMLInputElement;
      input.value = "test@example.com";

      const form = document.querySelector("[data-newsletter-form]") as HTMLFormElement;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        const submit = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(submit.disabled).toBe(true);
        expect(submit.getAttribute("aria-busy")).toBe("true");
      });

      resolveResponse(new Response(null, { status: 200 }));
    });

    it("enters success state after successful submission", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

      render(<NewsletterFormClient />);

      const input = document.querySelector('input[name="email"]') as HTMLInputElement;
      input.value = "test@example.com";

      const form = document.querySelector("[data-newsletter-form]") as HTMLFormElement;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        const formEl = document.querySelector("[data-newsletter-form]") as HTMLElement;
        expect(formEl.dataset.newsletterStatus).toBe("success");
      });

      const status = document.querySelector("[data-newsletter-status]")!;
      expect(status.textContent).toMatch(/on the list/i);
    });

    it("enters error state after failed submission", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));

      render(<NewsletterFormClient />);

      const input = document.querySelector('input[name="email"]') as HTMLInputElement;
      input.value = "test@example.com";

      const form = document.querySelector("[data-newsletter-form]") as HTMLFormElement;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        const formEl = document.querySelector("[data-newsletter-form]") as HTMLElement;
        expect(formEl.dataset.newsletterStatus).toBe("error");
      });

      const status = document.querySelector("[data-newsletter-status]")!;
      expect(status.textContent).toMatch(/failed/i);
    });

    it("enters error state on network failure", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

      render(<NewsletterFormClient />);

      const input = document.querySelector('input[name="email"]') as HTMLInputElement;
      input.value = "test@example.com";

      const form = document.querySelector("[data-newsletter-form]") as HTMLFormElement;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        const formEl = document.querySelector("[data-newsletter-form]") as HTMLElement;
        expect(formEl.dataset.newsletterStatus).toBe("error");
      });
    });

    it("stays provider-missing when no endpoint on submit", () => {
      cleanup();
      newsletterFormDOM();
      render(<NewsletterFormClient />);

      const input = document.querySelector('input[name="email"]') as HTMLInputElement;
      input.value = "valid@example.com";

      const form = document.querySelector("[data-newsletter-form]") as HTMLFormElement;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      const formEl = document.querySelector("[data-newsletter-form]") as HTMLElement;
      expect(formEl.dataset.newsletterStatus).toBe("provider-missing");
    });
  });
});
