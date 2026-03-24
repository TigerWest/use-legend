"use client";
import type { DeepMaybeObservable, MaybeElement } from "@usels/core";
import { getElement, useMaybeObservable } from "@usels/core";
import { defaultDocument } from "@usels/core/shared/configurable";
import { useLatest } from "@usels/core/shared/useLatest";
import { useMutationObserver } from "@elements/useMutationObserver";
import { useObserve } from "@legendapp/state/react";
import { useRef } from "react";

export interface UseOnElementRemovalOptions {
  /** Document or ShadowRoot to observe. Default: document */
  root?: Document | ShadowRoot;
}

export function useOnElementRemoval(
  target: MaybeElement,
  callback: (mutations: MutationRecord[]) => void,
  options?: DeepMaybeObservable<UseOnElementRemovalOptions>
): void {
  const opts$ = useMaybeObservable(options);
  const callbackRef = useLatest(callback);
  const elRef = useRef<ReturnType<typeof getElement>>(null);

  useObserve(() => {
    const el = getElement(target);
    if (el) elRef.current = el;
  });

  const root = (opts$.root.peek() ?? defaultDocument) as MaybeElement;

  useMutationObserver(
    root,
    (mutations) => {
      const el = elRef.current;
      if (!el) return;

      for (const mutation of mutations) {
        for (let i = 0; i < mutation.removedNodes.length; i++) {
          const removed = mutation.removedNodes[i];
          if (removed === el || (removed instanceof Element && removed.contains(el as Node))) {
            callbackRef.current(mutations);
            elRef.current = null;
            return;
          }
        }
      }
    },
    { childList: true, subtree: true }
  );
}
