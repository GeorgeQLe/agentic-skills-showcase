import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/trpc/client";
import NewsletterFormClient from "./newsletter-form";

let mockMutate: ReturnType<typeof vi.fn>;
let capturedCallbacks: { onSuccess?: (...args: unknown[]) => void; onError?: (...args: unknown[]) => void };

vi.mock("@/trpc/client", () => ({
  trpc: {
    newsletter: {
      subscribe: {
        useMutation: vi.fn(),
      },
    },
  },
}));

function setupMutation() {
  mockMutate = vi.fn();
  capturedCallbacks = {};
  vi.mocked(trpc.newsletter.subscribe.useMutation).mockImplementation(
    ((opts?: Record<string, unknown>) => {
      if (opts) capturedCallbacks = opts as typeof capturedCallbacks;
      return { mutate: mockMutate };
    }) as unknown as typeof trpc.newsletter.subscribe.useMutation
  );
}

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NewsletterFormClient />
    </QueryClientProvider>
  );
}

describe("NewsletterFormClient", () => {
  beforeEach(() => {
    setupMutation();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("sets ready state on mount", () => {
      renderForm();
      const form = document.querySelector("[data-newsletter-form]") as HTMLElement;
      expect(form.dataset.newsletterStatus).toBe("ready");
    });

    it("displays ready message", () => {
      renderForm();
      expect(screen.getByRole("status").textContent).toMatch(/enter an email/i);
    });
  });

  describe("email validation", () => {
    it("shows invalid-email state on submit with bad email", () => {
      renderForm();
      const input = screen.getByPlaceholderText("email@example.com");
      fireEvent.change(input, { target: { value: "not-an-email" } });
      fireEvent.submit(screen.getByRole("form", { hidden: true }) || document.querySelector("form")!);

      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByRole("status").textContent).toMatch(/valid email/i);
    });

    it("clears invalid state when input becomes valid", () => {
      renderForm();
      const input = screen.getByPlaceholderText("email@example.com");

      fireEvent.change(input, { target: { value: "bad" } });
      fireEvent.submit(document.querySelector("form")!);
      expect(input.getAttribute("aria-invalid")).toBe("true");

      fireEvent.change(input, { target: { value: "valid@example.com" } });
      expect(input.getAttribute("aria-invalid")).toBe("false");
    });
  });

  describe("submission flow", () => {
    it("enters pending state and calls mutate on valid submit", () => {
      renderForm();
      const input = screen.getByPlaceholderText("email@example.com");
      fireEvent.change(input, { target: { value: "test@example.com" } });
      fireEvent.submit(document.querySelector("form")!);

      const submit = screen.getByRole("button", { name: /join the list/i });
      expect(submit).toBeDisabled();
      expect(submit.getAttribute("aria-busy")).toBe("true");

      expect(mockMutate).toHaveBeenCalledWith({
        email: "test@example.com",
        sourcePage: "/",
        consentTextVersion: "1.0",
      });
    });

    it("enters success state after mutation succeeds", async () => {
      mockMutate.mockImplementation(() => {
        capturedCallbacks.onSuccess?.();
      });

      renderForm();
      const input = screen.getByPlaceholderText("email@example.com");
      fireEvent.change(input, { target: { value: "test@example.com" } });
      fireEvent.submit(document.querySelector("form")!);

      await waitFor(() => {
        const form = document.querySelector("[data-newsletter-form]") as HTMLElement;
        expect(form.dataset.newsletterStatus).toBe("success");
      });

      expect(screen.getByRole("status").textContent).toMatch(/on the list/i);
    });

    it("enters error state after mutation fails", async () => {
      mockMutate.mockImplementation(() => {
        capturedCallbacks.onError?.();
      });

      renderForm();
      const input = screen.getByPlaceholderText("email@example.com");
      fireEvent.change(input, { target: { value: "test@example.com" } });
      fireEvent.submit(document.querySelector("form")!);

      await waitFor(() => {
        const form = document.querySelector("[data-newsletter-form]") as HTMLElement;
        expect(form.dataset.newsletterStatus).toBe("error");
      });

      expect(screen.getByRole("status").textContent).toMatch(/failed/i);
    });

    it("clears email on success", async () => {
      mockMutate.mockImplementation(() => {
        capturedCallbacks.onSuccess?.();
      });

      renderForm();
      const input = screen.getByPlaceholderText("email@example.com") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "test@example.com" } });
      fireEvent.submit(document.querySelector("form")!);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });
  });
});
