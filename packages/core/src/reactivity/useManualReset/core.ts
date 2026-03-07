import { observable, type Observable } from "@legendapp/state";
import type { Disposable, Fn, WidenPrimitive } from "../../types";

/**
 * Core observable function for manual reset.
 * Creates an observable value with a `reset()` function that restores it to the default.
 *
 * @param defaultValue$ - Observable holding the default/reset target value.
 * @returns Disposable with writable Observable and reset function.
 */
export function manualReset<T>(
  defaultValue$: Observable<T>
): Disposable & { value$: Observable<WidenPrimitive<T>>; reset: Fn } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see useDebounced for rationale
  const value$ = observable<any>(defaultValue$.peek());

  const reset = () => {
    value$.set(defaultValue$.peek());
  };

  return {
    value$: value$ as unknown as Observable<WidenPrimitive<T>>,
    reset,
    dispose: () => {},
  };
}
