import type { Metadata } from "next";
import { TuiRetro } from "@/showcase/tui/v3/TuiRetro";

export const metadata: Metadata = {
  title: "V3: Retro CRT / Workflow Lab",
  description: "Amber-on-navy CRT monitor style workflow demo.",
};

export default function V3Page() {
  return <TuiRetro />;
}
