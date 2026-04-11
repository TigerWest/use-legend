"use client";
import { useScope, toObs } from "@usels/core";
import { createDisplayMedia } from "./core";

export { createDisplayMedia } from "./core";
export type { UseDisplayMediaOptions, UseDisplayMediaReturn } from "./core";

/**
 * Reactive wrapper around the
 * [MediaDevices.getDisplayMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
 * API for screen sharing. Provides start/stop controls and automatically
 * handles the browser's "Stop sharing" button.
 */
export type UseDisplayMedia = typeof createDisplayMedia;
export const useDisplayMedia: UseDisplayMedia = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts);
      return createDisplayMedia(opts$);
    },
    options as Record<string, unknown>
  );
};
