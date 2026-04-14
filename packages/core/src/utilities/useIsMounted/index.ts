"use client";
import { useScope } from "@primitives/useScope";
import { createIsMounted } from "./core";

export { createIsMounted } from "./core";

export type UseIsMounted = typeof createIsMounted;

export const useIsMounted: UseIsMounted = () => {
  return useScope(() => createIsMounted());
};
