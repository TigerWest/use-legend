import { type Effector, type WatchOptions, type WatchSource } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observeIgnorable, type ObserveIgnorableReturn } from "@observe/useObserveIgnorable";
import type { Disposable } from "../../types";

export interface ObserveTriggerableReturn extends Disposable {
  ignoreUpdates: (updater: () => void) => void;
  trigger: () => void;
}

export function observeTriggerable<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: WatchOptions = {}
): ObserveTriggerableReturn {
  const { ignoreUpdates, dispose }: ObserveIgnorableReturn = observeIgnorable(
    selector,
    effect,
    options
  );

  const selectorFn = toSelector(selector);

  const trigger = () => {
    ignoreUpdates(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (effect as (v: any) => void)(selectorFn());
    });
  };

  return { ignoreUpdates, trigger, dispose };
}
