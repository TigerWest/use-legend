"use client";
import { toObs, useScope, type DeepMaybeObservable } from "@usels/core";
import { createPointer } from "./core";
import type { UsePointerOptions } from "./core";

export { createPointer } from "./core";
export type { UsePointerType, UsePointerOptions, UsePointerReturn } from "./core";

export type UsePointer = typeof createPointer;
export const usePointer: UsePointer = (options = {}) => {
  // Target reactivity (Ref$/Observable) is handled by createEventListener
  // internally via normalizeTargets. Window reactivity is handled by
  // resolveWindowSource(opts$.window) inside the core. No toObs needed —
  // pass options directly so Ref$ references stay intact.
  return useScope((opt) => {
    const opt$ = toObs(opt, { target: "opaque", window: "opaque" });
    return createPointer(opt$ as DeepMaybeObservable<UsePointerOptions>);
  }, options);
};
