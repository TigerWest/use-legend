import { type Observable } from "@legendapp/state";
import { useRef } from "react";

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
  const ref = useRef<{ v: T | NonNullable<T> } | null>(null);
  if (ref.current === null) {
    const peeked = obs.peek();
    ref.current = { v: (peeked ?? fallback) as T | NonNullable<T> };
  }
  // eslint-disable-next-line react-hooks/refs
  return ref.current.v;
}
