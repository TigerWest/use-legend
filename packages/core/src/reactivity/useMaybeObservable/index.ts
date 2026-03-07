import { isObservable, linked, ObservableHint, type Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useMemo } from "react";
import { get } from "@utilities/get";
import { useLatest } from "@shared/useLatest";
import type { DeepMaybeObservable, MaybeObservable } from "../../types";
import { getElement } from "@reactivity/useRef$";
import type { MaybeElement } from "@reactivity/useRef$";

/**
 * Per-field resolution hint for the object-form transform.
 *
 * - `'default'`  — Legend-State auto-derefs + if resolved value is `function`, wraps with `ObservableHint.function()`. **Default.**
 * - `'opaque'`   — `get()` then `ObservableHint.opaque()`. Null-safe.
 * - `'plain'`    — `get()` then `ObservableHint.plain()`. Prevents nested auto-deref. Null-safe.
 * - `'function'` — `get()` then `ObservableHint.function()`. For callbacks. Null-safe.
 * - `'element'`  — `getElement(fieldValue)` (reactive) then `ObservableHint.opaque()`. For MaybeElement.
 *
 * Escape hatch:
 * - `(value) => R` — custom transform function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic type parameter defaults require any for maximum flexibility
export type FieldHint<V = any, R = any> =
  | "default"
  | "opaque"
  | "plain"
  | "function"
  | "element"
  | ((value: MaybeObservable<V>) => R);

/**
 * Maps each field of `T` to a `FieldHint`.
 * Fields not specified default to `'default'` (Legend-State auto-deref).
 */
export type FieldTransformMap<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- transform return type is intentionally any (arbitrary transform output)
  [K in keyof T]?: FieldHint<T[K], any>;
};

/**
 * The `transform` parameter for `useMaybeObservable`.
 * - **Object form:** declarative per-field hints — `FieldTransformMap<T>`.
 * - **Function form:** full custom compute — `(current) => T | undefined`.
 */
export type Transform<T> =
  | FieldTransformMap<T>
  | ((current: DeepMaybeObservable<T> | undefined) => T | undefined);

/**
 * Extended config for `useMaybeObservable`.
 * Combines per-field hints / custom compute with the `linked` write-back option.
 *
 * When the second argument is a plain `Transform<T>` (object-form or function-form),
 * it is treated as backward-compatible shorthand (equivalent to `{ transform: ... }`).
 * Use this extended form when `linked` is needed alongside a transform.
 */
export interface UseMaybeObservableConfig<T> {
  /**
   * Per-field hints or custom compute function.
   * Same as passing `Transform<T>` directly as the second argument.
   */
  transform?: Transform<T>;
  /**
   * When true, the returned Observable supports write-back via linked({ get, set }).
   * Only effective when options is an outer Observable<T>.
   * Plain values and per-field Observables are silently ignored (no write target).
   */
  linked?: boolean;
}

function applyObjectTransform<T>(raw: T | undefined, map: FieldTransformMap<T>): T | undefined {
  if (raw == null) return undefined;
  const result = { ...raw } as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    const hint = (map as Record<string, FieldHint>)[key];
    const fieldValue = result[key] as MaybeObservable<unknown>;
    switch (hint) {
      case "opaque": {
        const v = get(fieldValue);
        if (v != null) result[key] = ObservableHint.opaque(v);
        break;
      }
      case "plain": {
        const v = get(fieldValue);
        if (v != null) result[key] = ObservableHint.plain(v as object);
        break;
      }
      case "function": {
        const v = get(fieldValue);
        if (v != null) result[key] = ObservableHint.function(v as (...args: unknown[]) => unknown);
        break;
      }
      case "element": {
        if (fieldValue !== undefined) {
          // Observable resolving to undefined means "not set" — propagate undefined
          if (isObservable(fieldValue) && (fieldValue as Observable<unknown>).get() === undefined) {
            result[key] = undefined;
            break;
          }
          const el = getElement(fieldValue as MaybeElement);
          result[key] = el != null ? ObservableHint.opaque(el) : null;
        }
        break;
      }
      default: {
        if (typeof hint === "function") {
          result[key] = hint(fieldValue);
          break;
        }
        // Default behavior: preserve Legend-State auto-deref and auto-hint callbacks.
        // This allows omitted hints to still treat function fields as stable callback values.
        const v = get(fieldValue);
        if (typeof v === "function") {
          result[key] = ObservableHint.function(v as (...args: unknown[]) => unknown);
        }
        // 'default' or undefined → auto-deref; function values are auto-wrapped with ObservableHint.function
        break;
      }
    }
  }
  return result as T;
}

