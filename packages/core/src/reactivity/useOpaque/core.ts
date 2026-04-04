import { observable, ObservableHint } from "@legendapp/state";
import type { Observable, OpaqueObject } from "@legendapp/state";

/**
 * Observable with transparent opaque handling.
 * `.set(value)` auto-wraps with opaque, `.get()` auto-unwraps — no manual ObservableHint.opaque() needed.
 * isObservable() = true (delegates symbolGetNode to the internal observable).
 */
export type OpaqueObservable<T> = Omit<
  Observable<OpaqueObject<T | null>>,
  "set" | "get" | "peek"
> & {
  get(): T | null;
  peek(): T | null;
  set(value: T | null): void;
};

export function createOpaque<T>(initialValue?: T | null): OpaqueObservable<T> {
  const obs$ = observable<OpaqueObject<T | null>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ObservableHint.opaque((initialValue ?? null) as any)
  );

  const unwrap = (val: OpaqueObject<T | null> | undefined): T | null =>
    val != null ? (val.valueOf() as T | null) : null;

  const methods = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: () => unwrap((obs$ as any).get()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    peek: () => unwrap((obs$ as any).peek()),
    set: (value: T | null) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obs$ as any).set(ObservableHint.opaque(value as any));
    },

    onChange: (handler: (value: T | null) => void) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obs$ as any).onChange((change: any) => handler(unwrap(change.value))),
  };

  // Proxy: use our transparent methods for get/set/peek/onChange,
  // delegate everything else (symbolGetNode, etc.) to the internal observable
  // so that isObservable() = true and legend-state reactive utilities work.
  return new Proxy(methods, {
    get(target, prop, receiver) {
      if (Object.prototype.hasOwnProperty.call(target, prop)) {
        return Reflect.get(target, prop, receiver);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (obs$ as any)[prop];
      return typeof val === "function" ? val.bind(obs$) : val;
    },
  }) as unknown as OpaqueObservable<T>;
}
