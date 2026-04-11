"use client";
import { useScope, toObs } from "@usels/core";
import { createGeolocation } from "./core";

export { createGeolocation } from "./core";
export type { UseGeolocationOptions, UseGeolocationCoords, UseGeolocationReturn } from "./core";

/**
 * Reactive wrapper around the
 * [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation).
 *
 * Tracks the user's geographic position via `watchPosition`, exposing
 * coordinates, last update timestamp, and error state as observables, with
 * `pause()` / `resume()` controls.
 */
export type UseGeolocation = typeof createGeolocation;
export const useGeolocation: UseGeolocation = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts);
      return createGeolocation(opts$);
    },
    options as Record<string, unknown>
  );
};
