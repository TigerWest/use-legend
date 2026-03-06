"use client";

import { type Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import type { DeepMaybeObservable, MaybeObservable } from "../../types";
import { throttleFilter } from "@shared/filters";
import { useMaybeObservable } from "../../reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { usePeekInitial } from "../../reactivity/usePeekInitial";
import { get } from "@utilities/get";
import { useHistory, type UseHistoryOptions, type UseHistoryReturn } from "../useHistory";

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

  const edges: Array<"leading" | "trailing"> = useConstant(() => {
    const result: Array<"leading" | "trailing"> = [];
    if (leading) result.push("leading");
    if (trailing) result.push("trailing");
    return result;
  });

  const filter = useConstant(() => throttleFilter(throttleMs$, { edges }));

  return useHistory(source$, {
    ...(opts$.peek() ?? {}),
    eventFilter: filter,
  } as DeepMaybeObservable<UseHistoryOptions<Raw, Serialized>>);
}
