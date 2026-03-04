import type { Observable } from "@legendapp/state";
import { useIsMounted, useObservable } from "@legendapp/state/react";

export type UseWhenMountedReturn<T> = Observable<T | undefined>;

/* @__NO_SIDE_EFFECTS__ */
export function useWhenMounted<T>(callback: () => T): UseWhenMountedReturn<T> {
  const isMounted = useIsMounted();

  return useObservable(() => {
    if (!isMounted.get()) return undefined;
    return callback();
  }) as unknown as Observable<T | undefined>;
}
