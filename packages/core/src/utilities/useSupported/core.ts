import { type Observable } from "@legendapp/state";
import { observable } from "@shared/observable";
import { onBeforeMount } from "@primitives/useScope";

export type UseSupportedReturn = Observable<boolean>;

export function createSupported(callback: () => unknown): UseSupportedReturn {
  const isMounted$ = observable(false);

  onBeforeMount(() => {
    isMounted$.set(true);
    return () => isMounted$.set(false);
  });

  return observable<boolean>(() => {
    if (!isMounted$.get()) return false;
    return Boolean(callback());
  });
}
