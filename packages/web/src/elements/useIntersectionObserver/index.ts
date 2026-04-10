"use client";
import { useScope, toObs } from "@usels/core";
import { createIntersectionObserver } from "./core";

export { createIntersectionObserver } from "./core";
export type { UseIntersectionObserverOptions, UseIntersectionObserverReturn } from "./core";

export type UseIntersectionObserver = typeof createIntersectionObserver;
export const useIntersectionObserver: UseIntersectionObserver = (
  target,
  callback,
  options = {}
) => {
  return useScope((opts) => {
    const opts$ = toObs(opts, { root: "opaque" });
    return createIntersectionObserver(target, callback, opts$);
  }, options);
};
