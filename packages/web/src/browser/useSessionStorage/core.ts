import type { Observable } from "@legendapp/state";
import { ObservablePersistSessionStorage } from "@legendapp/state/persist-plugins/local-storage";
import { createStorage } from "@usels/core";

/**
 * Framework-agnostic reactive `sessionStorage` binding. Thin wrapper around
 * `createStorage` with `ObservablePersistSessionStorage` as the persist plugin.
 *
 * @param key - Storage key.
 * @param defaults - Initial value and type inference source.
 * @returns A writable `Observable<T>` backed by sessionStorage.
 */
export function createSessionStorage<T>(key: string, defaults: T): Observable<T>;

export function createSessionStorage(
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Observable<any> {
  return createStorage(key, defaults, { plugin: ObservablePersistSessionStorage }).data$;
}
