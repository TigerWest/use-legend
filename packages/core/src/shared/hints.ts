import { ObservableHint } from "@legendapp/state";

/** Leaf hint for a single field */
export type ScopeHint = "opaque" | "plain";

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
 * Hint spec: scalar hint or up to 3-level nested hint map.
 * Supported hints: `'opaque'` | `'plain'`
 * @public
 */
export type NestedHintSpec<P> = ScopeHint | HintMap1<P>;

/** @internal Apply a leaf hint to a type — only opaque changes the TS type */
type ApplyLeafHint<T, H extends ScopeHint> = H extends "opaque"
  ? import("@legendapp/state").OpaqueObject<T & object>
  : T;

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
 * - scalar `'opaque'` -> entire props wrapped in `OpaqueObject`
 * - map `{ field: 'opaque' }` -> only that field wrapped
 * - nested `{ field: { sub: 'opaque' } }` -> only that sub-field wrapped
 * @public
 */
export type ApplyHints<P, H> = H extends ScopeHint
  ? ApplyLeafHint<P, H & ScopeHint>
  : H extends Record<string, unknown>
    ? ApplyHintMap<P, H>
    : P;

/**
 * Apply a ScopeHint or nested hint map to a value.
 * Returns the value unchanged when no hint is provided.
 *
 * NOTE: Unlike prior versions, values without an explicit hint are returned as-is.
 * Functions, React elements, etc. are NOT auto-wrapped — callers must specify hints explicitly.
 */
export function applyHintToValue(
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

  // no hint — return as-is (no auto-detection)
  return val;
}

/**
 * Apply hints to an entire object's fields.
 * When hints is a scalar ScopeHint, applies to the whole object.
 * When hints is a map, applies per-field.
 */
export function applyHintsToObject<T>(
  value: T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hints: NestedHintSpec<any>
): unknown {
  if (value == null) return value;

  // scalar hint → apply to entire value
  if (typeof hints === "string") {
    return applyHintToValue(hints, value);
  }

  // map hint → apply per-field
  if (typeof value !== "object" || Array.isArray(value)) return value;
  const src = value as Record<string, unknown>;
  const out: Record<string, unknown> = { ...src };
  for (const key of Object.keys(hints)) {
    out[key] = applyHintToValue(
      (hints as Record<string, unknown>)[key] as ScopeHint | Record<string, unknown> | undefined,
      src[key]
    );
  }
  return out;
}
