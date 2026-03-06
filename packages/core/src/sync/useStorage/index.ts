"use client";

import type { Observable } from "@legendapp/state";
import type { ReadonlyObservable } from "../../types";
import { useMemo } from "react";
import { useObservable } from "@legendapp/state/react";
import { syncState } from "@legendapp/state";
import { synced, type PersistOptions } from "@legendapp/state/sync";

/**
 * Options for `useStorage`.
 */
export interface UseStorageOptions {
  /**
   * Legend-State persist plugin to use as the storage backend.
   * @see https://legendapp.com/open-source/state/v3/sync/persist-sync/
   */
  plugin: PersistOptions["plugin"];
  /**
   * Transform data on load/save. Useful for data migration, format conversion, or encryption.
   */
  transform?: PersistOptions["transform"];
  /**
   * Persist pending changes and retry sync after app restart.
   */
  retrySync?: PersistOptions["retrySync"];
  /**
   * Mark the persisted data as read-only (no writes).
   */
  readonly?: PersistOptions["readonly"];
  /**
   * Additional plugin-specific options (e.g. IndexedDB prefixID/itemID, MMKV config).
   */
  options?: PersistOptions["options"];
}

/**
 * Return type for `useStorage`.
 */
export interface UseStorageReturn<T> {
  /** The persisted observable data. */
  data$: Observable<T>;
  /** Whether persisted data has been loaded (relevant for async plugins like IndexedDB). */
  isLoaded$: ReadonlyObservable<boolean>;
  isPersistLoaded$: ReadonlyObservable<boolean>;
  /** The most recent persist error, if any. */
  error$: ReadonlyObservable<Error | undefined>;
}

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
  const { plugin, transform, retrySync, readonly: readonlyOpt, options: pluginOptions } = options;

  const data$ = useObservable(
    synced({
      initial: defaults,
      persist: {
        name: key,
        plugin,
        transform,
        retrySync,
        readonly: readonlyOpt,
        options: pluginOptions,
      },
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Observable<T> is compatible at runtime; Legend-State's ObservableParam type is overly narrow
  const state$ = useMemo(() => syncState(data$ as any), [data$]);

  return {
    data$,
    isLoaded$: state$.isLoaded,
    isPersistLoaded$: state$.isPersistLoaded as unknown as ReadonlyObservable<boolean>,
    error$: state$.error as unknown as ReadonlyObservable<Error | undefined>,
  };
}
