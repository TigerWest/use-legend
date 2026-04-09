import { type Observable } from "@legendapp/state";
import { observable } from "@shared/observable";
import { onMount } from "@primitives/useScope";

export type UseWhenMountedReturn<T> = Observable<T | undefined>;

export function createWhenMounted<T>(callback: () => T): UseWhenMountedReturn<T> {
  const isMounted$ = observable(false);

  onMount(() => {
    isMounted$.set(true);
    return () => isMounted$.set(false);
  });

  return observable<T | undefined>(() => {
    if (!isMounted$.get()) return undefined;
    return callback();
  });
}
