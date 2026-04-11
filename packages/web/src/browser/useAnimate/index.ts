"use client";
import { useScope, toObs, type DeepMaybeObservable } from "@usels/core";
import { createAnimate, type UseAnimateOptions } from "./core";

export { createAnimate } from "./core";
export type { UseAnimateOptions, UseAnimateKeyframes, UseAnimateReturn } from "./core";

/**
 * Reactive wrapper around the
 * [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API).
 *
 * Drives `element.animate()` with Observable-based reactive state for
 * `playState`, `currentTime`, `playbackRate`, and `pending`. The underlying
 * `createAnimate` core function is framework-agnostic and can be called
 * directly inside a `useScope` block.
 */
export type UseAnimate = typeof createAnimate;
export const useAnimate: UseAnimate = (target, keyframes, options) => {
  // Normalize the number shorthand (duration) into an options object so the
  // hook path always goes through `toObs` / ReactiveProps tracking.
  // Standalone `createAnimate` callers can still pass a number directly.
  const normalized: DeepMaybeObservable<UseAnimateOptions> =
    typeof options === "number"
      ? ({ duration: options } as UseAnimateOptions)
      : (options ?? ({} as UseAnimateOptions));

  return useScope((opts) => {
    const opts$ = toObs(opts, {
      onReady: "function",
      onError: "function",
      window: "opaque",
    });
    return createAnimate(
      target,
      keyframes,
      opts$ as unknown as DeepMaybeObservable<UseAnimateOptions>
    );
  }, normalized as UseAnimateOptions);
};
