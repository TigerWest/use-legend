"use client";
import { type Observable } from "@legendapp/state";
import { useConstant } from "@shared/useConstant";

/**
 * Picks multiple mount-time-only fields from an Observable options object in one call.
 * Each field is read once via `.peek()` and falls back to the provided default.
 * The returned object is stable across all re-renders (backed by `useConstant`).
 *
 * Replaces repetitive `usePeekInitial` calls:
 *
 * @example
 * ```ts
 * // ❌ Before — verbose, one call per field
 * const type = usePeekInitial(opts$.type, "page" as const);
 * const touch = usePeekInitial(opts$.touch, true);
 * const resetOnTouchEnds = usePeekInitial(opts$.resetOnTouchEnds, false);
 *
 * // ✅ After — single destructure
 * const { type, touch, resetOnTouchEnds } = useInitialPick(opts$, {
 *   type: "page" as const,
 *   touch: true,
 *   resetOnTouchEnds: false,
 * });
 * ```
 *
 * @param obs$ - Observable options object (typically from `useMaybeObservable`)
 * @param defaults - Object mapping field names to their fallback values.
 *                   Each value must be `NonNullable<T[K]>` — guarantees the result is never null/undefined.
 * @returns A stable object with mount-time values for each specified key
 */
type Clean<T> = NonNullable<T>;
type Defaults<T> = { [K in keyof Clean<T>]?: NonNullable<Clean<T>[K]> };

export function useInitialPick<T, D extends Defaults<T>>(
  obs$: Observable<T>,
  defaults: { [K in keyof D]: NonNullable<D[K]> }
): { [K in keyof D]: NonNullable<D[K]> } {
  type Out = { [K in keyof D]: NonNullable<D[K]> };
  return useConstant(() => {
    const result = {} as Out;
    for (const key in defaults) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Observable child access requires dynamic key indexing
      const peeked = (obs$ as any)[key].peek();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- assigning peeked value with fallback
      (result as any)[key] = peeked ?? defaults[key];
    }
    return result;
  });
}
