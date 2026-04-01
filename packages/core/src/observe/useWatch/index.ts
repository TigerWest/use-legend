"use client";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { useUnmount } from "@shared/useUnmount";
import { type Observable } from "@legendapp/state";
import { watch, type WatchOptions, type WatchSource, type Effector } from "./core";

export { watch, toSelector, type WatchOptions, type WatchSource, type Effector } from "./core";

export type UseWatchOptions = WatchOptions;

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
 * @param options  - `immediate` (fire on mount?), `flush` (batch timing).
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
export function useWatch<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: UseWatchOptions = {}
): void {
  const selectorRef = useLatest(selector);
  const effectRef = useLatest(effect);

  const { dispose } = useConstant(() =>
    watch(
      () => {
        const sel = selectorRef.current as WatchSource;
        if (Array.isArray(sel)) return sel.map((obs) => obs.get());
        if (typeof sel === "function") return (sel as () => unknown)();
        return (sel as Observable<unknown>).get();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value) => (effectRef.current as (v: any) => void)(value),
      options
    )
  );

  useUnmount(dispose);
}
