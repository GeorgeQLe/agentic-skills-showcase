import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { showcaseRoutes } from "./routes";
import type { ShowcaseRoute } from "./routes";

describe("showcaseRoutes", () => {
  it("exports exactly 7 public routes", () => {
    expect(showcaseRoutes).toHaveLength(7);
  });

  it("every route has href, label, and description", () => {
    showcaseRoutes.forEach((route: ShowcaseRoute) => {
      expect(route.href).toBeTruthy();
      expect(route.label).toBeTruthy();
      expect(route.description).toBeTruthy();
    });
  });

  it("every href starts with /", () => {
    showcaseRoutes.forEach((route) => {
      expect(route.href).toMatch(/^\//);
    });
  });

  it("has no duplicate hrefs", () => {
    const hrefs = showcaseRoutes.map((r) => r.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("has no duplicate labels", () => {
    const labels = showcaseRoutes.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes the expected route hrefs", () => {
    const hrefs = showcaseRoutes.map((r) => r.href);
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/workflows");
    expect(hrefs).toContain("/packs");
    expect(hrefs).toContain("/catalog");
    expect(hrefs).toContain("/inspect");
    expect(hrefs).toContain("/follow");
    expect(hrefs).toContain("/admin/newsletter");
  });

  it("includes the expected labels", () => {
    const labels = showcaseRoutes.map((r) => r.label);
    expect(labels).toContain("Overview");
    expect(labels).toContain("Workflows");
    expect(labels).toContain("Packs");
    expect(labels).toContain("Catalog");
    expect(labels).toContain("Inspect");
    expect(labels).toContain("Follow");
    expect(labels).toContain("Admin");
  });
});

describe("privacy: public assets", () => {
  const publicDir = join(__dirname, "../../public");

  function collectFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) results.push(...collectFiles(full));
        else results.push(full);
      }
    } catch {
      // public dir may not exist in test env
    }
    return results;
  }

  it("public assets do not contain subscriber data patterns", () => {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const subscriberKeywords = /newsletter_subscribers|subscriber_id|consent_text_version/i;
    const files = collectFiles(publicDir);

    for (const file of files) {
      if (/\.(png|jpg|jpeg|gif|ico|woff2?|ttf|eot|svg)$/i.test(file)) continue;
      const content = readFileSync(file, "utf-8");
      const hasRealEmails = content.match(emailPattern)?.some(
        (m) => !m.includes("example.com") && !m.includes("placeholder")
      );
      expect(hasRealEmails, `${file} may contain subscriber emails`).toBeFalsy();
      expect(content).not.toMatch(subscriberKeywords);
    }
  });
});
