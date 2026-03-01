import type { Observable } from "@legendapp/state";
import { useObservable, useMount, useObserve } from "@legendapp/state/react";
import { useRef } from "react";
import type { MaybeElement } from "../useRef$";
import { normalizeTargets } from "../useResizeObserver";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentional alias to allow future extension without breaking API
export interface UseMutationObserverOptions extends MutationObserverInit {}

export interface UseMutationObserverReturn {
  isSupported$: Observable<boolean>;
  stop: () => void;
  resume: () => void;
  takeRecords: () => MutationRecord[];
}

export function useMutationObserver(
  target: MaybeElement | MaybeElement[],
  callback: MutationCallback,
  options?: UseMutationObserverOptions
): UseMutationObserverReturn {
  const isSupported$ = useObservable<boolean>(typeof MutationObserver !== "undefined");
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

  return { isSupported$, stop: cleanup, resume: setup, takeRecords };
}
