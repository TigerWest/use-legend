"use client";
import { QueryClient } from "@tanstack/query-core";
import { useQueryClientCtx, getQueryClientCtx } from "../QueryClientProvider";

const ERROR_MESSAGE =
  "useQueryClient must be used within a QueryClientProvider. " +
  "Make sure your component tree is wrapped with <QueryClientProvider client={queryClient}>.";

/**
 * Hook to retrieve the QueryClient from context.
 *
 * @throws Error if used outside of QueryClientProvider
 */
export function useQueryClient(): QueryClient {
  const client = useQueryClientCtx();
  if (!client) throw new Error(ERROR_MESSAGE);
  return client;
}

/**
 * Retrieve the QueryClient from context inside a `useScope` factory.
 * Uses `inject` under the hood — must be called during the scope's first mount.
 *
 * @throws Error if used outside of QueryClientProvider
 */
export function getQueryClient(): QueryClient {
  const client = getQueryClientCtx();
  if (!client) throw new Error(ERROR_MESSAGE);
  return client;
}
