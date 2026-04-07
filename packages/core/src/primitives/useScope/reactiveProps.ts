import { observable, ObservableHint, type Observable } from "@legendapp/state";
import type { ImmutableObservableBase } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";

/** @internal Strip Observable/ReadonlyObservable wrapper from a type (distributive over unions) */
type UnwrapObs<T> = T extends ImmutableObservableBase<infer U> ? U : T;

/**
 * Map each prop field to its unwrapped value type, stripping MaybeObservable wrappers.
 * Ensures `toObs(p).field` resolves to `Observable<T>` instead of `Observable<Observable<T> | T>`.
 * @public
 */
export type PropsOf<P extends Record<string, unknown>> = {
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

/** @internal Symbol to retrieve ScopePropsCtx from a ReactiveProps proxy */
const REACTIVE_PROPS_CTX = Symbol("reactivePropsCtx");

/** @internal Per-instance context for the props proxy */
export interface ScopePropsCtx<P extends Record<string, unknown>> {
  propsRef: { current: P };
  props$: Observable<P> | null;
  hints: NestedHintSpec<Record<string, unknown>> | null;
  rawPrev: Record<string, unknown> | null;
}

/**
 * Stable proxy around component props passed to `useScope`.
 * - `p.key` — raw latest value (ref-based, no legend-state tracking)
 * - `toObs(p)` — reactive Observable<P>
 * - `toObs(p, hints)` — reactive Observable<P> with per-field ObservableHint
 */
export type ReactiveProps<P extends Record<string, unknown>> = Readonly<P>;

/** @internal Create a stable ReactiveProps proxy backed by ctx.propsRef */
export function createReactiveProxy<P extends Record<string, unknown>>(
  ctx: ScopePropsCtx<P>
): ReactiveProps<P> {
  return new Proxy({} as ReactiveProps<P>, {
    get(_, key) {
      if (key === REACTIVE_PROPS_CTX) return ctx;
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

/** @internal Build initial observable value with hints applied */
function buildInitialValue<P extends Record<string, unknown>>(
  props: P,
  hints: NestedHintSpec<Record<string, unknown>> | null | undefined
): unknown {
  if (!hints) return props;
  return applyHintToValue(hints as ScopeHint | Record<string, unknown>, props);
}

/**
 * @internal
 * Update `props$` with the latest props values, only setting fields that changed.
 * Also updates `ctx.propsRef.current` unconditionally (raw access path).
 */
export function syncProps<P extends Record<string, unknown>>(ctx: ScopePropsCtx<P>, next: P): void {
  // Always keep ref current for raw access
  ctx.propsRef.current = next;

  // If no observable created (toObs not called), nothing to sync
  if (!ctx.props$) return;

  const hints = ctx.hints as NestedHintSpec<P> | null;
  const prev = ctx.rawPrev ?? {};

  // scalar hint: replace entire observable value at once
  if (typeof hints === "string") {
    const val = applyHintToValue(hints, next);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx.props$ as any).set(val);
    ctx.rawPrev = { ...next };
    return;
  }

  // field/nested hint: collect only changed keys → assign
  const changed: Record<string, unknown> = {};

  for (const key of Object.keys(next)) {
    if (Object.is(prev[key], next[key as keyof P])) continue;
    const fieldHint = (hints as Record<string, unknown> | null)?.[key];
    changed[key] = applyHintToValue(
      fieldHint as ScopeHint | Record<string, unknown> | undefined,
      next[key as keyof P]
    );
  }
  // removed keys → set to undefined (skip if already undefined to avoid spurious assign)
  for (const key of Object.keys(prev)) {
    if (!(key in next) && prev[key] !== undefined) changed[key] = undefined;
  }

  if (Object.keys(changed).length > 0) {
    // assign handles beginBatch/endBatch internally — no outer batch needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx.props$ as any).assign(changed);
  }

  ctx.rawPrev = { ...next };
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
export function toObs<P extends Record<string, unknown>, H extends NestedHintSpec<P> = never>(
  p: ReactiveProps<P>,
  hints?: H
): Observable<[H] extends [never] ? PropsOf<P> : ApplyHints<PropsOf<P>, H>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = (p as any)[REACTIVE_PROPS_CTX] as ScopePropsCtx<P> | undefined;
  if (!ctx) {
    throw new Error("[useScope] toObs() must be called with a ReactiveProps proxy from useScope");
  }

  if (!ctx.props$) {
    // First call — create observable with hints applied to initial props
    if (hints) ctx.hints = hints;
    const initial = buildInitialValue(ctx.propsRef.current, ctx.hints);
    ctx.props$ = observable(initial) as unknown as Observable<P>;
    ctx.rawPrev = { ...ctx.propsRef.current };
  } else if (hints) {
    // Subsequent call with new hints — update for future syncs
    ctx.hints = hints;
  }

  return ctx.props$ as unknown as Observable<
    [H] extends [never] ? PropsOf<P> : ApplyHints<PropsOf<P>, H>
  >;
}
