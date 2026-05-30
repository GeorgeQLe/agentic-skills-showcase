import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture every tagged-template call issued by the db layer so we can assert on
// the SQL text and bound parameters without a live Neon connection.
const calls: { text: string; values: unknown[] }[] = [];
let nextRows: unknown[] = [];

vi.mock("@neondatabase/serverless", () => ({
  neon: () => {
    return (strings: TemplateStringsArray, ...values: unknown[]) => {
      calls.push({ text: strings.join("?"), values });
      return Promise.resolve(nextRows);
    };
  },
}));

import {
  insertSubscriber,
  countRecentSubscribeAttempts,
  recordSubscribeAttempt,
} from "./index";

function normalize(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

describe("db/index", () => {
  beforeEach(() => {
    calls.length = 0;
    nextRows = [];
    process.env.DATABASE_URL = "postgres://user:pass@host/db";
  });

  describe("insertSubscriber ON CONFLICT", () => {
    it("does not overwrite consent metadata on conflict, only bumps updated_at and reactivates status", async () => {
      nextRows = [
        {
          id: "uuid-1",
          email: "a@b.com",
          status: "active",
          source_page: "/original",
          consent_text_version: "0.9",
          created_at: new Date("2026-01-01"),
          updated_at: new Date("2026-02-02"),
        },
      ];

      const row = await insertSubscriber("a@b.com", "/attacker", "9.9");

      const sql = normalize(calls[0].text);
      // Conflict update must only touch updated_at and status.
      expect(sql).toContain("on conflict (email) do update set");
      expect(sql).toContain("updated_at = now()");
      expect(sql).toContain("status = 'active'");
      // It must NOT rewrite the recorded consent columns from EXCLUDED.
      expect(sql).not.toContain("source_page = excluded.source_page");
      expect(sql).not.toContain("consent_text_version = excluded.consent_text_version");

      // Original consent is preserved in the returned row; return shape unchanged.
      expect(row.source_page).toBe("/original");
      expect(row.consent_text_version).toBe("0.9");
      expect(row.status).toBe("active");
    });
  });

  describe("rate-limit helpers", () => {
    it("countRecentSubscribeAttempts queries the per-IP sliding window", async () => {
      nextRows = [{ count: 3 }];
      const count = await countRecentSubscribeAttempts("1.2.3.4", 10);

      const sql = normalize(calls[0].text);
      expect(sql).toContain("from newsletter_subscribe_attempts");
      expect(sql).toContain("where ip =");
      expect(sql).toContain("created_at >= now() - make_interval");
      expect(calls[0].values).toContain("1.2.3.4");
      expect(calls[0].values).toContain(10);
      expect(count).toBe(3);
    });

    it("countRecentSubscribeAttempts defaults to 0 when no rows return", async () => {
      nextRows = [];
      const count = await countRecentSubscribeAttempts("1.2.3.4", 10);
      expect(count).toBe(0);
    });

    it("recordSubscribeAttempt inserts a row for the IP", async () => {
      nextRows = [];
      await recordSubscribeAttempt("5.6.7.8");

      const sql = normalize(calls[0].text);
      expect(sql).toContain("insert into newsletter_subscribe_attempts");
      expect(sql).toContain("(ip)");
      expect(calls[0].values).toContain("5.6.7.8");
    });
  });
});
