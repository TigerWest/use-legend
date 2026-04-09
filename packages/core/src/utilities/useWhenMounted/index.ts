"use client";
import { useScope } from "@primitives/useScope";
import { createWhenMounted } from "./core";

export type { UseWhenMountedReturn } from "./core";
export type UseWhenMounted = typeof createWhenMounted;

export const useWhenMounted: UseWhenMounted = (callback) => {
  return useScope((p) => createWhenMounted(() => (p.callback as typeof callback)()), { callback });
};
