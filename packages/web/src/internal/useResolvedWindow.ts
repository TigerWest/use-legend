import type { Observable, OpaqueObject } from "@legendapp/state";
import { ObservableHint } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { resolveWindowSource } from "@shared/configurable";

/**
 * Resolves an `opts$.window` field (pre-processed by the `'opaque'` hint) into
 * a reactive `Window` observable. Delegates the actual `WindowSource` → `Window`
 * resolution to the framework-agnostic `resolveWindowSource` in `configurable.ts`,
 * then re-wraps the result with `ObservableHint.opaque()` so the computed
 * observable doesn't deep-proxy the `Window`.
 *
 * Reactive — automatically recomputes when iframe mounts/unmounts.
 *
 * @internal web package only — not exported from public API.
 */
export function useResolvedWindow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legend-State Observable variance
  resolved$: Observable<any>
) {
  return useObservable<OpaqueObject<Window> | null>(() => {
    const win = resolveWindowSource(resolved$.get());
    return win ? ObservableHint.opaque(win) : null;
  });
}
