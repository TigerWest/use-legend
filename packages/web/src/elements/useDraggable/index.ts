"use client";
import { useScope, toObs } from "@usels/core";
import { createDraggable } from "./core";

export { createDraggable } from "./core";
export type { Position, UseDraggableOptions, UseDraggableReturn } from "./core";

/**
 * Makes any element draggable using Pointer Events.
 * Returns Observable values for position (`x$`, `y$`), drag state (`isDragging$`),
 * and a ready-to-use CSS style string (`style$`).
 */
export type UseDraggable = typeof createDraggable;
export const useDraggable: UseDraggable = (target, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, {
        handle: "opaque",
        containerElement: "opaque",
        window: "opaque",
        onStart: "function",
        onMove: "function",
        onEnd: "function",
      });
      return createDraggable(target, opts$);
    },
    options as Record<string, unknown>
  );
};
