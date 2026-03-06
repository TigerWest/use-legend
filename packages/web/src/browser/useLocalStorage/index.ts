"use client";

import type { Observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { useStorage } from "@usels/core";

/**
 * Reactive `localStorage` binding. Thin wrapper around `useStorage`
 * with `ObservablePersistLocalStorage` as the persist plugin.
 *
 * @param key - Storage key.
 * @param defaults - Initial value and type inference source.
 * @returns A writable `Observable<T>` backed by localStorage.
 *
 * @example
 * ```ts
 * const name$ = useLocalStorage('username', '');
 * name$.set('Alice'); // persisted to localStorage
 * ```
 */
export function useLocalStorage<T>(key: string, defaults: T): Observable<T>;

export function useLocalStorage(
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Observable<any> {
  return useStorage(key, defaults, { plugin: ObservablePersistLocalStorage }).data$;
}
