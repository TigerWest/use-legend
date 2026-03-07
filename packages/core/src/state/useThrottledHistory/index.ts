"use client";

import { type Observable } from "@legendapp/state";
import { useObservable, useUnmount } from "@legendapp/state/react";
import type { DeepMaybeObservable, MaybeObservable } from "../../types";
import { useMaybeObservable } from "../../reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { usePeekInitial } from "../../reactivity/usePeekInitial";
import { get } from "@utilities/get";
import { throttledHistory } from "./core";
import type { UseHistoryOptions, UseHistoryReturn } from "../useHistory";

export { throttledHistory, type ThrottledHistoryOptions } from "./core";

export type UseThrottledHistoryOptions<Raw, Serialized = Raw> = Omit<
  UseHistoryOptions<Raw, Serialized>,
  "eventFilter"
> & {
  /**
   * Throttle interval in milliseconds.
   * @default 200
   */
  throttle?: MaybeObservable<number>;
  /**
   * Fire on the trailing edge of the throttle window.
   * @default true
   */
  trailing?: boolean;
  /**
   * Fire on the leading edge of the throttle window.
   * @default true
   */
  leading?: boolean;
};

export type UseThrottledHistoryReturn<Raw, Serialized = Raw> = UseHistoryReturn<Raw, Serialized>;

/**
 * Track undo/redo history with throttled auto-commit.
 * Thin wrapper around `useHistory` with a `throttleFilter` injected.
 *
 * Ideal for sliders, drag operations, and other rapid-fire value changes
 * where recording every intermediate value would bloat the history.
 *
 * @param source$ - The Observable to track.
 * @param options - Throttle timing and history configuration.
 *
 * @example
 * ```ts
 * const slider$ = observable(50);
 * const { undo, redo } = useThrottledHistory(slider$, { throttle: 300 });
 * ```
 */
export function useThrottledHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: DeepMaybeObservable<UseThrottledHistoryOptions<Raw, Serialized>>
): UseThrottledHistoryReturn<Raw, Serialized> {
  const opts$ = useMaybeObservable(options, {
    dump: "function",
    parse: "function",
    shouldCommit: "function",
  });

  const throttleMs$ = useObservable<number>(() => {
    const value = (opts$.throttle as Observable<MaybeObservable<number> | undefined>).get();
    return get(value) ?? 200;
  }, []);
  const trailing = usePeekInitial(opts$.trailing as Observable<boolean | undefined>, true);
  const leading = usePeekInitial(opts$.leading as Observable<boolean | undefined>, true);

  const result = useConstant(() => {
    const edges: Array<"leading" | "trailing"> = [];
    if (leading) edges.push("leading");
    if (trailing) edges.push("trailing");

    return throttledHistory<Raw, Serialized>(source$, throttleMs$, {
      ...(opts$.peek() ?? {}),
      edges,
    });
  });

  useUnmount(result.dispose);

  return result;
}
