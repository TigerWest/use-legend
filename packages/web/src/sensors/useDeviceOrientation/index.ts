"use client";
import { useScope, toObs } from "@usels/core";
import { createDeviceOrientation } from "./core";

export { createDeviceOrientation } from "./core";
export type { UseDeviceOrientationOptions, UseDeviceOrientationReturn } from "./core";

/**
 * Reactive wrapper around the
 * [DeviceOrientationEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent).
 *
 * Tracks the physical orientation of the device and exposes alpha/beta/gamma
 * angles (and `isAbsolute$`) as observables, plus iOS permission flow integration.
 */
export type UseDeviceOrientation = typeof createDeviceOrientation;
export const useDeviceOrientation: UseDeviceOrientation = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createDeviceOrientation(opts$);
    },
    options as Record<string, unknown>
  );
};
