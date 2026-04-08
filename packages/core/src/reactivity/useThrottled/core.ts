import { type Observable } from "@legendapp/state";
import { observe } from "@primitives/useScope";
import { observable } from "@shared/observable";
import { createFilterWrapper, throttleFilter, type ThrottleFilterOptions } from "@shared/filters";
import type { DeepMaybeObservable, ReadonlyObservable } from "../../types";

export interface ThrottledOptions extends ThrottleFilterOptions {
  /** Throttle interval in milliseconds. @default 200 */
  ms?: number;
}

export function createThrottled<T>(
  source$: Observable<T>,
  options?: DeepMaybeObservable<ThrottledOptions>
): ReadonlyObservable<T> {
  const opts$ = observable(options);

  // Reactive interval — re-evaluates when opts$.ms changes
  const interval$ = observable(() => opts$.get()?.ms ?? 200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- initial value from source peek
  const value$ = observable<any>(source$.peek());

  // Construction-time only — edges is structurally immutable
  const filter = throttleFilter(interval$, { edges: opts$.peek()?.edges });
  const throttledUpdate = createFilterWrapper(filter, (newValue: T) => {
    value$.set(newValue);
  });

  observe(() => {
    const current = source$.get();
    throttledUpdate(current);
  });

  return value$ as unknown as ReadonlyObservable<T>;
}
