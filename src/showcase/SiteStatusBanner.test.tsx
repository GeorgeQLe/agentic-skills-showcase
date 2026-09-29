import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import SiteStatusBanner from "./SiteStatusBanner";

afterEach(cleanup);

describe("SiteStatusBanner", () => {
  it("renders the retirement notice as a labelled aside", () => {
    render(<SiteStatusBanner />);
    const aside = screen.getByRole("complementary", { name: "Site status" });
    expect(aside.textContent).toContain(
      "The GSkillPacks product is retired; the open-source skills are not."
    );
    const link = screen.getByRole("link", { name: "Read the post-mortem →" });
    expect(link.getAttribute("href")).toBe(
      "https://www.leexperimental.com/graveyard/gskillpacks"
    );
  });
});
