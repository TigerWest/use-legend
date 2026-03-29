"use client";
import type { ReadonlyObservable, MaybeObservable } from "@usels/core";
import { useDebounceFn, useThrottleFn, useMaybeObservable } from "@usels/core";
import type { OpaqueObject } from "@legendapp/state";
import { ObservableHint, batch } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { type ConfigurableWindow, defaultDocument } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useEventListener } from "@browser/useEventListener";

export interface UseTextSelectionOptions extends ConfigurableWindow {
  /** Throttle selectionchange handler in ms. Mutually exclusive with debounce. */
  throttle?: MaybeObservable<number>;
  /** Debounce selectionchange handler in ms. Mutually exclusive with throttle. */
  debounce?: MaybeObservable<number>;
}

export interface UseTextSelectionReturn {
  /** Selected text content */
  text$: ReadonlyObservable<string>;
  /** Bounding rectangles of selected ranges */
  rects$: ReadonlyObservable<DOMRect[]>;
  /** Selection ranges */
  ranges$: ReadonlyObservable<Range[]>;
  /** Current Selection object */
  selection$: ReadonlyObservable<OpaqueObject<Selection> | null>;
}

function getRangesFromSelection(selection: Selection): Range[] {
  const rangeCount = selection.rangeCount ?? 0;
  return Array.from({ length: rangeCount }, (_, i) => selection.getRangeAt(i));
}

/** Wraps an array in an opaque object container. */
function opaqueArray<T>(arr: T[]): OpaqueObject<{ items: T[] }> {
  return ObservableHint.opaque({ items: arr }) as OpaqueObject<{ items: T[] }>;
}

/*@__NO_SIDE_EFFECTS__*/
export function useTextSelection(options?: UseTextSelectionOptions): UseTextSelectionReturn {
  const opts$ = useMaybeObservable<UseTextSelectionOptions>(options, {
    window: "element",
  });
  const window$ = useResolvedWindow(opts$.window);

  // Document: derive from resolved window, falling back to defaultDocument
  const doc$ = useObservable<OpaqueObject<Document> | null>(() => {
    const doc = window$.get()?.document ?? defaultDocument;
    return doc ? ObservableHint.opaque(doc) : null;
  });

  const text$ = useObservable("");
  const rangesBox$ = useObservable<OpaqueObject<{ items: Range[] }>>(
    ObservableHint.opaque({ items: [] }) as OpaqueObject<{ items: Range[] }>
  );
  const selection$ = useObservable<OpaqueObject<Selection> | null>(null);

  const invoke = useConstant(() => () => {
    const win = window$.peek();
    if (!win) return;
    const sel = win.getSelection();
    if (sel) {
      const r = getRangesFromSelection(sel);
      batch(() => {
        selection$.set(ObservableHint.opaque(sel));
        text$.set(sel.toString());
        rangesBox$.set(opaqueArray(r));
      });
    } else {
      batch(() => {
        selection$.set(null);
        text$.set("");
        rangesBox$.set(opaqueArray([]));
      });
    }
  });

  // Always create both to satisfy Rules of Hooks (no conditional hook calls)
  const throttledInvoke = useThrottleFn(invoke, options?.throttle ?? 200);
  const debouncedInvoke = useDebounceFn(invoke, options?.debounce ?? 200);

  // Select handler at mount-time based on which option was provided
  const onSelectionChange = useConstant(() =>
    options?.throttle !== undefined
      ? throttledInvoke
      : options?.debounce !== undefined
        ? debouncedInvoke
        : invoke
  );

  // Reactive: doc$ re-registers listener when document changes
  useEventListener(doc$, "selectionchange", onSelectionChange, { passive: true });

  // Lazy computed — getBoundingClientRect is only called when rects$ is accessed
  const rects$ = useObservable<DOMRect[]>(() =>
    (rangesBox$.get()?.items ?? []).map((range) => range.getBoundingClientRect())
  );
  const ranges$ = useObservable<Range[]>(() => rangesBox$.get()?.items ?? []);

  return {
    text$,
    rects$,
    ranges$,
    selection$,
  };
}
