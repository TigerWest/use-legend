"use client";
import { useScope, toObs } from "@usels/core";
import { createMagicKeys } from "./core";

export { createMagicKeys } from "./core";
export type { UseMagicKeysOptions, UseMagicKeysReturn } from "./core";

export type UseMagicKeys = typeof createMagicKeys;
export const useMagicKeys: UseMagicKeys = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, {
        onEventFired: "function",
        window: "opaque",
      });
      return createMagicKeys(opts$);
    },
    options as Record<string, unknown>
  );
};
