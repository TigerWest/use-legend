"use client";
import { useScope, toObs } from "@usels/core";
import { createElementByPoint } from "./core";

export { createElementByPoint } from "./core";
export type { UseElementByPointOptions, UseElementByPointReturn } from "./core";

/**
 * Reactive element-at-point tracker.
 *
 * Continuously polls `document.elementFromPoint()` on each animation frame and
 * updates `element$` whenever the element under the specified coordinates
 * changes. Supports single or multiple element detection modes.
 */
export type UseElementByPoint = typeof createElementByPoint;
export const useElementByPoint: UseElementByPoint = (options) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return createElementByPoint(opts$ as any);
    },
    options as Record<string, unknown>
  );
};
