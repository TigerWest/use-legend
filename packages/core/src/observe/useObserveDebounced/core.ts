import { debounceFilter, type DebounceFilterOptions } from "@shared/filters";
import { observeWithFilter } from "@observe/useObserveWithFilter";
import { type Effector, type WatchOptions, type WatchSource } from "@observe/useWatch";
import type { Disposable, MaybeObservable } from "../../types";

export interface ObserveDebouncedOptions extends WatchOptions, DebounceFilterOptions {
  ms?: MaybeObservable<number>;
}

export function observeDebounced<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: ObserveDebouncedOptions = {}
): Disposable {
  const { ms = 200, immediate, schedule, ...filterOptions } = options;
  const eventFilter = debounceFilter(ms, filterOptions);
  return observeWithFilter(selector, effect, { eventFilter, immediate, schedule });
}
