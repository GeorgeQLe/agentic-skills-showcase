"use client";

/**
 * Client-side tRPC + React Query provider.
 */
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // useState(() => ...) initializer prevents re-creation on every render.
  // Without this, each render would create new client instances, breaking
  // React Query's cache and causing infinite refetch loops.
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: "/api/trpc" })],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
