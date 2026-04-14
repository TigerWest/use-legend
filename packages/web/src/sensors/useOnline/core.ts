import type { DeepMaybeObservable, ReadonlyObservable } from "@usels/core";
import { createNetwork, type UseNetworkOptions } from "../useNetwork/core";

export type UseOnlineOptions = UseNetworkOptions;
export type UseOnlineReturn = ReadonlyObservable<boolean>;

/*@__NO_SIDE_EFFECTS__*/
export function createOnline(options?: DeepMaybeObservable<UseOnlineOptions>): UseOnlineReturn {
  const { isOnline$ } = createNetwork(options);
  return isOnline$;
}
