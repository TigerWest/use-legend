import {
  observe,
  type ImmutableObservableBase,
  type Observable,
  type Selector,
  type ObserveEventCallback,
} from "@legendapp/state";

import type { Disposable } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObservable = { get(): any };
type ObservableArray = readonly AnyObservable[];

/** Extracts the value type T from any Legend-State observable (ObservablePrimitive<T>, ObservableObject<T>, etc.) */
type ObservableValue<O> = O extends ImmutableObservableBase<infer V> ? V : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WatchSource = ObservableArray | Selector<any>;

/**
 * Infers the correct effect callback type from a WatchSource.
 * - `ObservableArray` → `(values: [A, B, ...]) => void`
 * - `Selector<T>` / `Observable<T>` → `(value: T) => void`
 */
export type Effector<W extends WatchSource> = W extends readonly AnyObservable[]
  ? (values: [...{ [K in keyof W]: ObservableValue<W[K]> }]) => void
  : W extends Selector<infer T>
    ? (value: T) => void
    : never;

/** Normalizes any WatchSource to a plain selector function `() => T`. */
export function toSelector<T>(source: WatchSource): () => T {
  if (Array.isArray(source)) return () => source.map((obs) => obs.get()) as unknown as T;
  if (typeof source === "function") return source as () => T;
  return () => (source as Observable<T>).get();
}

export interface WatchOptions {
  /** Fire effect on mount when `true`. Default `false` (lazy). */
  immediate?: boolean;
  /** Batch timing. `'pre'` runs synchronously; `'post'` runs after batch. */
  flush?: "pre" | "post";
}

export function watch<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: WatchOptions = {}
): Disposable {
  const { immediate = false, flush } = options;
  const observeImmediate = flush === "pre" ? true : flush === "post" ? false : undefined;

  const selectorFn: () => unknown = Array.isArray(selector)
    ? () => (selector as ObservableArray).map((obs) => obs.get())
    : typeof selector === "function"
      ? (selector as () => unknown)
      : () => (selector as Observable<unknown>).get();

  let skipFirst = !immediate;

  const unsub = observe(
    selectorFn,
    (e: ObserveEventCallback<unknown>) => {
      if (skipFirst) {
        skipFirst = false;
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (effect as (value: any) => void)(e.value);
    },
    observeImmediate !== undefined ? { immediate: observeImmediate } : undefined
  );

  return { dispose: () => unsub() };
}
