"use client";
import { useScope } from "@usels/core";
import { createKeyModifier } from "./core";

export { createKeyModifier } from "./core";
export type { KeyModifier, UseKeyModifierOptions, UseKeyModifierReturn } from "./core";

export type UseKeyModifier = typeof createKeyModifier;
export const useKeyModifier: UseKeyModifier = (modifier, options = {}) => {
  return useScope(() => createKeyModifier(modifier, options));
};
