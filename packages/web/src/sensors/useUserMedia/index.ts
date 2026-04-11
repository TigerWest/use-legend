"use client";
import { useScope, toObs } from "@usels/core";
import { createUserMedia } from "./core";

export { createUserMedia } from "./core";
export type { UseUserMediaOptions, UseUserMediaReturn } from "./core";

/**
 * Reactive wrapper around the
 * [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
 * API. Provides start/stop/restart controls and exposes the active media
 * stream as an observable.
 */
export type UseUserMedia = typeof createUserMedia;
export const useUserMedia: UseUserMedia = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts);
      return createUserMedia(opts$);
    },
    options as Record<string, unknown>
  );
};
