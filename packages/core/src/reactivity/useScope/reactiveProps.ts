import { batch, observable, ObservableHint, type Observable } from "@legendapp/state";
import type { FieldHint, FieldTransformMap } from "@reactivity/useMaybeObservable";

/** @internal Symbol to retrieve ScopePropsCtx from a ReactiveProps proxy */
const REACTIVE_PROPS_CTX = Symbol("reactivePropsCtx");

/** @internal Per-instance context for the props proxy */
export interface ScopePropsCtx<P extends Record<string, unknown>> {
  propsRef: { current: P };
  props$: Observable<P> | null;
  hints: FieldTransformMap<P> | null;
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

/** @internal Apply a single FieldHint to a value before storing in observable */
function applyHintToValue(hint: FieldHint | undefined, val: unknown): unknown {
  if (val == null) return val;
  // Explicit hints take priority
  if (hint === "opaque") return ObservableHint.opaque(val);
  if (hint === "plain") return ObservableHint.plain(val as object);
  // Auto-detect: functions always wrapped (covers 'function' hint too)
  if (typeof val === "function") return ObservableHint.function(val);
  if (isReactElement(val)) return ObservableHint.opaque(val);
  if (Array.isArray(val) && val.some(isReactElement)) return ObservableHint.opaque(val);
  return val;
}

/** @internal Build initial observable value with hints applied */
function buildInitialValue<P extends Record<string, unknown>>(
  props: P,
  hints: FieldTransformMap<P> | null | undefined
): P {
  if (!hints) return props;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    result[key] = applyHintToValue(hints[key as keyof P] as FieldHint | undefined, props[key]);
  }
  return result as P;
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

  const prev = ctx.rawPrev ?? {};
  batch(() => {
    // Updated or added keys
    for (const key of Object.keys(next)) {
      if (Object.is(prev[key], next[key as keyof P])) continue; // unchanged
      const hint = ctx.hints?.[key as keyof P] as FieldHint | undefined;
      const val = applyHintToValue(hint, next[key as keyof P]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.props$ as any)[key].set(val);
    }
    // Removed keys → set to undefined
    for (const key of Object.keys(prev)) {
      if (!(key in next)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx.props$ as any)[key].set(undefined);
      }
    }
  });

  ctx.rawPrev = { ...next };
}

/**
 * Convert a `ReactiveProps<P>` proxy to an `Observable<P>` for reactive tracking.
 *
 * The observable is created lazily on first call. Subsequent calls return the same instance.
 * Hints are stored and applied on every subsequent `syncProps` call (each render).
 *
 * @param p - The ReactiveProps proxy from `useScope`
 * @param hints - Optional per-field FieldHint map (same as useMaybeObservable's FieldTransformMap)
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
export function toObs<P extends Record<string, unknown>>(
  p: ReactiveProps<P>,
  hints?: FieldTransformMap<P>
): Observable<P> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = (p as any)[REACTIVE_PROPS_CTX] as ScopePropsCtx<P> | undefined;
  if (!ctx) {
    throw new Error("[useScope] toObs() must be called with a ReactiveProps proxy from useScope");
  }

  if (!ctx.props$) {
    // First call — create observable with hints applied to initial props
    if (hints) ctx.hints = hints;
    const initial = buildInitialValue(ctx.propsRef.current, ctx.hints);
    ctx.props$ = observable(initial);
    ctx.rawPrev = { ...ctx.propsRef.current };
  } else if (hints) {
    // Subsequent call with new hints — update for future syncs
    ctx.hints = hints;
  }

  return ctx.props$;
}
