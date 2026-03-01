import { getElement, type MaybeElement } from "../../elements/useRef$";

/**
 * Normalizes one or more observable-element targets into a plain Element[].
 *
 * - `Ref$<T>` — calls `.get()` and unwraps the OpaqueObject via `.valueOf()`
 * - `Observable<OpaqueObject<Element> | null>` — calls `.get()` and unwraps via `.valueOf()`
 * - `Document` / `Window` — filtered out (not an Element, handled by callers)
 * - `null` — filtered out
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return getElement(t) as any;
    })
    .filter((el): el is Element => el != null);
}
