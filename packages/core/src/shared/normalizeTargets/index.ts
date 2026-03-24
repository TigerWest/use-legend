import { getElement, type MaybeElement } from "@reactivity/useRef$";
import { toArray } from "@shared/utils";

export type NormalizedTarget = Element | Document | Window;

/**
 * Normalizes one or more observable-element targets into a plain array.
 *
 * - `Ref$<T>` — calls `.get()` and unwraps the OpaqueObject via `.valueOf()`
 * - `Observable<OpaqueObject<Element> | null>` — calls `.get()` and unwraps via `.valueOf()`
 * - `Document` / `Window` — passed through as-is
 * - `null` — filtered out
 *
 * When called inside `useObserve`, reading `.get()` registers observable
 * dependencies so the observer re-fires when a tracked target changes.
 */
export function normalizeTargets(target?: MaybeElement | MaybeElement[]): NormalizedTarget[] {
  if (target == null) return [];
  const arr = toArray(target);
  return arr
    .map((t) => getElement(t) as NormalizedTarget | null)
    .filter((el): el is NormalizedTarget => el != null);
}
