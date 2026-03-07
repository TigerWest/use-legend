"use client";

import { useConstant } from "@shared/useConstant";
import { useUnmount } from "@legendapp/state/react";
import { storage } from "./core";

export { storage } from "./core";
export type { StorageOptions, StorageReturn } from "./core";

/**
 * Options for `useStorage`.
 */
export type UseStorageOptions = import("./core").StorageOptions;

/**
 * Return type for `useStorage`.
 */
export type UseStorageReturn<T> = import("./core").StorageReturn<T>;

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
export function useStorage<T>(
  key: string,
  defaults: T,
  options: UseStorageOptions
): UseStorageReturn<T>;

export function useStorage(
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults: any,
  options: UseStorageOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): UseStorageReturn<any> {
  const { dispose, ...result } = useConstant(() => storage(key, defaults, options));

  useUnmount(dispose);

  return result;
}
