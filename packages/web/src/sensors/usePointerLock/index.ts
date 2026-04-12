"use client";
import { useScope } from "@usels/core";
import { createPointerLock } from "./core";

export { createPointerLock } from "./core";
export type { UsePointerLockReturn } from "./core";

export type UsePointerLock = typeof createPointerLock;
export const usePointerLock: UsePointerLock = () => {
  return useScope(() => createPointerLock());
};
