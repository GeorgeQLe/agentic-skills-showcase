import type { Metadata } from "next";
import { TuiProfessional } from "@/showcase/tui/v5/TuiProfessional";

export const metadata: Metadata = {
  title: "V5: Professional Dashboard / Workflow Lab",
  description: "Dark monitoring dashboard style workflow demo.",
};

export default function V5Page() {
  return <TuiProfessional />;
}
