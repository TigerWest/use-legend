import type { Observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { createStorage } from "@usels/core";

/**
 * Framework-agnostic reactive `localStorage` binding. Thin wrapper around
 * `createStorage` with `ObservablePersistLocalStorage` as the persist plugin.
 *
 * @param key - Storage key.
 * @param defaults - Initial value and type inference source.
 * @returns A writable `Observable<T>` backed by localStorage.
 */
export function createLocalStorage<T>(key: string, defaults: T): Observable<T>;

export function createLocalStorage(
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Observable<any> {
  return createStorage(key, defaults, { plugin: ObservablePersistLocalStorage }).data$;
}
