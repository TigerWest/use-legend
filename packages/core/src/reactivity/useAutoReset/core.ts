import { observable, observe, type Observable } from "@legendapp/state";
import type { Disposable, TimerHandle, WidenPrimitive } from "../../types";

/**
 * Core observable function for auto-reset.
 * Creates an observable that automatically resets to a default value
 * after a specified delay when changed.
 *
 * @param defaultValue$ - Observable holding the default/reset target value.
 * @param afterMs$ - Observable holding the delay in milliseconds before auto-reset.
 * @returns Disposable with writable Observable that auto-resets.
 */
export function autoReset<T>(
  defaultValue$: Observable<T>,
  afterMs$: Observable<number>
): Disposable & { value$: Observable<WidenPrimitive<T>> } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see useDebounced for rationale
  const value$ = observable<any>(defaultValue$.peek());
  let timer: TimerHandle;

  const unsub = observe(() => {
    const current = value$.get();
    const def = defaultValue$.peek();

    clearTimeout(timer);

    if (!Object.is(current, def)) {
      const ms = afterMs$.get();
      timer = setTimeout(() => {
        value$.set(defaultValue$.peek());
      }, ms);
    }
  });

  return {
    value$: value$ as unknown as Observable<WidenPrimitive<T>>,
    dispose: () => {
      clearTimeout(timer);
      unsub();
    },
  };
}
