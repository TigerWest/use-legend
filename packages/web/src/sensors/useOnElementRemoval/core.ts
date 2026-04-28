import { observable } from "@legendapp/state";
import { get, createObserve } from "@usels/core";
import type { DeepMaybeObservable } from "@usels/core";
import { type ConfigurableDocumentOrShadowRoot, defaultDocument } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createMutationObserver } from "../../elements/useMutationObserver/core";

export type UseOnElementRemovalOptions = ConfigurableDocumentOrShadowRoot;

/**
 * Framework-agnostic element-removal detector.
 *
 * Tracks the target element reactively (via `observe` on `get(target)`), then
 * watches the document/root for childList mutations. When a removed node is or
 * contains the tracked element, `callback` fires and the tracked reference is
 * cleared so the next mount → removal cycle fires again.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createOnElementRemoval(
  target: MaybeEventTarget,
  callback: (mutations: MutationRecord[]) => void,
  options?: DeepMaybeObservable<UseOnElementRemovalOptions>
): void {
  const opts$ = observable(options);

  // Latest non-null target element. Mirrors the original `useWhenever` behavior
  // (only truthy transitions update the tracked ref). Cleared after detection
  // so the next mount → removal cycle can fire again.
  let trackedEl: Element | Document | Window | null = null;

  createObserve(() => {
    const el = get(target) as Element | Document | Window | null;
    if (el) trackedEl = el;
  });

  const rootOpt = opts$.peek()?.document as MaybeEventTarget | undefined;
  const root: MaybeEventTarget =
    rootOpt ?? (defaultDocument as unknown as MaybeEventTarget) ?? null;

  createMutationObserver(
    root,
    (mutations) => {
      const el = trackedEl;
      if (!el) return;

      for (const mutation of mutations) {
        for (let i = 0; i < mutation.removedNodes.length; i++) {
          const removed = mutation.removedNodes[i];
          if (removed === el || (removed instanceof Element && removed.contains(el as Node))) {
            callback(mutations);
            trackedEl = null;
            return;
          }
        }
      }
    },
    { childList: true, subtree: true }
  );
}
