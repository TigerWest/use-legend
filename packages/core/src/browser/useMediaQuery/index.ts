"use client";
import { ObservableHint, type Observable } from "@legendapp/state";
import { useObservable, useObserve } from "@legendapp/state/react";
import { get } from "../../function/get";
import { useSupported } from "../../function/useSupported";
import type { MaybeObservable } from "../../types";
import { useWhenMounted } from "../../function/useWhenMounted";
import { useEventListener } from "../useEventListener";
import { defaultWindow } from "../../shared/configurable";

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function pxValue(value: string): number {
  const num = parseFloat(value);
  const unit = value
    .trim()
    .replace(/^-?\d+(?:\.\d+)?/, "")
    .trim();
  if (unit === "px" || unit === "") return num;
  if (unit === "em" || unit === "rem") return num * 16;
  return num;
}

export function evaluateSSRQuery(query: string, ssrWidth: number): boolean {
  const queryStrings = query.split(",");
  return queryStrings.some((queryString) => {
    const not = queryString.includes("not all");
    const minWidth = queryString.match(
      /\(\s*min-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/,
    );
    const maxWidth = queryString.match(
      /\(\s*max-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/,
    );
    let res = Boolean(minWidth || maxWidth);
    if (minWidth && res) res = ssrWidth >= pxValue(minWidth[1]);
    if (maxWidth && res) res = ssrWidth <= pxValue(maxWidth[1]);
    return not ? !res : res;
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseMediaQueryOptions {
  ssrWidth?: number;
}

export type UseMediaQueryReturn = Observable<boolean>;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/*@__NO_SIDE_EFFECTS__*/
export function useMediaQuery(
  query: MaybeObservable<string>,
  options: UseMediaQueryOptions = {},
): UseMediaQueryReturn {
  const { ssrWidth } = options;

  const isSupported = useSupported(
    () =>
      !!defaultWindow &&
      "matchMedia" in defaultWindow &&
      typeof defaultWindow.matchMedia === "function",
  );

  const matches$ = useObservable(() =>
    typeof ssrWidth === "number"
      ? evaluateSSRQuery(get(query), ssrWidth)
      : false,
  );

  const mql$ = useWhenMounted(() =>
    isSupported.get()
      ? ObservableHint.opaque(defaultWindow!.matchMedia(get(query)))
      : null,
  );
  useObserve(() => {
    const mql = mql$.get();
    if (!mql) {
      return;
    }
    matches$.set(mql.matches.valueOf());
  });

  useEventListener(
    mql$,
    "change",
    (e: Event) => {
      matches$.set((e as MediaQueryListEvent).matches);
    },
    { passive: true },
  );

  return matches$;
}
