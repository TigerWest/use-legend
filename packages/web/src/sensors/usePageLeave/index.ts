"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useObservable } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultDocument, defaultWindow } from "@usels/core/shared/configurable";
import { useEventListener } from "@browser/useEventListener";

/*@__NO_SIDE_EFFECTS__*/
export function usePageLeave(): ReadonlyObservable<boolean> {
  const isLeft$ = useObservable(false);

  const onLeave = useConstant(() => (event: MouseEvent) => {
    // relatedTarget is null when the cursor leaves the document
    const from =
      event.relatedTarget || (event as MouseEvent & { toElement?: EventTarget | null }).toElement;
    isLeft$.set(!from);
  });

  const onEnter = useConstant(() => () => {
    isLeft$.set(false);
  });

  useEventListener(defaultWindow, "mouseout", onLeave, { passive: true });
  useEventListener(defaultDocument, "mouseleave", onLeave, { passive: true });
  useEventListener(defaultDocument, "mouseenter", onEnter, { passive: true });

  return isLeft$;
}
