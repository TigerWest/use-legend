import type { Observable, ImmutableObservableBase } from "@legendapp/state";
import type { NestedHintSpec, ApplyHints } from "@shared/hints";
import { REACTIVE_PROPS_GET_OBS, type GetObsFn, type ReactiveProps } from "./reactiveProps";

// Re-export hint types for existing consumers of this module boundary.
export type { ScopeHint, NestedHintSpec, ApplyHints } from "@shared/hints";

/** @internal Strip Observable/ReadonlyObservable wrapper from a type (distributive over unions) */
type UnwrapObs<T> = T extends ImmutableObservableBase<infer U> ? U : T;

/**
 * Map each prop field to its unwrapped value type, stripping MaybeObservable wrappers.
 * Ensures `toObs(p).field` resolves to `Observable<T>` instead of `Observable<Observable<T> | T>`.
 * @public
 */
export type PropsOf<P extends object> = {
  [K in keyof P]: UnwrapObs<P[K]>;
};

/**
 * Convert a `ReactiveProps<P>` proxy to an `Observable<P>` for reactive tracking.
 *
 * The observable is created lazily on first call. Subsequent calls return the same instance.
 * Hints are stored and applied on every subsequent `syncProps` call (each render).
 *
 * When the scope param is an outer Observable, `toObs` returns it directly — like
 * `observable(observable)` returning itself. Hints are skipped in this case.
 *
 * @param p - The ReactiveProps proxy from `useScope`
 * @param hints - Optional hint spec: scalar `'opaque'`|`'plain'` or per-field/nested map
 *
 * @example
 * ```ts
 * useScope((p) => {
 *   // plain data — no hints needed
 *   const obs$ = toObs(p)
 *   observe(() => console.log(obs$.count.get()))
 *
 *   // non-plain fields — specify hints
 *   const obs2$ = toObs(p, { data: 'opaque' })
 *
 *   return {}
 * }, props)
 * ```
 *
 * ### Callback props — use raw prop access, not a hint
 *
 * Dispatch callbacks through the raw proxy (`p.onX?.(...)`) or via
 * `p$.peek().onX?.(...)`. Both paths resolve to the latest closure on each
 * render. See `packages/core/src/shared/hints.spec.ts` for the pinned
 * behavior contract of Legend-State's `ObservableHint.function` primitive.
 *
 * ```ts
 * useScope((p) => {
 *   const p$ = toObs(p); // no hint for onSubmit
 *   observe(() => {
 *     // when the event fires:
 *     p.onSubmit?.(data); // raw-prop path — always latest closure
 *   });
 * }, { onSubmit });
 * ```
 */
export function toObs<P extends object, H extends NestedHintSpec<P> = never>(
  p: ReactiveProps<P>,
  hints?: H
): Observable<[H] extends [never] ? PropsOf<P> : ApplyHints<PropsOf<P>, H>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getObs = (p as any)[REACTIVE_PROPS_GET_OBS] as GetObsFn<P> | undefined;
  if (!getObs) {
    throw new Error("[useScope] toObs() must be called with a ReactiveProps proxy from useScope");
  }
  return getObs(hints) as unknown as Observable<
    [H] extends [never] ? PropsOf<P> : ApplyHints<PropsOf<P>, H>
  >;
}
