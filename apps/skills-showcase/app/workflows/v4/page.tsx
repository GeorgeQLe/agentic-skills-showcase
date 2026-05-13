import type { Metadata } from "next";
import { TuiPlayful } from "@/showcase/tui/v4/TuiPlayful";

export const metadata: Metadata = {
  title: "V4: Playful Lab / Workflow Lab",
  description: "Colorful, rounded, fun workflow demo.",
};

export default function V4Page() {
  return <TuiPlayful />;
}
