import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic Skills Showcase",
  description:
    "A browsable showcase of agentic-skills workflows, packs, proof data, and follow updates."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
