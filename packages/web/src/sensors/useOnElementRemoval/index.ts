"use client";
import type { DeepMaybeObservable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { get, useMaybeObservable, useWhenever } from "@usels/core";
import { type ConfigurableDocumentOrShadowRoot, defaultDocument } from "@shared/configurable";
import { useLatest } from "@usels/core/shared/useLatest";
import { useMutationObserver } from "@elements/useMutationObserver";
import { useRef } from "react";

export type UseOnElementRemovalOptions = ConfigurableDocumentOrShadowRoot;

export function useOnElementRemoval(
  target: MaybeEventTarget,
  callback: (mutations: MutationRecord[]) => void,
  options?: DeepMaybeObservable<UseOnElementRemovalOptions>
): void {
  const opts$ = useMaybeObservable(options, { document: "element" });
  const callbackRef = useLatest(callback);

  const elRef = useRef<Element | Document | Window | null>(null);

  useWhenever(
    () => get(target) as Element | Document | Window | null,
    (el) => {
      elRef.current = el;
    },
    {
      immediate: true,
    }
  );

  const root = (opts$.document?.peek() ?? defaultDocument) as MaybeEventTarget;

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
