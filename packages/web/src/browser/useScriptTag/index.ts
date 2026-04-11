"use client";
import { useScope, toObs } from "@usels/core";
import { createScriptTag } from "./core";

export { createScriptTag } from "./core";
export type { UseScriptTagOptions, UseScriptTagReturn } from "./core";

/**
 * Reactive `<script>` tag loader. Thin wrapper around `createScriptTag` scoped
 * to the component lifecycle via `useScope`.
 */
export type UseScriptTag = typeof createScriptTag;
export const useScriptTag: UseScriptTag = (src, onLoaded = () => {}, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { document: "opaque" });
      return createScriptTag(src, onLoaded, opts$);
    },
    options as Record<string, unknown>
  );
};
