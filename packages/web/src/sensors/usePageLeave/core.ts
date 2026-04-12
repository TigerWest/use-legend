import { observable, type Observable, type OpaqueObject } from "@legendapp/state";
import { type DeepMaybeObservable, type ReadonlyObservable } from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

export type UsePageLeaveOptions = ConfigurableWindow;

/**
 * Framework-agnostic reactive page-leave detector.
 *
 * Returns an `Observable<boolean>` that is `true` while the mouse cursor is
 * outside the page (document) and `false` otherwise. Listens to `mouseout` on
 * the window plus `mouseleave` / `mouseenter` on the document. The target
 * window is resolved via `resolveWindowSource`, so `options.window` (plain,
 * Ref$, or Observable) is honored reactively.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPageLeave(
  options?: DeepMaybeObservable<UsePageLeaveOptions>
): ReadonlyObservable<boolean> {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);
  const doc$ = observable<OpaqueObject<Document> | null>(() => {
    const win = win$.get();
    return (win?.document ?? null) as OpaqueObject<Document> | null;
  });

  const isLeft$ = observable(false);

  const onLeave = (event: MouseEvent) => {
    const from =
      event.relatedTarget || (event as MouseEvent & { toElement?: EventTarget | null }).toElement;
    isLeft$.set(!from);
  };

  const onEnter = () => {
    isLeft$.set(false);
  };

  createEventListener(win$, "mouseout", onLeave, { passive: true });
  createEventListener(doc$, "mouseleave", onLeave, { passive: true });
  createEventListener(doc$, "mouseenter", onEnter, { passive: true });

  return isLeft$ as ReadonlyObservable<boolean>;
}
