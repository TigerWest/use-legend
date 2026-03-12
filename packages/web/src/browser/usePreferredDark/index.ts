"use client";
import type { UseMediaQueryOptions } from "@browser/useMediaQuery";
import { useMediaQuery } from "@browser/useMediaQuery";
import type { Observable } from "@legendapp/state";

export type UsePreferredDarkReturn = Observable<boolean>;

/*@__NO_SIDE_EFFECTS__*/
export function usePreferredDark(options?: UseMediaQueryOptions): UsePreferredDarkReturn {
  return useMediaQuery("(prefers-color-scheme: dark)", options);
}
