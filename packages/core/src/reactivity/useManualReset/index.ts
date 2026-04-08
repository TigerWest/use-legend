"use client";

import { useScope } from "@primitives/useScope";
import { createManualReset } from "./core";

export { createManualReset } from "./core";

/**
 * Observable with a manual `reset()` function that restores the value to its default.
 *
 * @param source$ - Source Observable providing the default/reset target value.
 * @returns `{ value$, reset }` — writable Observable and a reset function.
 *
 * @example
 * ```tsx
 * const default$ = observable("hello");
 * const { value$, reset } = useManualReset(default$);
 * value$.set("changed");
 * reset(); // value$.get() === "hello"
 * ```
 */
export type UseManualReset = typeof createManualReset;
export const useManualReset: UseManualReset = (source$) => {
  return useScope(() => createManualReset(source$));
};
