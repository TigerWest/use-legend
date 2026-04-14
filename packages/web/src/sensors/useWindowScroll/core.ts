import type { DeepMaybeObservable } from "@usels/core";
import { defaultWindow } from "@shared/configurable";
import { createScroll, type UseScrollOptions, type UseScrollReturn } from "../useScroll/core";

export type UseWindowScrollOptions = UseScrollOptions;
export type UseWindowScrollReturn = UseScrollReturn;

/*@__NO_SIDE_EFFECTS__*/
export function createWindowScroll(
  options?: DeepMaybeObservable<UseWindowScrollOptions>
): UseWindowScrollReturn {
  return createScroll(defaultWindow ?? null, options);
}
