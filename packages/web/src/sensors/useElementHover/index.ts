"use client";
import { useScope, toObs } from "@usels/core";
import { createElementHover } from "./core";

export { createElementHover } from "./core";
export type { UseElementHoverOptions, UseElementHoverReturn } from "./core";

/**
 * Reactive element hover tracker.
 *
 * Returns an `Observable<boolean>` that reflects whether the target element
 * is being hovered. Supports optional enter/leave delays.
 */
export type UseElementHover = typeof createElementHover;
export const useElementHover: UseElementHover = (target, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts);
      return createElementHover(target, opts$);
    },
    options as Record<string, unknown>
  );
};
