"use client";
import { type ReactNode, useMemo } from "react";
import {
  dehydrate,
  hydrate,
  type DehydrateOptions,
  type DehydratedState,
  type HydrateOptions,
} from "@tanstack/query-core";
import { useQueryClient } from "./useQueryClient";

export interface HydrationBoundaryProps {
  children: ReactNode;
  state?: DehydratedState | null;
  options?: HydrateOptions;
}

/**
 * Hydrates a QueryClient with server-prefetched state before rendering children.
 *
 * @example
 * ```tsx
 * <QueryClientProvider client={queryClient}>
 *   <HydrationBoundary state={dehydratedState}>
 *     <App />
 *   </HydrationBoundary>
 * </QueryClientProvider>
 * ```
 */
export function HydrationBoundary({ children, state, options }: HydrationBoundaryProps) {
  const queryClient = useQueryClient();
  useMemo(() => {
    if (state) {
      hydrate(queryClient, state, options);
    }
  }, [queryClient, state, options]);

  return <>{children}</>;
}

export { dehydrate, hydrate };
export type { DehydratedState, DehydrateOptions, HydrateOptions };
