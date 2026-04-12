"use client";
import { useScope } from "@usels/core";
import { createMouse } from "./core";

export { createMouse } from "./core";
export type {
  UseMouseCoordType,
  UseMouseSourceType,
  UseMouseOptions,
  UseMouseReturn,
} from "./core";

export type UseMouse = typeof createMouse;
export const useMouse: UseMouse = (options = {}) => {
  // All options are mount-time-only. Target reactivity (Ref$/Observable)
  // is handled by createEventListener internally via normalizeTargets.
  // No toObs needed — pass options directly so Ref$ references stay intact.
  return useScope(() => createMouse(options));
};
