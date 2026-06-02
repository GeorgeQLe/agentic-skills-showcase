import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "next/link": resolve(__dirname, "src/__mocks__/next-link.tsx"),
      "next/navigation": resolve(__dirname, "src/__mocks__/next-navigation.ts"),
      "next/script": resolve(__dirname, "src/__mocks__/next-script.tsx"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__test-setup__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
