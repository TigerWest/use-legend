import { type Observable } from "@legendapp/state";
import { createObserve } from "@primitives/useScope";
import { observable } from "@shared/observable";
import { createFilterWrapper, debounceFilter, type DebounceFilterOptions } from "@shared/filters";
import type { DeepMaybeObservable, ReadonlyObservable } from "../../types";

export interface DebouncedOptions extends DebounceFilterOptions {
  /** Debounce delay in milliseconds. @default 200 */
  ms?: number;
}

export function createDebounced<T>(
  source$: Observable<T>,
  options?: DeepMaybeObservable<DebouncedOptions>
): ReadonlyObservable<T> {
  const opts$ = observable(options);

  // Reactive delay — re-evaluates when opts$.ms changes
  const delay$ = observable(() => opts$.get()?.ms ?? 200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- initial value from source peek
  const value$ = observable<any>(source$.peek());

  // Construction-time only — maxWait is structurally immutable
  const filter = debounceFilter(delay$, { maxWait: opts$.peek()?.maxWait });
  const debouncedUpdate = createFilterWrapper(filter, (newValue: T) => {
    value$.set(newValue);
  });

  createObserve(() => {
    const current = source$.get();
    debouncedUpdate(current);
  });

  return value$ as unknown as ReadonlyObservable<T>;
}
