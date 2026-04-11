import type { Observable, OpaqueObject } from "@legendapp/state";
import { useConstant } from "@usels/core/shared/useConstant";
import { resolveWindowSource } from "@shared/configurable";

/**
 * React hook wrapper around `resolveWindowSource`. Memoizes the computed
 * observable across renders so legacy hook-layer code (outside of `useScope`)
 * gets a stable reference.
 *
 * New scope-based cores should call `resolveWindowSource(opts$.window)`
 * directly inside their `useScope` factory instead.
 *
 * @internal web package only — not exported from public API.
 */
export function useResolvedWindow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legend-State Observable variance
  resolved$: Observable<any>
): Observable<OpaqueObject<Window> | null> {
  return useConstant(() => resolveWindowSource(resolved$ as Observable<unknown>));
}
