"use client";
import { useScope, toObs } from "@usels/core";
import type { UseMousePressedOptions } from "./core";
import { createMousePressed } from "./core";

export { createMousePressed } from "./core";
export type {
  UseMousePressedSourceType,
  UseMousePressedOptions,
  UseMousePressedReturn,
} from "./core";

export type UseMousePressed = typeof createMousePressed;
export const useMousePressed: UseMousePressed = (options = {}) => {
  // Target reactivity (Ref$/Observable) is handled by createEventListener
  // internally via normalizeTargets — pass target directly to core so the
  // Ref$ reference stays intact. Callbacks need freshness via scope props.
  const raw = options as UseMousePressedOptions;
  return useScope(
    (cbs) => {
      const cbs$ = toObs(cbs, { onPressed: "function", onReleased: "function" });
      return createMousePressed({
        ...raw,
        onPressed: (...args) => cbs$.peek()?.onPressed?.(...args),
        onReleased: (...args) => cbs$.peek()?.onReleased?.(...args),
      });
    },
    { onPressed: raw?.onPressed, onReleased: raw?.onReleased }
  );
};
