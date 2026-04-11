"use client";
import type { Observable } from "@legendapp/state";
import { useScope, toObs } from "@usels/core";
import { createMediaQuery } from "./core";

export { createMediaQuery, evaluateSSRQuery } from "./core";
export type { UseMediaQueryOptions, UseMediaQueryReturn } from "./core";

/**
 * Reactive CSS media query hook.
 *
 * Wraps {@link createMediaQuery} in a `useScope` factory so that the
 * underlying `MediaQueryList` and its `change` listener live for the exact
 * lifetime of the component and re-bind automatically when the query
 * Observable changes.
 */
export type UseMediaQuery = typeof createMediaQuery;
export const useMediaQuery: UseMediaQuery = (query, options) => {
  return useScope(
    (p, opts) => {
      const p$ = toObs(p);
      const opts$ = toObs(opts, { window: "opaque" });
      return createMediaQuery(p$.query as Observable<string>, opts$);
    },
    { query },
    (options ?? {}) as Record<string, unknown>
  );
};
