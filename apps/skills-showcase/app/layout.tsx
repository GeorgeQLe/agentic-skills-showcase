import type { Metadata, Viewport } from "next";
import Script from "next/script";

import ShowcaseHeader from "@/showcase/ShowcaseHeader";
import MobilePanel from "@/showcase/MobilePanel";
import ShowcaseShell from "@/showcase/ShowcaseShell";
import { TRPCProvider } from "@/trpc/provider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gskillpacks.com"),
  title: "G Skillpacks",
  description:
    "The skill packs for agentic-skills workflows, packs, proof data, and follow updates.",
  openGraph: {
    images: [{ url: "/opengraph-image.png", width: 1254, height: 1254 }]
  }
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
        <TRPCProvider>
          <ShowcaseHeader />
          <MobilePanel />
          <ShowcaseShell />
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
