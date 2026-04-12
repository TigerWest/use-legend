"use client";
import { useScope } from "@usels/core";
import { createPreferredColorScheme } from "./core";

export { createPreferredColorScheme } from "./core";
export type { ColorScheme, UsePreferredColorSchemeReturn } from "./core";

export type UsePreferredColorScheme = typeof createPreferredColorScheme;
export const usePreferredColorScheme: UsePreferredColorScheme = () => {
  return useScope(() => createPreferredColorScheme());
};
