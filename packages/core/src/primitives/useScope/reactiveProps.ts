import { observable, ObservableHint, isObservable, batch, type Observable } from "@legendapp/state";
import type { ImmutableObservableBase } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { onUnmount } from "./effectScope";

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

/** @internal Leaf hint for a single field in toObs */
export type ScopeHint = "opaque" | "plain" | "function";

/** @internal depth-3 hint map */
type HintMap3<P> = { [K in keyof P]?: ScopeHint };

/** @internal depth-2 hint map */
type HintMap2<P> = {
  [K in keyof P]?: ScopeHint | (P[K] extends Record<string, unknown> ? HintMap3<P[K]> : never);
};

/** @internal depth-1 hint map (top-level fields) */
type HintMap1<P> = {
  [K in keyof P]?: ScopeHint | (P[K] extends Record<string, unknown> ? HintMap2<P[K]> : never);
};

/**
 * Hint spec for `toObs`: scalar hint or up to 3-level nested hint map.
 * Supported hints: `'opaque'` | `'plain'` | `'function'`
 * @public
 */
export type NestedHintSpec<P> = ScopeHint | HintMap1<P>;

/** @internal Apply a leaf hint to a type — only opaque changes the TS type */
type ApplyLeafHint<T, H extends ScopeHint> = H extends "opaque" ? OpaqueObject<T & object> : T;

/** @internal Recursively apply a hint map to a props type */
type ApplyHintMap<P, M> = {
  [K in keyof P]: K extends keyof M
    ? M[K] extends ScopeHint
      ? ApplyLeafHint<P[K], M[K] & ScopeHint>
      : M[K] extends Record<string, unknown>
        ? P[K] extends Record<string, unknown>
          ? ApplyHintMap<P[K], M[K]>
          : P[K]
        : P[K]
    : P[K];
};

/**
 * Transform a props type according to a `NestedHintSpec`.
 * - scalar `'opaque'` → entire props wrapped in `OpaqueObject`
 * - map `{ field: 'opaque' }` → only that field wrapped
 * - nested `{ field: { sub: 'opaque' } }` → only that sub-field wrapped
 * @public
 */
export type ApplyHints<P, H> = H extends ScopeHint
  ? ApplyLeafHint<P, H & ScopeHint>
  : H extends Record<string, unknown>
    ? ApplyHintMap<P, H>
    : P;

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
      if (hints) ctx.hints = hints;
      const initial = buildInitialValue(ctx);
      ctx.props$ = observable(initial) as unknown as Observable<P>;
      ctx.rawPrev = { ...ctx.propsRef.current } as Record<string, unknown>;
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

/** @internal Detect React elements (objects with $$typeof symbol) */
function isReactElement(val: unknown): boolean {
  return val !== null && typeof val === "object" && "$$typeof" in (val as object);
}

/** @internal Recursively apply a ScopeHint or nested hint map to a value */
function applyHintToValue(
  hint: ScopeHint | Record<string, unknown> | undefined,
  val: unknown
): unknown {
  if (val == null) return val;

  if (typeof hint === "string") {
    switch (hint) {
      case "opaque":
        return ObservableHint.opaque(val as object);
      case "plain":
        return ObservableHint.plain(val as object);
      case "function":
        return ObservableHint.function(val);
      default:
        return val;
    }
  }

  if (hint && typeof hint === "object") {
    // nested hint map — only transform hinted keys, copy rest as-is
    if (typeof val !== "object" || Array.isArray(val)) return val;
    const src = val as Record<string, unknown>;
    const out: Record<string, unknown> = { ...src };
    for (const key of Object.keys(hint)) {
      out[key] = applyHintToValue(
        hint[key] as ScopeHint | Record<string, unknown> | undefined,
        src[key]
      );
    }
    return out;
  }

  // no hint — auto-detect
  if (typeof val === "function") return ObservableHint.function(val);
  if (isReactElement(val)) return ObservableHint.opaque(val as object);
  if (Array.isArray(val) && val.some(isReactElement)) return ObservableHint.opaque(val as object);
  return val;
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
      // Subscribe immediately; the returned unsubscribe fn is registered via
      // `onUnmount` so the current scope cleans it up on dispose.
      onUnmount(
        obs.onChange(() => {
          batch(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ctx.props$ as any)?.[key].set(obs.peek());
          });
        })
      );
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
 * @param p - The ReactiveProps proxy from `useScope`
 * @param hints - Optional hint spec: scalar `'opaque'`|`'plain'`|`'function'` or per-field/nested map
 *
 * @example
 * ```ts
 * useScope((p) => {
 *   // plain data — no hints needed
 *   const obs$ = toObs(p)
 *   observe(() => console.log(obs$.count.get()))
 *
 *   // non-plain fields — specify hints
 *   const obs2$ = toObs(p, { onClick: 'function', data: 'opaque' })
 *
 *   return {}
 * }, props)
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
