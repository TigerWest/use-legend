"use client";
import { useScope } from "@usels/core";
import { createPreferredReducedTransparency } from "./core";

export { createPreferredReducedTransparency } from "./core";
export type { ReducedTransparencyPreference, UsePreferredReducedTransparencyReturn } from "./core";

export type UsePreferredReducedTransparency = typeof createPreferredReducedTransparency;
export const usePreferredReducedTransparency: UsePreferredReducedTransparency = () => {
  return useScope(() => createPreferredReducedTransparency());
};
