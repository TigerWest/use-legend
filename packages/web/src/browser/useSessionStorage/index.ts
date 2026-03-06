"use client";

import type { Observable } from "@legendapp/state";
import { ObservablePersistSessionStorage } from "@legendapp/state/persist-plugins/local-storage";
import { useStorage } from "@usels/core";

/**
 * Reactive `sessionStorage` binding. Thin wrapper around `useStorage`
 * with `ObservablePersistSessionStorage` as the persist plugin.
 *
 * @param key - Storage key.
 * @param defaults - Initial value and type inference source.
 * @returns A writable `Observable<T>` backed by sessionStorage.
 *
 * @example
 * ```ts
 * const step$ = useSessionStorage('wizard-step', 1);
 * step$.set(2); // persisted to sessionStorage for this tab
 * ```
 */
export function useSessionStorage<T>(key: string, defaults: T): Observable<T>;

export function useSessionStorage(
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Observable<any> {
  return useStorage(key, defaults, { plugin: ObservablePersistSessionStorage }).data$;
}
