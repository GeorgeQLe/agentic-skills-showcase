import type { Metadata } from "next";
import { TuiHacker } from "@/showcase/tui/v1/TuiHacker";

export const metadata: Metadata = {
  title: "V1: Hacker Terminal / Workflow Lab",
  description: "Dark phosphor terminal-style workflow demo.",
};

export default function V1Page() {
  return <TuiHacker />;
}
