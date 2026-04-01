import { throttleFilter, type ThrottleFilterOptions } from "@shared/filters";
import { observeWithFilter } from "@observe/useObserveWithFilter";
import { type Effector, type WatchOptions, type WatchSource } from "@observe/useWatch";
import type { Disposable, MaybeObservable } from "../../types";

export interface ObserveThrottledOptions extends WatchOptions, ThrottleFilterOptions {
  ms?: MaybeObservable<number>;
}

export function observeThrottled<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: ObserveThrottledOptions = {}
): Disposable {
  const { ms = 200, immediate, schedule, ...filterOptions } = options;
  const eventFilter = throttleFilter(ms, filterOptions);
  return observeWithFilter(selector, effect, { eventFilter, immediate, schedule });
}