/**
 * Normalizes `DeepMaybeObservable<T>` into a stable computed `Observable<T | undefined>`.
 *
 * Handles three cases without interference:
 * - **Outer `Observable<T>`** — tracked via `.get()` dep inside the compute fn
 * - **Per-field `{ field: Observable<T[K]> }`** — tracked via explicit `get()` per field
 * - **Plain value changing between renders** — tracked via Symbol depKey (React-level)
 *
 * The Symbol depKey prevents Legend-State from auto-deref'ing inner Observables
 * inside `depsObs$`, which would break per-field dep tracking if the raw `options`
 * object were passed directly as the dep array item.
 *
 * @param options - DeepMaybeObservable options to normalize
 * @param transform - Optional transform. Two forms:
 *   - **Object form:** `FieldTransformMap<T>` — per-field hints (`'opaque'`, `'function'`, etc.).
 *     Defaults to `'default'` for unspecified fields.
 *     **Note:** has no effect when `options` is an outer `Observable<T>` — in that case the
 *     proxy is returned as-is (same as no transform), preserving Legend-State's
 *     reference-equality tracking behavior. Use per-field Observables or plain objects
 *     when field-level hints are needed.
 *   - **Function form:** `(current) => T | undefined` — full custom compute for complex cases.
 */
export function useMaybeObservable<T>(
  options: DeepMaybeObservable<T> | undefined,
  config?: Transform<T> | UseMaybeObservableConfig<T>
): Observable<T | undefined> {
  // Resolve config: backward-compat (Transform<T>) vs extended ({ transform, linked })
  let transform: Transform<T> | undefined;
  let isLinked = false;
  if (config != null) {
    if (typeof config === "function") {
      transform = config;
    } else if ("linked" in config || "transform" in config) {
      transform = (config as UseMaybeObservableConfig<T>).transform;
      isLinked = (config as UseMaybeObservableConfig<T>).linked === true;
    } else {
      transform = config as Transform<T>;
    }
  }

  const optionsRef = useLatest(options);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const depKey = useMemo(() => Symbol(), [options]);
  const compute = (): T | undefined => {
    if (typeof transform === "function") {
      return transform(optionsRef.current);
    }
    const raw = optionsRef.current;
    const resolved = get(raw as MaybeObservable<T> | undefined);
    if (transform != null && !isObservable(raw)) {
      // Object form — only applies when options is NOT an outer Observable.
      // For outer Observable, returning the proxy as-is preserves the
      // "reference-equality tracking" behavior: child-field mutations do not
      // trigger opts$ recomputation (documented known Legend-State limitation).
      // For per-field Observable or plain object, apply field hints.
      return applyObjectTransform(resolved, transform);
    }
    return resolved;
  };
  const initialValue = isLinked
    ? linked({
        get: compute,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legend-State's SetParams<T> conditional types break generic inference
        set: ({ value }: any) => {
          const raw = optionsRef.current;
          if (isObservable(raw)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Observable<T> loses .set() with unconstrained generics
            (raw as any).set(value);
          }
        },
      })
    : compute;
  return useObservable(initialValue, [depKey]) as unknown as Observable<T | undefined>;
}
