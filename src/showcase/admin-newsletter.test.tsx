import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/trpc/client";
import AdminNewsletterClient from "./admin-newsletter";

let mockLoginMutate: ReturnType<typeof vi.fn>;
let loginCallbacks: { onSuccess?: () => void; onError?: () => void };
let mockListData: unknown[] | undefined;
let mockListLoading: boolean;
let mockListError: boolean;

vi.mock("@/trpc/client", () => ({
  trpc: {
    newsletter: {
      adminLogin: { useMutation: vi.fn() },
      adminList: { useQuery: vi.fn() },
      adminExport: { useQuery: vi.fn() },
    },
  },
}));

function setupMocks(overrides?: {
  listData?: unknown[];
  listLoading?: boolean;
  listError?: boolean;
}) {
  mockLoginMutate = vi.fn();
  loginCallbacks = {};
  mockListData = overrides?.listData;
  mockListLoading = overrides?.listLoading ?? false;
  mockListError = overrides?.listError ?? false;

  vi.mocked(trpc.newsletter.adminLogin.useMutation).mockImplementation(
    ((opts?: Record<string, unknown>) => {
      if (opts) loginCallbacks = opts as typeof loginCallbacks;
      return { mutate: mockLoginMutate, isPending: false, isError: false, error: null };
    }) as unknown as typeof trpc.newsletter.adminLogin.useMutation
  );

  vi.mocked(trpc.newsletter.adminList.useQuery).mockReturnValue({
    data: mockListData,
    isLoading: mockListLoading,
    isError: mockListError,
  } as ReturnType<typeof trpc.newsletter.adminList.useQuery>);

  vi.mocked(trpc.newsletter.adminExport.useQuery).mockReturnValue({
    refetch: vi.fn().mockResolvedValue({ data: "" }),
  } as unknown as ReturnType<typeof trpc.newsletter.adminExport.useQuery>);
}

function renderAdmin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminNewsletterClient />
    </QueryClientProvider>
  );
}

const fakeSub = (email: string, status = "active") => ({
  id: crypto.randomUUID(),
  email,
  status,
  source_page: "/",
  consent_text_version: "1.0",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe("AdminNewsletterClient", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("login gate", () => {
    it("renders login form on mount", () => {
      renderAdmin();
      expect(screen.getByPlaceholderText("Enter admin secret")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });

    it("calls adminLogin.mutate with entered secret", () => {
      renderAdmin();
      const input = screen.getByPlaceholderText("Enter admin secret");
      fireEvent.change(input, { target: { value: "my-secret" } });
      fireEvent.submit(document.querySelector("form")!);
      expect(mockLoginMutate).toHaveBeenCalledWith({ secret: "my-secret" });
    });

    it("displays login error message", () => {
      vi.mocked(trpc.newsletter.adminLogin.useMutation).mockImplementation(
        ((opts?: Record<string, unknown>) => {
          if (opts) loginCallbacks = opts as typeof loginCallbacks;
          return {
            mutate: mockLoginMutate,
            isPending: false,
            isError: true,
            error: { message: "Invalid secret." },
          };
        }) as unknown as typeof trpc.newsletter.adminLogin.useMutation
      );

      renderAdmin();
      expect(screen.getByText("Invalid secret.")).toBeInTheDocument();
    });

    it("shows authenticating state when pending", () => {
      vi.mocked(trpc.newsletter.adminLogin.useMutation).mockImplementation(
        ((opts?: Record<string, unknown>) => {
          if (opts) loginCallbacks = opts as typeof loginCallbacks;
          return {
            mutate: mockLoginMutate,
            isPending: true,
            isError: false,
            error: null,
          };
        }) as unknown as typeof trpc.newsletter.adminLogin.useMutation
      );

      renderAdmin();
      expect(screen.getByRole("button", { name: /authenticating/i })).toBeDisabled();
    });
  });

  describe("admin view", () => {
    function renderAdminView(listData: unknown[] = []) {
      setupMocks({ listData });

      mockLoginMutate.mockImplementation(() => {
        loginCallbacks.onSuccess?.();
      });

      renderAdmin();
      const input = screen.getByPlaceholderText("Enter admin secret");
      fireEvent.change(input, { target: { value: "s" } });
      fireEvent.submit(document.querySelector("form")!);
    }

    it("switches to admin view after successful login", () => {
      renderAdminView();
      expect(screen.getByText("Newsletter Subscribers")).toBeInTheDocument();
    });

    it("renders subscriber table with data", () => {
      renderAdminView([fakeSub("alice@test.com"), fakeSub("bob@test.com", "bounced")]);
      expect(screen.getByText("alice@test.com")).toBeInTheDocument();
      expect(screen.getByText("bob@test.com")).toBeInTheDocument();
      expect(screen.getByText("2 subscribers")).toBeInTheDocument();
    });

    it("renders search input", () => {
      renderAdminView();
      expect(screen.getByPlaceholderText("Filter by email...")).toBeInTheDocument();
    });

    it("shows empty state when no subscribers", () => {
      renderAdminView([]);
      expect(screen.getByText("No subscribers found.")).toBeInTheDocument();
      expect(screen.getByText(/0 subscriber/)).toBeInTheDocument();
    });

    it("shows subscriber count with singular form", () => {
      renderAdminView([fakeSub("solo@test.com")]);
      expect(screen.getByText("1 subscriber")).toBeInTheDocument();
    });

    it("shows copy and download buttons", () => {
      renderAdminView();
      expect(screen.getByRole("button", { name: /copy active emails/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /download csv/i })).toBeInTheDocument();
    });
  });
});
