import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import HomePage from "../../app/page";
import WorkflowsPage from "../../app/workflows/page";
import CatalogPage from "../../app/catalog/page";
import BenchmarksPage from "../../app/benchmarks/page";
import PacksPage from "../../app/packs/page";
import InspectPage from "../../app/inspect/page";
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

  it("HomePage renders hero and navigation links", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Explore Packs")).toBeInTheDocument();
    expect(screen.getByText("Follow G’s Work")).toBeInTheDocument();
  });

  it("ShowcaseHeader renders the G Skillpacks icon", () => {
    render(<ShowcaseHeader />);
    const icon = document.querySelector(".brand-mark") as HTMLImageElement;
    expect(icon).toBeInTheDocument();
    expect(icon.getAttribute("src")).toBe("/icon.png");
  });

  it("HomePage renders route cards", () => {
    render(<HomePage />);
    expect(screen.getByText("Workflow Lab")).toBeInTheDocument();
    expect(screen.getByText("Pack Map")).toBeInTheDocument();
    expect(screen.getByText("Skill Catalog")).toBeInTheDocument();
  });

  it("WorkflowsPage renders title and controls", () => {
    render(<WorkflowsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Previous step")).toBeInTheDocument();
    expect(screen.getByLabelText("Next step")).toBeInTheDocument();
  });

  it("CatalogPage renders search and filter controls", () => {
    render(<CatalogPage />);
    expect(screen.getByText(/Every source skill gets an inspectable row/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search skills/i)).toBeInTheDocument();
  });

  it("PacksPage renders title and filter buttons", () => {
    render(<PacksPage />);
    expect(screen.getByText(/Install the workflow language/i)).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
    expect(screen.getByText("Devtool")).toBeInTheDocument();
    expect(screen.getByText("Game")).toBeInTheDocument();
  });

  it("BenchmarksPage renders title and matrix link", () => {
    render(<BenchmarksPage />);
    expect(screen.getByText(/Evaluated benchmark evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/benchmark results matrix/i)).toBeInTheDocument();
  });

  it("InspectPage renders proof surface heading", () => {
    render(<InspectPage />);
    expect(screen.getByText(/Receipts first, claims second/i)).toBeInTheDocument();
    expect(screen.getByText("Follow from proof")).toBeInTheDocument();
    expect(screen.getByText("Open GitHub")).toBeInTheDocument();
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
