"use client";
import { useScope, toObs } from "@usels/core";
import { createElementBounding } from "./core";

export { createElementBounding } from "./core";
export type { UseElementBoundingOptions, UseElementBoundingReturn } from "./core";

/**
 * Tracks the bounding rect of a DOM element (x, y, top, right, bottom, left,
 * width, height). Observes ResizeObserver, MutationObserver (style/class
 * changes), window scroll, and resize.
 */
export type UseElementBounding = typeof createElementBounding;
export const useElementBounding: UseElementBounding = (target, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createElementBounding(target, opts$);
    },
    options as Record<string, unknown>
  );
};
