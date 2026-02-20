import type { Observable } from "@legendapp/state";
import { useObservable, useMount, useObserve } from "@legendapp/state/react";
import { useRef } from "react";
import type { El$ } from "../useEl$";
import type { MaybeObservable } from "../../types";
import { normalizeTargets } from "../useResizeObserver";

export interface UseMutationObserverOptions extends MutationObserverInit {}

export interface UseMutationObserverReturn {
  isSupported: Observable<boolean>;
  stop: () => void;
  takeRecords: () => MutationRecord[];
}

type MutationTarget = El$<Element> | MaybeObservable<Element | null>;

export function useMutationObserver(
  target: MutationTarget | MutationTarget[],
  callback: MutationCallback,
  options?: UseMutationObserverOptions,
): UseMutationObserverReturn {
  const isSupported$ = useObservable<boolean>(
    typeof MutationObserver !== "undefined",
  );
  const observerRef = useRef<MutationObserver | null>(null);
  const isMounted = useRef(false);

  const cleanup = () => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  };

  const setup = () => {
    if (!isSupported$.peek() || !isMounted.current) return;
    cleanup();

    const targets = normalizeTargets(target);
    const uniqueTargets = [...new Set(targets)];

    if (!uniqueTargets.length) return;

    observerRef.current = new MutationObserver(callback);
    uniqueTargets.forEach((el) => {
      observerRef.current!.observe(el, options);
    });
  };

  useMount(() => {
    isMounted.current = true;
    setup();
    return () => {
      isMounted.current = false;
      cleanup();
    };
  });

  useObserve(() => {
    normalizeTargets(target);
    setup();
  });

  const takeRecords = (): MutationRecord[] => {
    return observerRef.current?.takeRecords() ?? [];
  };

  return { isSupported: isSupported$, stop: cleanup, takeRecords };
}
