"use client";
import { useScope, toObs } from "@usels/core";
import { createMouseInElement } from "./core";

export { createMouseInElement } from "./core";
export type { UseMouseInElementOptions, UseMouseInElementReturn } from "./core";

/**
 * Tracks whether the mouse cursor is inside a DOM element and calculates the
 * cursor position relative to that element. Observes `mousemove`, document
 * `mouseleave`, ResizeObserver, MutationObserver (style/class changes), and
 * window scroll/resize.
 */
export type UseMouseInElement = typeof createMouseInElement;
export const useMouseInElement: UseMouseInElement = (target, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createMouseInElement(target, opts$);
    },
    options as Record<string, unknown>
  );
};
