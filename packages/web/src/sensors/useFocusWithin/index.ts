"use client";
import { useScope } from "@usels/core";
import { createFocusWithin } from "./core";

export { createFocusWithin } from "./core";
export type { UseFocusWithinReturn } from "./core";

export type UseFocusWithin = typeof createFocusWithin;
export const useFocusWithin: UseFocusWithin = (target) => {
  return useScope(() => createFocusWithin(target));
};
