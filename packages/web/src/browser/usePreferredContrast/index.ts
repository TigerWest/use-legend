"use client";
import { useScope } from "@usels/core";
import { createPreferredContrast } from "./core";

export { createPreferredContrast } from "./core";
export type { ContrastPreference, UsePreferredContrastReturn } from "./core";

export type UsePreferredContrast = typeof createPreferredContrast;
export const usePreferredContrast: UsePreferredContrast = () => {
  return useScope(() => createPreferredContrast());
};
