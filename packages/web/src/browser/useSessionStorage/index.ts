"use client";

import { useScope } from "@usels/core";
import { createSessionStorage } from "./core";

export { createSessionStorage } from "./core";

/**
 * Reactive `sessionStorage` binding. Thin wrapper around `createSessionStorage`
 * scoped to the component lifecycle via `useScope`.
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
export type UseSessionStorage = typeof createSessionStorage;
export const useSessionStorage: UseSessionStorage = (key, defaults) => {
  return useScope(() => createSessionStorage(key, defaults));
};
