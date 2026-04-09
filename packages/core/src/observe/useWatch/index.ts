"use client";
import { useScope, onUnmount } from "@primitives/useScope";
import { watch, toSelector, type WatchSource } from "./core";

export { watch, type WatchOptions, type WatchSource, type Effector } from "./core";

export type UseWatch = typeof watch;

/**
 * Runs a reactive effect that skips the initial run on mount by default.
 * Pass `immediate: true` to also fire on mount (eager mode).
 *
 * Selector supports three forms:
 * - Single `Observable<T>`
 * - Array `[Observable<A>, Observable<B>]` — effect receives `[A, B]`
 * - Reactive function `() => T`
 *
 * @param selector - Observable, array of Observables, or reactive read function.
 * @param effect   - Side-effect callback.
 * @param options  - `immediate` (fire on mount), `schedule` (batch timing).
 *
 * @example
 * ```tsx twoslash
 * // @noErrors
 * import { useWatch } from "@usels/core";
 * import { observable } from "@legendapp/state";
 *
 * const query$ = observable("");
 * const page$ = observable(1);
 *
 * // Lazy (default) — skips mount
 * useWatch(query$, (value) => { console.log("changed:", value); });
 *
 * // Eager — also fires on mount
 * useWatch(query$, (value) => { console.log("value:", value); }, { immediate: true });
 *
 * // Array of observables
 * useWatch([query$, page$] as const, ([query, page]) => {
 *   console.log("fetch:", query, page);
 * });
 * ```
 */
export const useWatch: UseWatch = (selector, effect, options = {}) => {
  return useScope(
    (p) => {
      const disposable = watch(
        () => toSelector(p.selector as WatchSource)(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (value) => (p.effect as (v: any) => void)(value),
        options
      );
      onUnmount(disposable.dispose);
      return disposable;
    },
    { selector, effect }
  );
};
