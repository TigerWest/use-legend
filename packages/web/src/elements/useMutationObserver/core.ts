import { observable } from "@legendapp/state";
import { createSupported, get, observe, onUnmount } from "@usels/core";
import { normalizeTargets } from "@shared/normalizeTargets";
import type { DeepMaybeObservable, ReadonlyObservable, Supportable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentional alias to allow future extension without breaking API
export interface UseMutationObserverOptions extends MutationObserverInit {}

export interface UseMutationObserverReturn extends Supportable {
  readonly isActive$: ReadonlyObservable<boolean>;
  stop: () => void;
  resume: () => void;
  takeRecords: () => MutationRecord[];
}

export function createMutationObserver(
  target: MaybeEventTarget | MaybeEventTarget[],
  callback: MutationCallback,
  options?: DeepMaybeObservable<UseMutationObserverOptions>
): UseMutationObserverReturn {
  const opts$ = observable(options);
  const isSupported$ = createSupported(() => typeof MutationObserver !== "undefined");
  const isActive$ = observable<boolean>(true);
  let observer: MutationObserver | null = null;

  const cleanup = () => {
    observer?.disconnect();
    observer = null;
  };

  observe(() => {
    const raw = opts$.get();
    const active = isActive$.get();
    // Reactive read — register dependency on target observables
    const targets = normalizeTargets(target);

    cleanup();
    if (!isSupported$.get() || !active) return;

    const uniqueTargets = [...new Set(targets)];
    if (!uniqueTargets.length) return;

    const init: MutationObserverInit = {
      subtree: get(raw?.subtree) as boolean | undefined,
      childList: get(raw?.childList) as boolean | undefined,
      attributes: get(raw?.attributes) as boolean | undefined,
      characterData: get(raw?.characterData) as boolean | undefined,
      attributeOldValue: get(raw?.attributeOldValue) as boolean | undefined,
      characterDataOldValue: get(raw?.characterDataOldValue) as boolean | undefined,
      attributeFilter: get(raw?.attributeFilter) as string[] | undefined,
    };

    observer = new MutationObserver(callback);
    uniqueTargets.forEach((el) => {
      observer!.observe(el as Node, init);
    });
  });

  onUnmount(cleanup);

  const stop = () => {
    cleanup();
    isActive$.set(false);
  };

  const resume = () => {
    isActive$.set(true);
  };

  const takeRecords = (): MutationRecord[] => {
    return observer?.takeRecords() ?? [];
  };

  return {
    isSupported$,
    isActive$: isActive$ as ReadonlyObservable<boolean>,
    stop,
    resume,
    takeRecords,
  };
}
