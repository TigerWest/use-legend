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

type AnySelector = AnyObservable | (() => unknown);
type SelectorArray = readonly AnySelector[];

/** Extracts the value type from an observable or a reactive function. */
type SelectorValue<S> =
  S extends ImmutableObservableBase<infer V> ? V : S extends () => infer R ? R : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WatchSource = SelectorArray | Selector<any>;

/**
 * Infers the correct effect callback type from a WatchSource.
 * - `SelectorArray` → `(values: [A, B, ...]) => void`
 * - `() => T` → `(value: T) => void`
 * - `Observable<T>` → `(value: T) => void`
 */
export type Effector<W extends WatchSource> = W extends SelectorArray
  ? (values: [...{ [K in keyof W]: SelectorValue<W[K]> }]) => void
  : W extends () => infer R
    ? (value: R) => void
    : W extends Selector<infer T>
      ? (value: T) => void
      : never;

/** @internal Normalizes any WatchSource to a plain selector function `() => T`. */
export function toSelector<T>(source: WatchSource): () => T {
  if (Array.isArray(source))
    return () =>
      source.map((s) =>
        typeof s === "function" ? s() : (s as AnyObservable).get()
      ) as unknown as T;
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

  const selectorFn = toSelector(selector);
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
