import { type Observable } from "@legendapp/state";
import { observe } from "@primitives/useScope";
import { observable } from "@shared/observable";
import type { DeepMaybeObservable, ReadonlyObservable } from "../../types";

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
 * @returns Observable reflecting the last-changed timestamp.
 */
export function createLastChanged<T>(
  source$: Observable<T>,
  options?: DeepMaybeObservable<LastChangedOptions>
): ReadonlyObservable<number | null> {
  const opts$ = observable(options);
  const timestamp$ = observable<number | null>(opts$.peek()?.initialValue ?? null);

  let hasObservedInitial = false;

  observe(() => {
    source$.get(); // register reactive dependency

    if (!hasObservedInitial) {
      hasObservedInitial = true;
      return;
    }

    timestamp$.set(Date.now());
  });

  return timestamp$;
}
