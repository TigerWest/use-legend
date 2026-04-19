"use client";
import { useScope, toObs, type DeepMaybeObservable } from "@usels/core";
import { createDropZone, type UseDropZoneOptions, type UseDropZoneReturn } from "./core";
import type { MaybeEventTarget } from "../../types";

export { createDropZone } from "./core";
export type { UseDropZoneOptions, UseDropZoneReturn } from "./core";

/**
 * Hook-level type alias for `useDropZone`. Mirrors the `createDropZone` core
 * signature (target + options); the hook additionally accepts an `onDrop`
 * callback shorthand at runtime.
 */
export type UseDropZone = typeof createDropZone;

/**
 * Turns any element into a file drop zone. Tracks drag-over state and validates
 * file types before accepting drops.
 *
 * Accepts either an options object (supports `DeepMaybeObservable`) or a plain
 * `onDrop` callback shorthand.
 */
export function useDropZone(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseDropZoneOptions> | UseDropZoneOptions["onDrop"]
): UseDropZoneReturn {
  // Shorthand: a bare function is treated as onDrop.
  const normalized: DeepMaybeObservable<UseDropZoneOptions> =
    typeof options === "function"
      ? ({ onDrop: options } as UseDropZoneOptions)
      : (options ?? ({} as UseDropZoneOptions));

  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { dataTypes: "plain" });
      return createDropZone(target, opts$);
    },
    normalized as Record<string, unknown>
  );
}
