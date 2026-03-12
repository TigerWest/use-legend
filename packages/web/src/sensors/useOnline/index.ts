"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useNetwork } from "../useNetwork";

/*@__NO_SIDE_EFFECTS__*/
export function useOnline(): ReadonlyObservable<boolean> {
  const { isOnline$ } = useNetwork();
  return isOnline$;
}
