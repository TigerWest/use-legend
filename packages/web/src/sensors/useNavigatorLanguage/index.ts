"use client";
import { useScope } from "@usels/core";
import { createNavigatorLanguage } from "./core";

export { createNavigatorLanguage } from "./core";
export type { UseNavigatorLanguageOptions, UseNavigatorLanguageReturn } from "./core";

export type UseNavigatorLanguage = typeof createNavigatorLanguage;
export const useNavigatorLanguage: UseNavigatorLanguage = (options = {}) => {
  return useScope(() => createNavigatorLanguage(options));
};
