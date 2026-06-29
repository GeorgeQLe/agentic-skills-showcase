/** @type {import('next').NextConfig} */

// Unified-experience Phase 6: the five legacy marketing routes are folded into
// `/` (the pack-first front door). Config-level 308s are the single source of
// truth — real permanent redirects, no React render, no stale page to maintain.
const LEGACY_ROUTES = ["/catalog", "/packs", "/workflows", "/benchmarks", "/inspect"];

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return LEGACY_ROUTES.map((source) => ({
      source,
      destination: "/",
      permanent: true
    }));
  }
};

export default nextConfig;
