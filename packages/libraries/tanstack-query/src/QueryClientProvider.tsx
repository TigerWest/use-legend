"use client";
import { createProvider } from "@usels/core";
import { QueryClient } from "@tanstack/query-core";

/**
 * Provider component that makes QueryClient available to hooks.
 *
 * @example
 * ```tsx
 * import { QueryClient } from '@tanstack/react-query'
 * import { QueryClientProvider } from '@usels/tanstack-query'
 *
 * const queryClient = new QueryClient()
 *
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   )
 * }
 * ```
 */
export const [QueryClientProvider, useQueryClientCtx, getQueryClientCtx] = createProvider(
  (props: { client: QueryClient }) => props.client,
  { name: "QueryClient", strict: false }
);

export { QueryClient };
