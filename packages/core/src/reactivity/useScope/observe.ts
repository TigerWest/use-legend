import { observe as legendObserve } from "@legendapp/state";
import { getCurrentScope } from "./effectScope";

/**
 * Scope-aware wrapper around legend-state's `observe()`.
 *
 * When called inside a `useScope` factory, the unsubscribe function is automatically
 * registered to the current scope and called when the component unmounts.
 *
 * Outside a scope, behaves identically to legend-state's `observe()`.
 */
export function observe(...args: Parameters<typeof legendObserve>): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unsub = (legendObserve as any)(...args) as () => void;
  getCurrentScope()?._addDispose(unsub);
  return unsub;
}
