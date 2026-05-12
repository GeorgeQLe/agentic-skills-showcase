import { describe, it, expect } from "vitest";
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
