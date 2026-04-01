import { observeWithFilter } from "@observe/useObserveWithFilter";
import { createPausableFilter, type PausableFilterOptions } from "@utilities/usePausableFilter";
import { type Effector, type WatchOptions, type WatchSource } from "@observe/useWatch";
import type { Disposable, Pausable } from "../../types";

export interface ObservePausableOptions extends WatchOptions, PausableFilterOptions {}

export function observePausable<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: ObservePausableOptions = {}
): Disposable & Pausable {
  const { immediate, schedule, initialState } = options;
  const { isActive$, pause, resume, eventFilter } = createPausableFilter(undefined, {
    initialState,
  });
  const { dispose } = observeWithFilter(selector, effect, { eventFilter, immediate, schedule });

  return { isActive$, pause, resume, dispose };
}
