"use client";

import { createStorage } from "./core";
import { useConstant } from "@shared/useConstant";

export { createStorage } from "./core";
export type { StorageOptions, StorageReturn } from "./core";

/**
 * Reactive storage binding powered by Legend-State's
 * [persist & sync](https://legendapp.com/open-source/state/v3/sync/persist-sync/) engine.
 *
 * Creates an `Observable<T>` that automatically persists to a storage backend.
 *
 * @param key - Storage key (maps to `persist.name`).
 * @param defaults - Initial value and type inference source.
 * @param options - Configuration options. `plugin` is required.
 * @returns `{ data$, isPersistLoaded$, error$ }`
 *
 * @example
 * ```ts
 * import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
 *
 * const { data$: count$, isPersistLoaded$ } = useStorage('count', 0, {
 *   plugin: ObservablePersistLocalStorage,
 * });
 * data$.set(42); // persisted to storage
 * data$.get();   // 42
 * ```
 */
export type UseStorage = typeof createStorage;
export const useStorage: UseStorage = (key, defaults, options) => {
  return useConstant(() => createStorage(key, defaults, options));
};
