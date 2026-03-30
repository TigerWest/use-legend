import { observable } from "@legendapp/state";
import type { Pausable } from "../../types";
import type { EventFilter } from "@shared/filters";
import { bypassFilter } from "@shared/filters";

export interface PausableFilterOptions {
  /**
   * Initial active state of the filter.
   * @default 'active'
   */
  initialState?: "active" | "paused";
}

/**
 * Creates a pausable EventFilter backed by an `Observable<boolean>` active flag.
 * When paused, invocations are silently dropped. When resumed, new invocations fire normally.
 *
 * Returns a `Pausable` (isActive$, pause, resume) plus the `eventFilter` itself,
 * so callers can both control and pass the filter.
 *
 * @param extendFilter - Optional inner EventFilter to compose with (default: bypassFilter).
 * @param options - `{ initialState: 'active' | 'paused' }` — defaults to `'active'`.
 *
 * @example
 * ```ts
 * const { isActive$, pause, resume, eventFilter } = createPausableFilter()
 * const controlled = createFilterWrapper(eventFilter, myFn)
 *
 * controlled() // fires
 * pause()
 * controlled() // dropped
 * resume()
 * controlled() // fires again
 *
 * // Start paused:
 * const { resume, eventFilter } = createPausableFilter(bypassFilter, { initialState: 'paused' })
 * ```
 */
export function createPausableFilter(
  extendFilter: EventFilter = bypassFilter,
  options: PausableFilterOptions = {}
): Pausable & { eventFilter: EventFilter } {
  const { initialState = "active" } = options;
  const isActive$ = observable(initialState === "active");

  const eventFilter: EventFilter = (invoke, opts) => {
    if (isActive$.peek()) {
      return extendFilter(invoke, opts);
    }
  };

  return {
    isActive$,
    pause() {
      isActive$.set(false);
    },
    resume() {
      isActive$.set(true);
    },
    eventFilter,
  };
}
