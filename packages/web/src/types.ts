import type { ReadonlyObservable } from "@usels/core";

/**
 * A value that resolves to an EventTarget (or subtype), or null/undefined.
 *
 * Accepted forms:
 * - `Ref$<T>` — React callback ref; structurally matches `ReadonlyObservable<T | null>`
 * - `ReadonlyObservable<T | null>` / `Observable<T | null>` — any Legend-State observable
 * - `T` — raw EventTarget subtype (Element, Document, Window, etc.)
 * - `null` / `undefined` — no-op
 *
 * Resolved via `get(v)` / `peek(v)` from `@usels/core`.
 * Returns `T | null | undefined` with no `any` leak.
 *
 * Note: `OpaqueObservable<T>` is not in the explicit union.
 * If passing one directly, cast: `obs as unknown as MaybeEventTarget<T>`.
 */
export type MaybeEventTarget<T extends EventTarget = EventTarget> =
  | ReadonlyObservable<T | null>
  | T
  | null
  | undefined;
