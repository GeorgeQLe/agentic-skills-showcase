import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import HomePage from "../../app/page";
import FollowPage from "../../app/follow/page";
import ShowcaseHeader from "./ShowcaseHeader";

vi.mock("@/trpc/client", () => ({
  trpc: {
    newsletter: {
      subscribe: {
        useMutation: () => ({ mutate: vi.fn() }),
      },
    },
  },
}));

describe("smoke rendering", () => {
  afterEach(() => {
    cleanup();
  });

  // Phase 4: HomePage is now the pack-first landing. Without the injected
  // window.SKILLS_SHOWCASE_DATA it renders the loading surface; the footer (and
  // its preserved links) renders below regardless. The full picker/journey is
  // covered with mocked data in landing/LandingExperience.test.tsx.
  it("HomePage renders the landing surface and preserved footer", () => {
    render(<HomePage />);
    expect(screen.getByTestId("landing-loading")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The AFPS pipeline and skill library for Claude Code and Codex.",
      ),
    ).toBeInTheDocument();
  });

  it("ShowcaseHeader renders the G Skillpacks icon", () => {
    render(<ShowcaseHeader />);
    const icon = document.querySelector(".brand-mark") as HTMLImageElement;
    expect(icon).toBeInTheDocument();
    expect(icon.getAttribute("src")).toBe("/icon.png");
  });

  it("FollowPage renders hero and conversion paths", () => {
    render(<FollowPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Follow G" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Enter LexCorp" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Join the community" })).toBeInTheDocument();
  });

  it("FollowPage renders newsletter form", () => {
    render(<FollowPage />);
    expect(screen.getByText("Get the next workflow drop.")).toBeInTheDocument();
    expect(screen.getByText("Join the list")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("email@example.com")).toBeInTheDocument();
  });
});
