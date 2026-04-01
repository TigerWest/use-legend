"use client";
import { type Selector } from "@legendapp/state";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { useUnmount } from "@shared/useUnmount";
import { toSelector } from "@observe/useWatch/core";
import { type WatchSource } from "@observe/useWatch";
import { whenever, type WheneverOptions, type Truthy } from "./core";

export { whenever, type WheneverOptions, type Truthy } from "./core";

export type UseWheneverOptions = WheneverOptions;

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
export function useWhenever<T>(
  selector: Selector<T>,
  effect: (value: Truthy<T>) => void,
  options: UseWheneverOptions = {}
): void {
  const selectorRef = useLatest(selector);
  const effectRef = useLatest(effect);

  const { dispose } = useConstant(() =>
    whenever(
      () => toSelector<T>(selectorRef.current as WatchSource)(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value) => (effectRef.current as (v: any) => void)(value),
      options
    )
  );

  useUnmount(dispose);
}
