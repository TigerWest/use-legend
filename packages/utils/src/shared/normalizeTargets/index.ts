import { getElement, type MaybeElement } from "../../elements/useEl$";

/**
 * Normalizes one or more observable-element targets into a plain Element[].
 *
 * - `El$<T>` — calls `.get()` and unwraps the OpaqueObject via `.valueOf()`
 * - `Observable<Element|null>` — calls `.get()`
 * - plain `Element | null` — used as-is
 *
 * When called inside `useObserve`, reading `.get()` registers observable
 * dependencies so the observer re-fires when a tracked target changes.
 *
 * Currently shared by useResizeObserver.
 * useIntersectionObserver, useMutationObserver will use this once implemented.
 */
export function normalizeTargets(
  target?: MaybeElement | MaybeElement[],
): Element[] {
  if (target == null) return [];
  const arr = Array.isArray(target) ? target : [target];
  return arr
    .map((t) => {
      return getElement(t) as any;
    })
    .filter((el): el is Element => el != null);
}
