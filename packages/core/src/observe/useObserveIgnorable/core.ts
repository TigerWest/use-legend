import { observable } from "@legendapp/state";
import { watch, type Effector, type WatchOptions, type WatchSource } from "@observe/useWatch";
import type { Disposable, ReadonlyObservable } from "../../types";

export interface ObserveIgnorableReturn extends Disposable {
  ignoreUpdates: (updater: () => void) => void;
  isIgnoring$: ReadonlyObservable<boolean>;
}

export function observeIgnorable<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: WatchOptions = {}
): ObserveIgnorableReturn {
  const isIgnoring$ = observable(false);

  const wrappedEffect = ((value: unknown) => {
    if (isIgnoring$.peek()) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (effect as (v: any) => void)(value);
  }) as Effector<T>;

  const { dispose } = watch(selector, wrappedEffect, options);

  const ignoreUpdates = (updater: () => void) => {
    isIgnoring$.set(true);
    updater();
    isIgnoring$.set(false);
  };

  return {
    ignoreUpdates,
    isIgnoring$: isIgnoring$ as ReadonlyObservable<boolean>,
    dispose,
  };
}
