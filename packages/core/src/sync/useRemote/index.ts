"use client";

import { createRemote } from "./core";
import { useConstant } from "@shared/useConstant";

export { createRemote } from "./core";
export type { RemoteOptions, RemoteReturn } from "./core";

/**
 * Reactive remote data binding powered by Legend-State's
 * [sync engine](https://legendapp.com/open-source/state/v3/sync/persist-sync/).
 *
 * Creates an `Observable<T>` that fetches from and optionally pushes to a remote source.
 * No local persistence — data lives only in memory.
 *
 * @param options - Remote sync configuration.
 * @returns `{ data$, isLoaded$, isFetching$, error$, refetch }`
 *
 * @example
 * ```ts
 * const { data$, isLoaded$, isFetching$, error$, refetch } = useRemote<User>({
 *   get: () => fetch('/api/user').then(r => r.json()),
 *   set: ({ value }) => fetch('/api/user', {
 *     method: 'PUT',
 *     body: JSON.stringify(value),
 *   }),
 *   initial: null,
 * });
 * ```
 */
export type UseRemote = typeof createRemote;
export const useRemote: UseRemote = (options) => {
  return useConstant(() => createRemote(options));
};
