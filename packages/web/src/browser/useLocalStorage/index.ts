"use client";

import { useScope } from "@usels/core";
import { createLocalStorage } from "./core";

export { createLocalStorage } from "./core";

/**
 * Reactive `localStorage` binding. Thin wrapper around `createLocalStorage`
 * scoped to the component lifecycle via `useScope`.
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
export type UseLocalStorage = typeof createLocalStorage;
export const useLocalStorage: UseLocalStorage = (key, defaults) => {
  return useScope(() => createLocalStorage(key, defaults));
};
