"use client";

import { useConstant } from "@shared/useConstant";
import { useUnmount } from "@legendapp/state/react";
import { createRemote } from "./core";

export { createRemote } from "./core";
export type { RemoteOptions, RemoteReturn } from "./core";

/**
 * Options for `useRemote`.
 */
export type UseRemoteOptions<T> = import("./core").RemoteOptions<T>;

/**
 * Return type for `useRemote`.
 */
export type UseRemoteReturn<T> = import("./core").RemoteReturn<T>;

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
export function useRemote<T>(options: UseRemoteOptions<T>): UseRemoteReturn<T> {
  const { dispose, ...result } = useConstant(() => createRemote(options));

  useUnmount(dispose);

  return result;
}
