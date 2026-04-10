"use client";
import { useScope } from "@usels/core";
import { createResizeObserver } from "./core";

export { createResizeObserver } from "./core";
export type { UseResizeObserverOptions, UseResizeObserverReturn } from "./core";
export { normalizeTargets } from "@shared/normalizeTargets";

export type UseResizeObserver = typeof createResizeObserver;
export const useResizeObserver: UseResizeObserver = (target, callback, options = {}) => {
  return useScope(
    (p) =>
      createResizeObserver(
        target,
        (...args: Parameters<ResizeObserverCallback>) =>
          (p.callback as ResizeObserverCallback)(...args),
        options
      ),
    { callback }
  );
};
