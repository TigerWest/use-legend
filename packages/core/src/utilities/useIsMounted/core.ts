import { observable } from "@shared/observable";
import { onMount } from "@primitives/useScope";
import type { ReadonlyObservable } from "../../types";

/**
 * Returns a ReadonlyObservable that flips from `false` to `true` after the
 * component mounts. Intended for scope-internal gating (e.g. deferring an
 * effect or setOptions call until after mount).
 *
 * Must be called inside a scope (`useScope` factory or standalone `createScope`).
 */
export function createIsMounted(): ReadonlyObservable<boolean> {
  const isMounted$ = observable(false);
  onMount(() => {
    isMounted$.set(true);
  });
  return isMounted$ as ReadonlyObservable<boolean>;
}
