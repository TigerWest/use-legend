import { observe as legendObserve } from "@legendapp/state";
import { getCurrentScope, type ObserverRecord } from "./effectScope";

/**
 * Scope-aware wrapper around legend-state's `observe()`.
 *
 * When called inside a `useScope` factory (or `effectScope.run()`), the registration is
 * stored as a pausable `ObserverRecord` on the current scope. The subscription is torn
 * down by `_pauseAll()` on every `useEffect` cleanup (including React Strict Mode's
 * simulated unmount) and re-created by `_resumeAll()` on the next mount — the factory
 * itself does not re-run.
 *
 * Outside a scope, behaves identically to legend-state's `observe()`.
 */
export function observe(...args: Parameters<typeof legendObserve>): () => void {
  const scope = getCurrentScope();
  if (!scope) {
    return (legendObserve as (...a: Parameters<typeof legendObserve>) => () => void)(...args);
  }

  const record: ObserverRecord = {
    args,
    unsub: (legendObserve as (...a: Parameters<typeof legendObserve>) => () => void)(...args),
  };
  scope._observers.push(record);

  return () => {
    record.unsub?.();
    record.unsub = undefined;
    const idx = scope._observers.indexOf(record);
    if (idx !== -1) scope._observers.splice(idx, 1);
  };
}
