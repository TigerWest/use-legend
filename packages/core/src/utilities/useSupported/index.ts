"use client";
import { useScope } from "@primitives/useScope";
import { createSupported } from "./core";

export { createSupported } from "./core";
export type { UseSupportedReturn } from "./core";
export type UseSupported = typeof createSupported;

export const useSupported: UseSupported = (callback) => {
  return useScope((p) => createSupported(() => (p.callback as typeof callback)()), { callback });
};
