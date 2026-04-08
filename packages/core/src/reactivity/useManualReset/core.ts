import { type Observable } from "@legendapp/state";
import { observable } from "@shared/observable";
import type { Fn, WidenPrimitive } from "../../types";

/**
 * Core observable function for manual reset.
 * Creates an observable value with a `reset()` function that restores it to the default.
 *
 * @param source$ - Observable holding the default/reset target value.
 * @returns Writable Observable and reset function.
 */
export function createManualReset<T>(source$: Observable<T>): {
  value$: Observable<WidenPrimitive<T>>;
  reset: Fn;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- WidenPrimitive requires any for initial value
  const value$ = observable<any>(source$.peek());

  const reset = () => {
    value$.set(source$.peek());
  };

  return {
    value$: value$ as unknown as Observable<WidenPrimitive<T>>,
    reset,
  };
}
