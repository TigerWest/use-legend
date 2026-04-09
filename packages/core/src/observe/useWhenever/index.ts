"use client";
import { useScope, onUnmount } from "@primitives/useScope";
import { type WatchSource } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { whenever } from "./core";

export { whenever, type WheneverOptions, type Truthy } from "./core";

export type UseWhenever = typeof whenever;

/**
 * Shorthand for watching a source and running an effect only when the value is truthy.
 * Built on `watch` — lazy by default (`immediate: false`).
 *
 * @param selector - Observable or reactive function returning `T`.
 * @param effect   - Callback invoked with the truthy value.
 * @param options  - `immediate`, `schedule`, `once`.
 *
 * @example
 * ```tsx twoslash
 * // @noErrors
 * import { useWhenever } from "@usels/core";
 * import { observable } from "@legendapp/state";
 *
 * const isReady$ = observable(false);
 *
 * useWhenever(isReady$, (value) => {
 *   console.log("ready:", value); // only called when truthy
 * });
 * ```
 */
export const useWhenever: UseWhenever = (selector, effect, options = {}) => {
  return useScope(
    (p) => {
      const disposable = whenever(
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
