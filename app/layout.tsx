/*
 * Root layout - loads skills-data.js and github-proof-data.js via
 * <Script strategy="beforeInteractive"> so the catalog JSON lands on
 * window.SKILLS_SHOWCASE_DATA before React hydration. Client components
 * read this directly instead of making an API call.
 */
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import ShowcaseHeader from "@/showcase/ShowcaseHeader";
import MobilePanel from "@/showcase/MobilePanel";
import ShowcaseShell from "@/showcase/ShowcaseShell";
import { NO_FLASH_SCRIPT } from "@/showcase/theme";
import { TRPCProvider } from "@/trpc/provider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gskillpacks.com"),
  title: "G Skillpacks",
  description:
    "The AFPS pipeline and skill library for Claude Code and Codex — alignment, prototype, specification, and shipping workflows.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
      { url: "/app-icon.png", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }]
  },
  openGraph: {
    images: [{ url: "/opengraph-image.png", width: 1254, height: 1254 }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children,
  modal
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set data-theme before paint so the surface theme never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
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
          {modal}
        </TRPCProvider>
      </body>
    </html>
  );
}
