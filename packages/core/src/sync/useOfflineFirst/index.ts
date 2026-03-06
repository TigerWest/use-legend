"use client";

import type { Observable } from "@legendapp/state";
import type { ReadonlyObservable } from "../../types";
import { useMemo } from "react";
import { useObservable } from "@legendapp/state/react";
import { syncState } from "@legendapp/state";
import { synced, type PersistOptions } from "@legendapp/state/sync";

/**
 * Options for `useOfflineFirst`.
 */
export interface UseOfflineFirstOptions<T> {
  /**
   * Function that fetches remote data.
   */
  get: () => Promise<T> | T;
  /**
   * Function that sends changes to the remote.
   */
  set?: (params: { value: T; changes: object[] }) => Promise<void> | void;
  /**
   * Initial value before data is loaded from persist or remote.
   */
  initial?: T;
  /**
   * Storage key for local persistence.
   */
  persistKey: string;
  /**
   * Legend-State persist plugin to use as the storage backend.
   * @see https://legendapp.com/open-source/state/v3/sync/persist-sync/
   */
  persistPlugin: PersistOptions["plugin"];
  /**
   * How incoming data merges with existing state.
   * @default "set"
   */
  mode?: "set" | "assign" | "merge" | "append" | "prepend";
  /**
   * Milliseconds to debounce before sending changes to remote.
   */
  debounceSet?: number;
  /**
   * Transform data on load/save.
   */
  transform?: {
    load?: (value: any) => T; // eslint-disable-line @typescript-eslint/no-explicit-any
    save?: (value: T) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
  /**
   * Retry configuration for failed remote operations.
   * @default { infinite: true, backoff: "exponential", maxDelay: 30000 }
   */
  retry?: {
    infinite?: boolean;
    backoff?: "constant" | "exponential";
    maxDelay?: number;
  };
}

/**
 * Return type for `useOfflineFirst`.
 */
export interface UseOfflineFirstReturn<T> {
  /** The synced observable data. */
  data$: Observable<T>;
  /** Whether the remote data has been loaded. */
  isLoaded$: ReadonlyObservable<boolean>;
  /** Whether a fetch (initial or refetch) is currently in progress. */
  isFetching$: ReadonlyObservable<boolean>;
  /** Whether locally persisted data has been loaded. */
  isPersistLoaded$: ReadonlyObservable<boolean>;
  /** The most recent sync error, if any. */
  error$: ReadonlyObservable<Error | undefined>;
  /** Timestamp of the last successful sync. */
  lastSync$: ReadonlyObservable<number | undefined>;
  /** Trigger a manual re-fetch from remote. */
  refetch: () => void;
  /** Clear all locally persisted data. */
  clearPersist: () => void;
}

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
export function useOfflineFirst<T>(options: UseOfflineFirstOptions<T>): UseOfflineFirstReturn<T> {
  const { get, set, initial, persistKey, persistPlugin, mode, debounceSet, transform, retry } =
    options;

  const isFetching$ = useObservable(false);

  const wrappedGet = async () => {
    isFetching$.set(true);
    try {
      return await get();
    } finally {
      isFetching$.set(false);
    }
  };

  const data$ = useObservable<T>(
    synced({
      get: wrappedGet,
      set,
      initial: initial as T,
      mode,
      debounceSet,
      transform,
      persist: {
        name: persistKey,
        plugin: persistPlugin,
        retrySync: true,
      },
      retry: {
        infinite: retry?.infinite ?? true,
        backoff: retry?.backoff ?? "exponential",
        maxDelay: retry?.maxDelay ?? 30000,
      },
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Observable<T> is compatible at runtime; Legend-State's ObservableParam type is overly narrow
  const state$ = useMemo(() => syncState(data$ as any), [data$]);

  return {
    data$,
    isLoaded$: state$.isLoaded as unknown as ReadonlyObservable<boolean>,
    isFetching$: isFetching$ as unknown as ReadonlyObservable<boolean>,
    isPersistLoaded$: state$.isPersistLoaded as unknown as ReadonlyObservable<boolean>,
    error$: state$.error as unknown as ReadonlyObservable<Error | undefined>,
    lastSync$: state$.lastSync as unknown as ReadonlyObservable<number | undefined>,
    refetch: () => state$.sync(),
    clearPersist: () => state$.clearPersist(),
  };
}
