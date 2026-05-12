import type { Metadata, Viewport } from "next";
import Script from "next/script";

import ShowcaseHeader from "@/showcase/ShowcaseHeader";
import MobilePanel from "@/showcase/MobilePanel";
import ShowcaseShell from "@/showcase/ShowcaseShell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic Skills Showcase",
  description:
    "A browsable showcase of agentic-skills workflows, packs, proof data, and follow updates."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="/assets/skills-data.js" strategy="beforeInteractive" />
        <Script
          src="/assets/github-proof-data.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <ShowcaseHeader />
        <MobilePanel />
        <ShowcaseShell />
        {children}
      </body>
    </html>
  );
}
