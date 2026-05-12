import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NewsletterSubscriber } from "@/db";

vi.mock("@/db", () => ({
  insertSubscriber: vi.fn(),
  listSubscribers: vi.fn(),
  exportSubscribers: vi.fn(),
}));

import { insertSubscriber, listSubscribers, exportSubscribers } from "@/db";
import { newsletterRouter } from "./newsletter";
import { router, publicProcedure, protectedProcedure } from "./init";

const caller = (ctx: { sessionToken: string; resHeaders: Headers }) =>
  router({ newsletter: newsletterRouter }).createCaller(ctx);

function makeCtx(sessionToken = "") {
  return { sessionToken, resHeaders: new Headers() };
}

const fakeSub = (email: string, overrides?: Partial<NewsletterSubscriber>): NewsletterSubscriber => ({
  id: "uuid-1",
  email,
  status: "active",
  source_page: "/",
  consent_text_version: "1.0",
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
  ...overrides,
});

describe("newsletter router", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NEWSLETTER_ADMIN_SECRET: "test-secret" };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("subscribe", () => {
    it("inserts a valid subscriber and returns success", async () => {
      vi.mocked(insertSubscriber).mockResolvedValue(fakeSub("a@b.com"));
      const result = await caller(makeCtx()).newsletter.subscribe({
        email: "a@b.com",
        sourcePage: "/",
        consentTextVersion: "1.0",
      });
      expect(result).toEqual({ success: true });
      expect(insertSubscriber).toHaveBeenCalledWith("a@b.com", "/", "1.0");
    });

    it("rejects invalid email via Zod", async () => {
      await expect(
        caller(makeCtx()).newsletter.subscribe({
          email: "not-an-email",
          sourcePage: "/",
          consentTextVersion: "1.0",
        })
      ).rejects.toThrow();
    });

    it("throws INTERNAL_SERVER_ERROR on DB failure", async () => {
      vi.mocked(insertSubscriber).mockRejectedValue(new Error("db down"));
      await expect(
        caller(makeCtx()).newsletter.subscribe({
          email: "a@b.com",
          sourcePage: "/",
          consentTextVersion: "1.0",
        })
      ).rejects.toThrow(/unable to process/i);
    });
  });

  describe("adminLogin", () => {
    it("returns success with correct secret", async () => {
      const ctx = makeCtx();
      const result = await caller(ctx).newsletter.adminLogin({ secret: "test-secret" });
      expect(result).toEqual({ success: true });
      expect(ctx.resHeaders.get("Set-Cookie")).toContain("newsletter_admin_session=test-secret");
    });

    it("throws UNAUTHORIZED with wrong secret", async () => {
      await expect(
        caller(makeCtx()).newsletter.adminLogin({ secret: "wrong" })
      ).rejects.toThrow(/unauthorized|invalid/i);
    });

    it("throws UNAUTHORIZED when env var is missing", async () => {
      delete process.env.NEWSLETTER_ADMIN_SECRET;
      await expect(
        caller(makeCtx()).newsletter.adminLogin({ secret: "anything" })
      ).rejects.toThrow();
    });
  });

  describe("adminList", () => {
    it("requires authentication", async () => {
      await expect(
        caller(makeCtx()).newsletter.adminList()
      ).rejects.toThrow();
    });

    it("returns subscribers for authenticated session", async () => {
      const subs = [fakeSub("a@b.com"), fakeSub("c@d.com")];
      vi.mocked(listSubscribers).mockResolvedValue(subs);
      const result = await caller(makeCtx("test-secret")).newsletter.adminList();
      expect(result).toEqual(subs);
    });
  });

  describe("adminExport", () => {
    it("returns CSV with header and escaped values", async () => {
      const subs = [
        fakeSub("simple@test.com"),
        fakeSub("has,comma@test.com", { source_page: 'page "quoted"' }),
      ];
      vi.mocked(exportSubscribers).mockResolvedValue(subs);
      const csv = await caller(makeCtx("test-secret")).newsletter.adminExport();
      const lines = csv.split("\n");
      expect(lines[0]).toBe("id,email,status,source_page,consent_text_version,created_at,updated_at");
      expect(lines).toHaveLength(3);
      expect(lines[1]).toContain("simple@test.com");
      expect(lines[2]).toContain('"has,comma@test.com"');
      expect(lines[2]).toContain('"page ""quoted"""');
    });

    it("requires authentication", async () => {
      await expect(
        caller(makeCtx()).newsletter.adminExport()
      ).rejects.toThrow();
    });
  });
});
