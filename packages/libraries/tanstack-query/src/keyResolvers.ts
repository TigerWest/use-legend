import { isObservable, type Observable } from "@usels/core";
import type { MutationKey, QueryKey } from "@tanstack/query-core";

/**
 * Recursively resolves Observable values within a value.
 * - Observable -> .get() (registers dep in observer context)
 * - Array -> recursively map
 * - Plain object (not class instance) -> recursively map entries
 * - Date, Map, class instances, etc. -> as-is
 */
export function deepResolveValue(value: unknown): unknown {
  if (isObservable(value)) return (value as Observable<unknown>).get();
  if (Array.isArray(value)) return value.map(deepResolveValue);
  if (
    value !== null &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value as object).map(([k, v]) => [k, deepResolveValue(v)])
    );
  }
  return value;
}

export function resolveQueryKey(queryKey: unknown): QueryKey {
  const arr = isObservable(queryKey) ? (queryKey as Observable<unknown>).get() : queryKey;
  if (!Array.isArray(arr)) return [];
  return arr.map(deepResolveValue) as QueryKey;
}

export function resolveMutationKey(mutationKey: unknown): MutationKey | undefined {
  if (mutationKey === undefined) return undefined;
  const key = isObservable(mutationKey) ? (mutationKey as Observable<unknown>).get() : mutationKey;
  if (!Array.isArray(key)) return [];
  return key.map(deepResolveValue) as MutationKey;
}
