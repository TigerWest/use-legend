import { observable, observe, type Observable } from "@legendapp/state";
import type { Disposable } from "../../types";

export interface LastChangedOptions {
  /**
   * Initial timestamp value.
   * @default null
   */
  initialValue?: number | null;
}

/**
 * Core observable function for tracking when a source value last changed.
 * Records `Date.now()` each time the source observable changes.
 *
 * @param source$ - Observable source value to watch.
 * @param options - Configuration options.
 * @returns Disposable with an Observable reflecting the last-changed timestamp.
 */
export function createLastChanged<T>(
  source$: Observable<T>,
  options?: LastChangedOptions
): Disposable & { timestamp$: Observable<number | null> } {
  const timestamp$ = observable<number | null>(options?.initialValue ?? null);

  let hasObservedInitial = false;

  const unsub = observe(() => {
    source$.get(); // register reactive dependency

    if (!hasObservedInitial) {
      hasObservedInitial = true;
      return;
    }

    timestamp$.set(Date.now());
  });

  return {
    timestamp$,
    dispose: () => unsub(),
  };
}
