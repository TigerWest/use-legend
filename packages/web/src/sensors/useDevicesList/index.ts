"use client";
import { useScope, toObs } from "@usels/core";
import { createDevicesList } from "./core";

export { createDevicesList } from "./core";
export type { UseDevicesListOptions, UseDevicesListReturn } from "./core";

/**
 * Reactive wrapper around
 * [MediaDevices.enumerateDevices()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices).
 *
 * Lists available media input/output devices, tracks changes via `devicechange`,
 * and optionally requests permissions on mount.
 */
export type UseDevicesList = typeof createDevicesList;
export const useDevicesList: UseDevicesList = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts);
      return createDevicesList(opts$);
    },
    options as Record<string, unknown>
  );
};
