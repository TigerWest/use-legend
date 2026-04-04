import { get } from "@usels/core";
import { toArray } from "@usels/core/shared/utils";
import type { MaybeEventTarget } from "../../types";

export type NormalizedTarget = Element | Document | Window;

/**
 * Normalizes one or more observable-element targets into a plain array.
 *
 * - `Ref$<T>` / `OpaqueObservable<T>` — calls `get()` which auto-unwraps
 * - `Document` / `Window` — passed through as-is
 * - `null` — filtered out
 *
 * When called inside `useObserve`, reading `get()` registers observable
 * dependencies so the observer re-fires when a tracked target changes.
 */
export function normalizeTargets(
  target?: MaybeEventTarget | MaybeEventTarget[]
): NormalizedTarget[] {
  if (target == null) return [];
  const arr = toArray(target);
  return arr
    .map((t) => get(t) as NormalizedTarget | null)
    .filter((el): el is NormalizedTarget => el != null);
}
