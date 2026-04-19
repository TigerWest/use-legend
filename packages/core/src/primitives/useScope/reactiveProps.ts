import { observable, isObservable, batch, type Observable } from "@legendapp/state";
import type { ImmutableObservableBase } from "@legendapp/state";
import { onMount } from "./effectScope";
import {
  applyHintToValue,
  type ScopeHint,
  type NestedHintSpec,
  type ApplyHints,
} from "@shared/hints";

// Re-export hint types for existing consumers
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
 * @internal Symbol to retrieve the lazy observable accessor from a ReactiveProps proxy.
 * Accessing `proxy[REACTIVE_PROPS_GET_OBS]` returns a `(hints?) => Observable<P>` function
 * that lazily initializes and returns the reactive observable for this scope.
 */
const REACTIVE_PROPS_GET_OBS = Symbol("reactivePropsGetObs");

/** @internal Shape of the lazy observable accessor — used by `toObs`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetObsFn<P extends object> = (hints?: NestedHintSpec<any>) => Observable<P>;

/** @internal Per-instance context for the props proxy */
export interface ScopePropsCtx<P extends object> {
  propsRef: { current: P };
  props$: Observable<P> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hints: NestedHintSpec<any> | null;
  rawPrev: Record<string, unknown> | null;
}

/**
 * Stable proxy around component props passed to `useScope`.
 * - `p.key` — raw latest value (ref-based, no legend-state tracking)
 * - `toObs(p)` — reactive Observable<P>
 * - `toObs(p, hints)` — reactive Observable<P> with per-field ObservableHint
 */
export type ReactiveProps<P extends object> = Readonly<P>;

/**
 * @internal Create a stable ReactiveProps proxy backed by ctx.propsRef.
 *
 * The proxy exposes a lazy `_getObs()` accessor (via the internal symbol) that
 * encapsulates the `ctx.props$` lifecycle — hint storage, initial value build,
 * and Observable-field subscription setup — so `toObs` doesn't need to touch
 * ctx internals directly.
 */
export function createReactiveProxy<P extends object>(ctx: ScopePropsCtx<P>): ReactiveProps<P> {
  const getObs: GetObsFn<P> = (hints) => {
    if (!ctx.props$) {
      if (isObservable(ctx.propsRef.current)) {
        // Outer Observable — use directly, like observable(observable) returning itself.
        // Hints are skipped: the caller controls the Observable structure.
        ctx.props$ = ctx.propsRef.current as unknown as Observable<P>;
      } else {
        if (hints) ctx.hints = hints;
        const initial = buildInitialValue(ctx);
        ctx.props$ = observable(initial) as unknown as Observable<P>;
        ctx.rawPrev = { ...ctx.propsRef.current } as Record<string, unknown>;
      }
    } else if (hints) {
      ctx.hints = hints;
    }
    return ctx.props$ as Observable<P>;
  };

  return new Proxy({} as ReactiveProps<P>, {
    get(_, key) {
      if (key === REACTIVE_PROPS_GET_OBS) return getObs;
      if (typeof key === "symbol") return undefined;
      return ctx.propsRef.current[key as keyof P];
    },
    has(_, key) {
      return typeof key === "string" && key in ctx.propsRef.current;
    },
    ownKeys() {
      return Object.keys(ctx.propsRef.current);
    },
    getOwnPropertyDescriptor(_, key) {
      if (typeof key === "string" && key in ctx.propsRef.current) {
        return { configurable: true, enumerable: true, writable: false };
      }
      return undefined;
    },
  });
}

/**
 * @internal Resolve one top-level prop field to a plain value:
 * - Observable → `peek()` (the Observable's changes are synced via `onChange` in
 *   `buildInitialValue`; storing the peeked value avoids a `setToObservable` link
 *   that would double-fire inside `observe()`).
 * - Plain value → hint applied.
 */
function readField<P extends object>(
  key: string,
  val: unknown,
  hints: NestedHintSpec<P> | null
): unknown {
  if (isObservable(val)) return (val as Observable<unknown>).peek();
  const fieldHint = (hints as Record<string, unknown> | null)?.[key];
  return applyHintToValue(fieldHint as ScopeHint | Record<string, unknown> | undefined, val);
}

/**
 * @internal Build the initial plain object that backs `ctx.props$`.
 *
 * Only called for plain-object scope params (not outer Observables).
 * Top-level Observable fields are subscribed via `onChange`; their current values
 * are stored directly in the returned object. Nested Observables are NOT supported —
 * put Observables at the top level of the props object.
 */
function buildInitialValue<P extends object>(ctx: ScopePropsCtx<P>): unknown {
  const props = ctx.propsRef.current;
  const hints = ctx.hints as NestedHintSpec<P> | null;

  // scalar hint: apply to entire props object — no per-field processing
  if (typeof hints === "string") return applyHintToValue(hints as ScopeHint, props);

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    const val = (props as Record<string, unknown>)[key];
    if (isObservable(val)) {
      const obs = val as Observable<unknown>;
      // Subscribe on every useEffect mount — not at factory time — so that
      // React Strict Mode's simulated unmount/remount gets a fresh subscription
      // instead of a spent unsub. The returned cleanup is the current-cycle unsub.
      onMount(() => {
        const unsub = obs.onChange(() => {
          batch(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ctx.props$ as any)?.[key].set(obs.peek());
          });
        });
        return unsub;
      });
    }
    result[key] = readField(key, val, hints);
  }
  return result;
}

/**
 * @internal
 * Update `props$` with the latest props values, only setting top-level fields whose
 * reference actually changed. Observable-valued fields are synced via `onChange` in
 * `buildInitialValue`, so their stable reference short-circuits here via `Object.is`.
 *
 * For changed keys, `props$[key].set(nextVal)` uses Legend-State's built-in recursive
 * diff: setting `props$.coord = { x: 30, y: 20 }` fires only `props$.coord.x` when
 * `y` is unchanged. Nested plain updates flow through cleanly.
 */
export function syncProps<P extends object>(ctx: ScopePropsCtx<P>, next: P): void {
  ctx.propsRef.current = next;
  if (!ctx.props$) return; // toObs not called — nothing to sync

  // Outer Observable IS ctx.props$ — nothing to sync, it's the source of truth.
  if (isObservable(next)) return;

  const hints = ctx.hints as NestedHintSpec<P> | null;

  if (typeof hints === "string") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx.props$ as any).set(applyHintToValue(hints, next));
    ctx.rawPrev = { ...next } as Record<string, unknown>;
    return;
  }

  const prev = ctx.rawPrev ?? {};
  const changed: Record<string, unknown> = {};
  for (const key of Object.keys(next)) {
    const val = next[key as keyof P];
    if (Object.is(prev[key], val)) continue;
    changed[key] = readField(key, val, hints);
  }
  for (const key of Object.keys(prev)) {
    if (!(key in next) && prev[key] !== undefined) {
      changed[key] = undefined;
    }
  }
  if (Object.keys(changed).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx.props$ as any).assign(changed);
  }
  ctx.rawPrev = { ...next } as Record<string, unknown>;
}

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
