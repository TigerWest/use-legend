import { observable, type Observable } from "@legendapp/state";
import {
  createSupported,
  get,
  createObserve,
  type DeepMaybeObservable,
  type MaybeObservable,
} from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../useEventListener/core";
import { createOpaque } from "@usels/core/reactivity/useOpaque/core";

// ---------------------------------------------------------------------------
// SSR helper
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

/**
 * Statically evaluate a CSS media query against a known viewport width.
 *
 * Supports `min-width` / `max-width` / `not all` in comma-separated queries.
 * Used by the SSR path so server-rendered markup and the first client render
 * can agree on the initial value.
 */
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
  /**
   * Static viewport width used to evaluate `min-width` / `max-width` queries
   * when `window.matchMedia` is unavailable (SSR).
   */
  ssrWidth?: number;
}

export type UseMediaQueryReturn = Observable<boolean>;

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Framework-agnostic reactive CSS media query tracker.
 *
 * Creates a `MediaQueryList` for the given query (reactive — accepts
 * `MaybeObservable<string>`) and subscribes to its `change` events via
 * `createEventListener`. Re-creates the `MediaQueryList` when the query or
 * the resolved window changes. Must be called inside a `useScope` factory.
 *
 * @param query - CSS media query (plain string or `Observable<string>`).
 * @param options - Optional `{ window?, ssrWidth? }`.
 * @returns `Observable<boolean>` that reflects `mql.matches` (or the SSR
 *          fallback when `matchMedia` is unavailable).
 */
export function createMediaQuery(
  query: MaybeObservable<string>,
  options?: DeepMaybeObservable<UseMediaQueryOptions>
): UseMediaQueryReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const isSupported$ = createSupported(() => {
    const win = win$.get();
    return !!win && "matchMedia" in win && typeof win.matchMedia === "function";
  });

  // Mount-time-only field — `ssrWidth` never changes during the hook lifetime.
  const ssrWidth = opts$.peek()?.ssrWidth;

  const matches$ = observable<boolean>(
    typeof ssrWidth === "number" ? evaluateSSRQuery(get(query), ssrWidth) : false
  );

  // Reactive `MediaQueryList` holder. Uses `ObservableHint.opaque` so
  // Legend-State does not deep-proxy the DOM object.
  const mql$ = createOpaque<MediaQueryList>(null);

  // Create / recreate the MediaQueryList whenever the query, window, or
  // support flag changes. Previous MQL is simply dropped — `createEventListener`
  // below reacts to `mql$` changes and tears down the old listener.
  createObserve(() => {
    const q = get(query);
    const win = win$.get();
    if (!isSupported$.get() || !win) {
      mql$.set(null);
      return;
    }
    const mql = (win as Window).matchMedia(q);
    mql$.set(mql);
    matches$.set(mql.matches);
  });

  // Subscribe to `change` events. `createEventListener` reacts to `mql$`
  // mutations and re-binds the listener to the new `MediaQueryList` each
  // time the query / window changes, tearing the previous one down.
  createEventListener(
    mql$,
    "change",
    (e: Event) => {
      matches$.set((e as MediaQueryListEvent).matches);
    },
    { passive: true }
  );

  return matches$;
}
