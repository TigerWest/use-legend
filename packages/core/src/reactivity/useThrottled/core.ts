import { observable, observe, type Observable } from "@legendapp/state";
import type { Disposable } from "../../types";
import { createFilterWrapper, throttleFilter, type ThrottleFilterOptions } from "@shared/filters";

/**
 * Core observable function for throttling.
 * Creates an observable that updates at most once per interval
 * when the source value changes.
 *
 * @param source$ - Observable source value to throttle.
 * @param interval$ - Observable throttle interval in milliseconds.
 * @param options - `edges` for leading/trailing control.
 * @returns Disposable with an Observable reflecting the throttled value.
 */
export function throttled<T>(
  source$: Observable<T>,
  interval$: Observable<number>,
  options: ThrottleFilterOptions = {}
): Disposable & { value$: Observable<T> } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see useDebounced for rationale
  const value$ = observable<any>(source$.peek());

  const filter = throttleFilter(interval$, options);
  const throttledUpdate = createFilterWrapper(filter, (newValue: T) => {
    value$.set(newValue);
  });

  const unsub = observe(() => {
    const current = source$.get();
    throttledUpdate(current);
  });

  return {
    value$: value$ as unknown as Observable<T>,
    dispose: () => unsub(),
  };
}
