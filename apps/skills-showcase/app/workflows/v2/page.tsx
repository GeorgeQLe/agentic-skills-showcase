import type { Metadata } from "next";
import { TuiClean } from "@/showcase/tui/v2/TuiClean";

export const metadata: Metadata = {
  title: "V2: Clean Minimal / Workflow Lab",
  description: "Light, spacious dev-docs style workflow demo.",
};

export default function V2Page() {
  return <TuiClean />;
}
