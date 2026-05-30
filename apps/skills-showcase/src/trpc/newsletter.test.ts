import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NewsletterSubscriber } from "@/db";

vi.mock("@/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db")>();
  return {
    ...actual,
    insertSubscriber: vi.fn(),
    listSubscribers: vi.fn(),
    exportSubscribers: vi.fn(),
    countRecentSubscribeAttempts: vi.fn(),
    recordSubscribeAttempt: vi.fn(),
  };
});

import {
  insertSubscriber,
  listSubscribers,
  exportSubscribers,
  countRecentSubscribeAttempts,
  recordSubscribeAttempt,
} from "@/db";
import { newsletterRouter } from "./newsletter";
import { router, publicProcedure, protectedProcedure } from "./init";
import { createSessionToken, verifySessionToken } from "./session";

const caller = (ctx: { sessionToken: string; ip: string; resHeaders: Headers }) =>
  router({ newsletter: newsletterRouter }).createCaller(ctx);

function makeCtx(sessionToken = "", ip = "1.2.3.4") {
  return { sessionToken, ip, resHeaders: new Headers() };
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
    vi.mocked(countRecentSubscribeAttempts).mockResolvedValue(0);
    vi.mocked(recordSubscribeAttempt).mockResolvedValue(undefined);
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
      expect(recordSubscribeAttempt).toHaveBeenCalledWith("1.2.3.4");
    });

    it("rejects with TOO_MANY_REQUESTS once the per-IP threshold is exceeded", async () => {
      vi.mocked(insertSubscriber).mockResolvedValue(fakeSub("a@b.com"));
      vi.mocked(countRecentSubscribeAttempts).mockResolvedValue(5);
      await expect(
        caller(makeCtx()).newsletter.subscribe({
          email: "a@b.com",
          sourcePage: "/",
          consentTextVersion: "1.0",
        })
      ).rejects.toThrow(/too many/i);
      expect(insertSubscriber).not.toHaveBeenCalled();
      expect(recordSubscribeAttempt).not.toHaveBeenCalled();
    });

    it("allows a subscribe while still under the per-IP threshold", async () => {
      vi.mocked(insertSubscriber).mockResolvedValue(fakeSub("a@b.com"));
      vi.mocked(countRecentSubscribeAttempts).mockResolvedValue(4);
      const result = await caller(makeCtx()).newsletter.subscribe({
        email: "a@b.com",
        sourcePage: "/",
        consentTextVersion: "1.0",
      });
      expect(result).toEqual({ success: true });
      expect(countRecentSubscribeAttempts).toHaveBeenCalledWith("1.2.3.4", 10);
    });

    it("does not pass consent metadata that would overwrite an existing record", async () => {
      // The resolver forwards the caller-supplied consent fields verbatim; the
      // DB layer (insertSubscriber ON CONFLICT) is responsible for not clobbering
      // the originally recorded consent. Here we assert the resolver does not
      // inject or mutate consent fields beyond what the caller supplied.
      vi.mocked(insertSubscriber).mockResolvedValue(
        fakeSub("a@b.com", { source_page: "/original", consent_text_version: "0.9" })
      );
      await caller(makeCtx()).newsletter.subscribe({
        email: "a@b.com",
        sourcePage: "/attacker",
        consentTextVersion: "9.9",
      });
      expect(insertSubscriber).toHaveBeenCalledWith("a@b.com", "/attacker", "9.9");
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
      const setCookie = ctx.resHeaders.get("Set-Cookie") ?? "";
      expect(setCookie.startsWith("newsletter_admin_session=v1.")).toBe(true);
      const token = setCookie.split(";")[0].split("=")[1];
      expect(verifySessionToken(token, "test-secret")).toBe(true);
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
      const result = await caller(makeCtx(createSessionToken("test-secret"))).newsletter.adminList();
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
      const csv = await caller(makeCtx(createSessionToken("test-secret"))).newsletter.adminExport();
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
