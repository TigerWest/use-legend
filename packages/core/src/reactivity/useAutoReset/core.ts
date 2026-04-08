import { type Observable } from "@legendapp/state";
import { observe, onUnmount } from "@primitives/useScope";
import { observable } from "@shared/observable";
import type { DeepMaybeObservable, TimerHandle, WidenPrimitive } from "../../types";

export interface AutoResetOptions {
  /** Delay in milliseconds before auto-reset. @default 1000 */
  afterMs?: number;
}

export function createAutoReset<T>(
  source$: Observable<T>,
  options?: DeepMaybeObservable<AutoResetOptions>
): Observable<WidenPrimitive<T>> {
  const opts$ = observable(options);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- WidenPrimitive requires any for initial value
  const value$ = observable<any>(source$.peek());
  let timer: TimerHandle;

  observe(() => {
    const current = value$.get();
    const def = source$.get();

    clearTimeout(timer);

    if (!Object.is(current, def)) {
      const ms = opts$.get()?.afterMs ?? 1000;
      timer = setTimeout(() => {
        value$.set(source$.peek());
      }, ms);
    }
  });

  onUnmount(() => {
    clearTimeout(timer);
  });

  return value$ as unknown as Observable<WidenPrimitive<T>>;
}
