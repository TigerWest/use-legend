"use client";
import { ObservableHint, type Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import {
  get,
  useMaybeObservable,
  useSupported,
  useWhenever,
  type MaybeObservable,
  useWhenMounted,
} from "@usels/core";
import { useEventListener } from "@browser/useEventListener";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

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
    const minWidth = queryString.match(/\(\s*min-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/);
    const maxWidth = queryString.match(/\(\s*max-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/);
    let res = Boolean(minWidth || maxWidth);
    if (minWidth && res) res = ssrWidth >= pxValue(minWidth[1]);
    if (maxWidth && res) res = ssrWidth <= pxValue(maxWidth[1]);
    return not ? !res : res;
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseMediaQueryOptions extends ConfigurableWindow {
  ssrWidth?: number;
}

export type UseMediaQueryReturn = Observable<boolean>;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/*@__NO_SIDE_EFFECTS__*/
export function useMediaQuery(
  query: MaybeObservable<string>,
  options: UseMediaQueryOptions = {}
): UseMediaQueryReturn {
  const { ssrWidth } = options;

  const opts$ = useMaybeObservable<UseMediaQueryOptions>(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);

  const isSupported$ = useSupported(() => {
    const win = window$.get();
    return !!win && "matchMedia" in win && typeof win.matchMedia === "function";
  });

  const matches$ = useObservable(() =>
    typeof ssrWidth === "number" ? evaluateSSRQuery(get(query), ssrWidth) : false
  );

  const mql$ = useWhenMounted(() => {
    const win = window$.get() as Window | null;
    return isSupported$.get() && win ? ObservableHint.opaque(win.matchMedia(get(query))) : null;
  });
  useWhenever(
    mql$,
    (mql) => {
      matches$.set(mql.matches.valueOf());
    },
    { immediate: true }
  );

  useEventListener(
    mql$,
    "change",
    (e: Event) => {
      matches$.set((e as MediaQueryListEvent).matches);
    },
    { passive: true }
  );

  return matches$;
}
