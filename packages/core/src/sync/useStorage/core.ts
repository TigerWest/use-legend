import { observable, syncState } from "@legendapp/state";
import type { Observable } from "@legendapp/state";
import { synced, type PersistOptions } from "@legendapp/state/sync";
import type { ReadonlyObservable } from "../../types";

/**
 * Options for `storage` / `useStorage`.
 */
export interface StorageOptions {
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
 * Return type for `storage` / `useStorage`.
 */
export interface StorageReturn<T> {
  /** The persisted observable data. */
  data$: Observable<T>;
  /** Whether persisted data has been loaded (relevant for async plugins like IndexedDB). */
  isLoaded$: ReadonlyObservable<boolean>;
  isPersistLoaded$: ReadonlyObservable<boolean>;
  /** The most recent persist error, if any. */
  error$: ReadonlyObservable<Error | undefined>;
}

/**
 * Core observable function for reactive storage binding.
 * Creates an `Observable<T>` that automatically persists to a storage backend,
 * powered by Legend-State's persist & sync engine.
 *
 * @param key - Storage key (maps to `persist.name`).
 * @param defaults - Initial value and type inference source.
 * @param options - Configuration options. `plugin` is required.
 * @returns `Disposable & { data$, isLoaded$, isPersistLoaded$, error$ }`
 */
export function createStorage<T>(
  key: string,
  defaults: T,
  options: StorageOptions
): StorageReturn<T>;

export function createStorage(
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults: any,
  options: StorageOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): StorageReturn<any> {
  const { plugin, transform, retrySync, readonly: readonlyOpt, options: pluginOptions } = options;

  const data$ = observable(
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
  const state$ = syncState(data$ as any);

  return {
    data$,
    isLoaded$: state$.isLoaded,
    isPersistLoaded$: state$.isPersistLoaded as unknown as ReadonlyObservable<boolean>,
    error$: state$.error as unknown as ReadonlyObservable<Error | undefined>,
  };
}
