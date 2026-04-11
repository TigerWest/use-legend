"use client";
import { useScope, toObs } from "@usels/core";
import { createStyleTag } from "./core";

export { createStyleTag } from "./core";
export type { UseStyleTagOptions, UseStyleTagReturn } from "./core";

/**
 * Reactive `<style>` tag injector. Thin wrapper around `createStyleTag` scoped
 * to the component lifecycle via `useScope`.
 */
export type UseStyleTag = typeof createStyleTag;
export const useStyleTag: UseStyleTag = (css, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { document: "opaque" });
      return createStyleTag(css, opts$);
    },
    options as Record<string, unknown>
  );
};
