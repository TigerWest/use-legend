"use client";

import { type Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import type { DeepMaybeObservable, MaybeObservable } from "../../types";
import { debounceFilter } from "@shared/filters";
import { useMaybeObservable } from "../../reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { get } from "@utilities/get";
import { useHistory, type UseHistoryOptions, type UseHistoryReturn } from "../useHistory";

export type UseDebouncedHistoryOptions<Raw, Serialized = Raw> = Omit<
  UseHistoryOptions<Raw, Serialized>,
  "eventFilter"
> & {
  /**
   * Debounce delay in milliseconds.
   * @default 200
   */
  debounce?: MaybeObservable<number>;
  /**
   * Maximum time to wait before forcing a commit, regardless of activity.
   */
  maxWait?: MaybeObservable<number>;
};

export type UseDebouncedHistoryReturn<Raw, Serialized = Raw> = UseHistoryReturn<Raw, Serialized>;

/**
 * Track undo/redo history with debounced auto-commit.
 * Thin wrapper around `useHistory` with a `debounceFilter` injected.
 *
 * Records a snapshot only after the source stops changing for `debounce` ms.
 * Ideal for text inputs, search boxes, and other "commit when idle" patterns.
 *
 * @param source$ - The Observable to track.
 * @param options - Debounce timing and history configuration.
 *
 * @example
 * ```ts
 * const search$ = observable('');
 * const { undo, redo } = useDebouncedHistory(search$, { debounce: 500 });
 * ```
 */
export function useDebouncedHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: DeepMaybeObservable<UseDebouncedHistoryOptions<Raw, Serialized>>
): UseDebouncedHistoryReturn<Raw, Serialized> {
  const opts$ = useMaybeObservable(options, {
    dump: "function",
    parse: "function",
    shouldCommit: "function",
  });

  const debounceMs$ = useObservable<number>(() => {
    const value = (opts$.debounce as Observable<MaybeObservable<number> | undefined>).get();
    return get(value) ?? 200;
  });
  const maxWait$ = useObservable<number | undefined>(() => {
    const value = (opts$.maxWait as Observable<MaybeObservable<number> | undefined>).get();
    return get(value);
  });

  const filter = useConstant(() => debounceFilter(debounceMs$, { maxWait: maxWait$ }));

  return useHistory(source$, {
    ...(opts$.peek() ?? {}),
    eventFilter: filter,
  } as DeepMaybeObservable<UseHistoryOptions<Raw, Serialized>>);
}
