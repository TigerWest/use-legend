"use client";
import { useScope } from "@usels/core";
import { createPreferredReducedMotion } from "./core";

export { createPreferredReducedMotion } from "./core";
export type { ReducedMotionPreference, UsePreferredReducedMotionReturn } from "./core";

export type UsePreferredReducedMotion = typeof createPreferredReducedMotion;
export const usePreferredReducedMotion: UsePreferredReducedMotion = () => {
  return useScope(() => createPreferredReducedMotion());
};
