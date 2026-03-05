import { type Observable } from "@legendapp/state";
import { useConstant } from "@shared/useConstant";

/**
 * Reads an Observable value **once at mount** and returns a stable reference.
 * Re-renders always return the same value captured at the first render.
 *
 * Use for mount-time-only options that control scheduler type, hook selection,
 * or initial Observable seeds — values that are fixed at mount and must not
 * change reactively (e.g. `interval`, `controls`, `initialValue`).
 *
 * Prefer `obs.get()` inside `useObserve` / `useObservable` for reactive fields.
 *
 * @param obs - Observable to peek at mount time
 * @param fallback - Default value if `obs.peek()` returns `null` or `undefined`
 * @returns The mount-time value, stable across all subsequent re-renders
 *
 * @example
 * ```ts
 * const opts$ = useMaybeObservable(options, { callback: "function" });
 *
 * // ✅ mount-time-only: captured once, stable on re-render
 * const interval = usePeekInitial(opts$.interval, "requestAnimationFrame" as const);
 * const exposeControls = usePeekInitial(opts$.controls, false);
 *
 * // Safe to use for conditional hook calls — value never changes
 * const controls = interval === "requestAnimationFrame"
 *   ? useRafFn(update)
 *   : useIntervalFn(update, interval);
 * ```
 */
export function usePeekInitial<T>(obs: Observable<T>, fallback: NonNullable<T>): NonNullable<T>;
export function usePeekInitial<T>(obs: Observable<T>): T;
export function usePeekInitial<T>(
  obs: Observable<T>,
  fallback?: NonNullable<T>
): T | NonNullable<T> {
  // { v: T } wrapper: allows T itself to be null/undefined without conflicting
  // with the `null` sentinel used to detect "not yet initialized".
  const result = useConstant(() => {
    const peeked = obs.peek();
    return { v: (peeked ?? fallback) as T | NonNullable<T> };
  });
  return result.v;
}
