import type { Observable, OpaqueObject } from "@legendapp/state";
import { ObservableHint } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { defaultWindow } from "@shared/configurable";

const opaqueDefaultWindow = defaultWindow ? ObservableHint.opaque(defaultWindow) : null;

/**
 * Resolves an `opts$.window` field (pre-processed by `'element'` hint) into a
 * reactive `Window` observable.
 *
 * - `OpaqueObject<Window>` → return as-is (already opaque from `'element'` hint)
 * - `OpaqueObject<HTMLIFrameElement>` → `.valueOf().contentWindow` → `opaque()`
 * - `null` / `undefined` → `opaque(defaultWindow)`
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
    const raw = resolved$.get();
    if (!raw) return opaqueDefaultWindow;

    // iframe → extract contentWindow
    const val = typeof raw.valueOf === "function" ? raw.valueOf() : raw;
    if (val instanceof HTMLIFrameElement) {
      const win = val.contentWindow;
      return win ? ObservableHint.opaque(win) : null;
    }

    // Already OpaqueObject<Window> from 'element' hint
    return raw;
  });
}
