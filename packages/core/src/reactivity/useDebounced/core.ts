import { observable, observe, type Observable } from "@legendapp/state";
import type { Disposable } from "../../types";
import { createFilterWrapper, debounceFilter, type DebounceFilterOptions } from "@shared/filters";

/**
 * Core observable function for debouncing.
 * Creates an observable that updates only after the source value
 * stops changing for the specified delay.
 *
 * @param source$ - Observable source value to debounce.
 * @param delay$ - Observable debounce delay in milliseconds.
 * @param options - `edges` for leading/trailing control; `maxWait` to cap maximum delay.
 * @returns Disposable with an Observable reflecting the debounced value.
 */
export function createDebounced<T>(
  source$: Observable<T>,
  delay$: Observable<number>,
  options: DebounceFilterOptions = {}
): Disposable & { value$: Observable<T> } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see useDebounced for rationale
  const value$ = observable<any>(source$.peek());

  const filter = debounceFilter(delay$, options);
  const debouncedUpdate = createFilterWrapper(filter, (newValue: T) => {
    value$.set(newValue);
  });

  const unsub = observe(() => {
    const current = source$.get();
    debouncedUpdate(current);
  });

  return {
    value$: value$ as unknown as Observable<T>,
    dispose: () => unsub(),
  };
}
