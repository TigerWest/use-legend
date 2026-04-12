"use client";
import { useScope, toObs } from "@usels/core";
import { createDeviceMotion } from "./core";

export { createDeviceMotion } from "./core";
export type { UseDeviceMotionOptions, UseDeviceMotionReturn } from "./core";

/**
 * Reactive wrapper around the
 * [DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent).
 *
 * Provides reactive access to device acceleration, rotation rate, and interval,
 * plus iOS permission flow integration.
 */
export type UseDeviceMotion = typeof createDeviceMotion;
export const useDeviceMotion: UseDeviceMotion = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createDeviceMotion(opts$);
    },
    options as Record<string, unknown>
  );
};
