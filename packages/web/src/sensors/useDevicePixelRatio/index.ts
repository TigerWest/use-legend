"use client";
import { useScope, toObs } from "@usels/core";
import { createDevicePixelRatio } from "./core";

export { createDevicePixelRatio } from "./core";
export type { UseDevicePixelRatioOptions, UseDevicePixelRatioReturn } from "./core";

/**
 * Reactive wrapper around `window.devicePixelRatio`.
 *
 * Tracks the current device pixel ratio and updates automatically when
 * the display's pixel density changes (e.g. moving a window between
 * monitors with different DPI, or browser zoom level changes).
 */
export type UseDevicePixelRatio = typeof createDevicePixelRatio;
export const useDevicePixelRatio: UseDevicePixelRatio = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createDevicePixelRatio(opts$);
    },
    options as Record<string, unknown>
  );
};
