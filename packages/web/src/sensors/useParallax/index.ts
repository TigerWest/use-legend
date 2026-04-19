"use client";
import { useScope, toObs } from "@usels/core";
import { createParallax } from "./core";

export { createParallax } from "./core";
export type { UseParallaxOptions, UseParallaxReturn, UseParallaxSource } from "./core";

/**
 * Creates parallax effects. Uses `useDeviceOrientation` on mobile devices and
 * falls back to mouse position on desktop. `roll$` and `tilt$` are scaled
 * reactive observables in the range -0.5 ~ 0.5, and `source$` reports the
 * active sensor source.
 */
export type UseParallax = typeof createParallax;
export const useParallax: UseParallax = (target, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts);
      return createParallax(target, opts$);
    },
    options as Record<string, unknown>
  );
};
