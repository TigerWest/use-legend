import { observable, syncState } from "@legendapp/state";
import type { Observable } from "@legendapp/state";
import { synced, type PersistOptions } from "@legendapp/state/sync";
import type { Disposable, ReadonlyObservable } from "../../types";

/**
 * Options for `offlineFirst` / `useOfflineFirst`.
 */
export interface OfflineFirstOptions<T> {
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
 * Return type for `offlineFirst` / `useOfflineFirst`.
 */
export interface OfflineFirstReturn<T> {
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
 * Core observable function for offline-first data binding.
 * Combines remote sync with local persistence and automatic retry.
 * Data is available immediately from local cache, then updated from the remote source.
 *
 * @param options - Offline-first sync configuration.
 * @returns `Disposable & { data$, isLoaded$, isFetching$, isPersistLoaded$, error$, lastSync$, refetch, clearPersist }`
 */
export function offlineFirst<T>(
  options: OfflineFirstOptions<T>
): Disposable & OfflineFirstReturn<T> {
  const { get, set, initial, persistKey, persistPlugin, mode, debounceSet, transform, retry } =
    options;

  const isFetching$ = observable(false);

  const wrappedGet = async () => {
    isFetching$.set(true);
    try {
      return await get();
    } finally {
      isFetching$.set(false);
    }
  };

  const data$ = observable<T>(
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
  const state$ = syncState(data$ as any);

  return {
    data$,
    isLoaded$: state$.isLoaded as unknown as ReadonlyObservable<boolean>,
    isFetching$: isFetching$ as unknown as ReadonlyObservable<boolean>,
    isPersistLoaded$: state$.isPersistLoaded as unknown as ReadonlyObservable<boolean>,
    error$: state$.error as unknown as ReadonlyObservable<Error | undefined>,
    lastSync$: state$.lastSync as unknown as ReadonlyObservable<number | undefined>,
    refetch: () => state$.sync(),
    clearPersist: () => state$.clearPersist(),
    dispose: () => {},
  };
}
