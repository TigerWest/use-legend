"use client";

import { createOfflineFirst } from "./core";
import { useConstant } from "@shared/useConstant";

export { createOfflineFirst } from "./core";
export type { OfflineFirstOptions, OfflineFirstReturn } from "./core";

/**
 * Reactive offline-first data binding powered by Legend-State's
 * [sync engine](https://legendapp.com/open-source/state/v3/sync/persist-sync/).
 *
 * Combines remote sync with local persistence and automatic retry.
 * Data is available immediately from local cache, then updated from the remote source.
 * Failed remote operations are persisted locally and retried automatically.
 *
 * @param options - Offline-first sync configuration.
 * @returns `{ data$, isLoaded$, isPersistLoaded$, error$, lastSync$, refetch, clearPersist }`
 *
 * @example
 * ```ts
 * import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
 *
 * const { data$, isLoaded$, isFetching$, isPersistLoaded$, refetch } = useOfflineFirst<Settings>({
 *   get: () => fetch('/api/settings').then(r => r.json()),
 *   set: ({ value }) => fetch('/api/settings', {
 *     method: 'PUT',
 *     body: JSON.stringify(value),
 *   }),
 *   persistKey: 'settings',
 *   persistPlugin: ObservablePersistLocalStorage,
 *   initial: defaultSettings,
 * });
 * ```
 */
export type UseOfflineFirst = typeof createOfflineFirst;
export const useOfflineFirst: UseOfflineFirst = (options) => {
  return useConstant(() => createOfflineFirst(options));
};
