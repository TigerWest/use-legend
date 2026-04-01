import { watch, type Effector, type WatchOptions, type WatchSource } from "@observe/useWatch";
import { createFilterWrapper, type EventFilter } from "@shared/filters";
import type { Disposable } from "../../types";

export interface ObserveWithFilterOptions extends WatchOptions {
  eventFilter: EventFilter;
}

export function observeWithFilter<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: ObserveWithFilterOptions
): Disposable {
  const { eventFilter, ...watchOptions } = options;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredEffect = createFilterWrapper(eventFilter, effect as (value: any) => void);
  return watch(selector, filteredEffect as Effector<T>, watchOptions);
}
