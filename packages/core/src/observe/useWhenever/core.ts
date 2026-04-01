import { type Selector } from "@legendapp/state";
import { watch, type WatchOptions } from "@observe/useWatch";
import type { Disposable } from "../../types";

export type Truthy<T> = T extends false | 0 | "" | null | undefined ? never : T;

export interface WheneverOptions extends WatchOptions {
  /**
   * Dispose after the first truthy invocation.
   * @default false
   */
  once?: boolean;
}

export function whenever<T>(
  selector: Selector<T>,
  effect: (value: Truthy<T>) => void,
  options: WheneverOptions = {}
): Disposable {
  const { once, ...watchOptions } = options;
  let stopped = false;
  // Holds dispose after watch() returns; initialized to no-op to handle
  // the synchronous immediate:true edge case safely.
  let innerDispose: () => void = () => {};

  const { dispose } = watch(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value: any) => {
      if (stopped || !value) return;
      effect(value as Truthy<T>);
      if (once) {
        stopped = true;
        innerDispose();
      }
    },
    watchOptions
  );

  innerDispose = dispose;

  // If immediate:true + once triggered synchronously before innerDispose
  // was assigned, dispose the subscription now.
  if (stopped) dispose();

  return { dispose };
}
