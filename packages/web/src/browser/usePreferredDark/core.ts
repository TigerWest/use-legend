import type { Observable } from "@legendapp/state";
import type { DeepMaybeObservable } from "@usels/core";
import { createMediaQuery, type UseMediaQueryOptions } from "../useMediaQuery/core";

export type UsePreferredDarkReturn = Observable<boolean>;

/**
 * Framework-agnostic reactive `prefers-color-scheme: dark` tracker.
 *
 * Thin wrapper around {@link createMediaQuery}. Must be called inside a
 * `useScope` factory.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPreferredDark(
  options?: DeepMaybeObservable<UseMediaQueryOptions>
): UsePreferredDarkReturn {
  return createMediaQuery("(prefers-color-scheme: dark)", options);
}
