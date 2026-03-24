"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useObservable } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { type ConfigurableWindow } from "@shared/configurable";
import { useEventListener } from "@browser/useEventListener";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useMaybeObservable } from "@usels/core";
import type { OpaqueObject } from "@legendapp/state";
import { ObservableHint } from "@legendapp/state";

export type UsePageLeaveOptions = ConfigurableWindow;

/*@__NO_SIDE_EFFECTS__*/
export function usePageLeave(options?: UsePageLeaveOptions): ReadonlyObservable<boolean> {
  const isLeft$ = useObservable(false);

  const windowOpts$ = useMaybeObservable<ConfigurableWindow>(options, { window: "element" });
  const window$ = useResolvedWindow(windowOpts$.window);
  const doc$ = useObservable<OpaqueObject<Document> | null>(() => {
    const doc = window$.get()?.document;
    return doc ? ObservableHint.opaque(doc) : null;
  });

  const onLeave = useConstant(() => (event: MouseEvent) => {
    // relatedTarget is null when the cursor leaves the document
    const from =
      event.relatedTarget || (event as MouseEvent & { toElement?: EventTarget | null }).toElement;
    isLeft$.set(!from);
  });

  const onEnter = useConstant(() => () => {
    isLeft$.set(false);
  });

  useEventListener(window$, "mouseout", onLeave, { passive: true });
  useEventListener(doc$, "mouseleave", onLeave, { passive: true });
  useEventListener(doc$, "mouseenter", onEnter, { passive: true });

  return isLeft$;
}
