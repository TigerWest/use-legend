import { useEffect } from "react";
import { useLatest } from "./useLatest";

/**
 * Synchronous unmount cleanup hook.
 *
 * Unlike Legend-State's `useUnmount`, this does NOT defer cleanup via
 * microtask queue — the callback fires synchronously during React's
 * commit phase. This makes it predictable in tests without needing
 * `await` / `queueMicrotask` flushes.
 *
 * The callback ref pattern ensures the latest closure is always called,
 * even if the parent re-renders before unmount.
 *
 * @internal — intended for `@usels/core` and sibling packages only.
 */
export function useUnmount(fn: () => void): void {
  const fnRef = useLatest(fn);

  // eslint-disable-next-line use-legend/prefer-use-observe
  useEffect(() => () => fnRef.current(), []);
}
