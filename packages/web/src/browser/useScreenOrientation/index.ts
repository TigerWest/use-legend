"use client";
import { useScope, toObs } from "@usels/core";
import { createScreenOrientation } from "./core";

export { createScreenOrientation } from "./core";
export type {
  OrientationType,
  OrientationLockType,
  UseScreenOrientationOptions,
  UseScreenOrientationReturn,
} from "./core";

/**
 * Reactive wrapper around the
 * [Screen Orientation API](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation).
 *
 * Tracks the current screen orientation type and angle, and provides methods
 * to lock and unlock orientation.
 */
export type UseScreenOrientation = typeof createScreenOrientation;
export const useScreenOrientation: UseScreenOrientation = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createScreenOrientation(opts$);
    },
    options as Record<string, unknown>
  );
};
