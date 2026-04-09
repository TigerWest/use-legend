import { observable, syncState } from "@legendapp/state";
import type { Observable } from "@legendapp/state";
import { synced } from "@legendapp/state/sync";
import type { ReadonlyObservable } from "../../types";

/**
 * Options for `remote` / `useRemote`.
 */
export interface RemoteOptions<T> {
  /**
   * Function that fetches remote data.
   */
  get: () => Promise<T> | T;
  /**
   * Function that sends changes to the remote.
   */
  set?: (params: { value: T; changes: object[] }) => Promise<void> | void;
  /**
   * Initial value before the first fetch completes.
   */
  initial?: T;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load?: (value: any) => T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    save?: (value: T) => any;
  };
}

/**
 * Return type for `remote` / `useRemote`.
 */
export interface RemoteReturn<T> {
  /** The synced observable data. */
  data$: Observable<T>;
  /** Whether the initial remote fetch has completed. */
  isLoaded$: ReadonlyObservable<boolean>;
  /** Whether a fetch (initial or refetch) is currently in progress. */
  isFetching$: ReadonlyObservable<boolean>;
  /** The most recent sync error, if any. */
  error$: ReadonlyObservable<Error | undefined>;
  /** Trigger a manual re-fetch from remote. */
  refetch: () => void;
}

/**
 * Core observable function for reactive remote data binding.
 * Creates an `Observable<T>` that fetches from and optionally pushes to a remote source.
 * No local persistence — data lives only in memory.
 *
 * @param options - Remote sync configuration.
 * @returns `Disposable & { data$, isLoaded$, isFetching$, error$, refetch }`
 */
export function createRemote<T>(options: RemoteOptions<T>): RemoteReturn<T> {
  const { get, set, initial, mode, debounceSet, transform } = options;

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
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Observable<T> is compatible at runtime; Legend-State's ObservableParam type is overly narrow
  const state$ = syncState(data$ as any);

  return {
    data$,
    isLoaded$: state$.isLoaded as unknown as ReadonlyObservable<boolean>,
    isFetching$: isFetching$ as unknown as ReadonlyObservable<boolean>,
    error$: state$.error as unknown as ReadonlyObservable<Error | undefined>,
    refetch: () => state$.sync(),
  };
}
