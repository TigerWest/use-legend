import { observable, type Observable } from "@legendapp/state";
import { observe } from "../observe";
import { onScopeDispose } from "../effectScope";
import type { AnyFn, Pausable } from "../../../types";

export interface IntervalFnOptions {
  immediate?: boolean;
  immediateCallback?: boolean;
}

/**
 * BENCHMARK ONLY — scoped variant of createIntervalFn.
 * Uses scope-aware observe() and onScopeDispose() instead of returning Disposable.
 * Must be called inside a scope.run() or useScope() factory.
 */
export function createIntervalFnScoped(
  fn: AnyFn,
  interval$: Observable<number>,
  options?: IntervalFnOptions
): Pausable {
  const isActive$ = observable(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const immediateCallback = options?.immediateCallback ?? false;

  const cleanupTimer = () => {
    clearInterval(timer);
    timer = undefined;
  };

  const pause = () => {
    if (!isActive$.peek()) return;
    isActive$.set(false);
    cleanupTimer();
  };

  const resume = () => {
    if (isActive$.peek()) return;
    isActive$.set(true);
    if (immediateCallback) fn();
    const ms = interval$.peek();
    timer = setInterval(() => fn(), ms);
  };

  // scope-aware observe — unsub auto-registered to current scope
  observe(() => {
    const ms = interval$.get();
    cleanupTimer();
    if (isActive$.peek()) {
      timer = setInterval(() => fn(), ms);
    }
  });

  // cleanup registered to scope (no dispose() return)
  onScopeDispose(() => {
    pause();
  });

  if (options?.immediate ?? true) resume();

  return { isActive$, pause, resume };
}
