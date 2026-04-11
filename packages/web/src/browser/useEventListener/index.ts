"use client";
import { useScope } from "@usels/core";
import { createEventListener, parseEventListenerArgs } from "./core";

export { createEventListener } from "./core";
export type { GeneralEventListener } from "./core";

/**
 * Register using addEventListener on mount, and removeEventListener
 * automatically on unmount. Returns a manual cleanup function for early
 * imperative removal.
 *
 * Wraps `createEventListener` in a `useScope`. The wrapper substitutes the
 * user's listener with a stable forwarder that reads `p.args` raw latest at
 * every event dispatch — so re-renders that change the listener closure are
 * picked up without re-registering the underlying handler. Arg-shape detection
 * goes through the shared `parseEventListenerArgs` helper exported from `core.ts`.
 */
export type UseEventListener = typeof createEventListener;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- overloaded function type can only be satisfied by a casted implementation
export const useEventListener: UseEventListener = ((...args: any[]) => {
  return useScope(
    (p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw latest read
      const initial = parseEventListenerArgs(p.args as any[]);
      const { listenerIdx } = initial;

      // Stable forwarder — reads the latest listener at the same slot every
      // time an event fires.
      const forwarderListener = (ev: Event) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw latest read
        const latest = (p.args as any[])[listenerIdx];
        const list = Array.isArray(latest) ? latest : [latest];
        list.forEach((l) => l?.(ev));
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw latest read
      const newArgs = [...(p.args as any[])];
      newArgs[listenerIdx] = forwarderListener;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- core overload dispatch via spread
      return (createEventListener as any)(...newArgs) as () => void;
    },
    { args }
  );
}) as UseEventListener;
