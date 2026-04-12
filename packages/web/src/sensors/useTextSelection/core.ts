import { batch, ObservableHint, observable, type OpaqueObject } from "@legendapp/state";
import {
  type DeepMaybeObservable,
  type MaybeObservable,
  type ReadonlyObservable,
  createDebounceFn,
  createThrottleFn,
} from "@usels/core";
import {
  type ConfigurableWindow,
  defaultDocument,
  resolveWindowSource,
} from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

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

function opaqueArray<T>(arr: T[]): OpaqueObject<{ items: T[] }> {
  return ObservableHint.opaque({ items: arr }) as OpaqueObject<{ items: T[] }>;
}

/**
 * Framework-agnostic reactive text-selection tracker. Listens to
 * `selectionchange` on the document and exposes the current selection's text,
 * ranges, rects (lazily computed), and raw `Selection` object.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createTextSelection(
  options?: DeepMaybeObservable<UseTextSelectionOptions>
): UseTextSelectionReturn {
  const opts$ = observable(options);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- window field type varies by hint map
  const window$ = resolveWindowSource(opts$.window as any);

  // Derive document from resolved window; fall back to defaultDocument.
  const doc$ = observable<OpaqueObject<Document> | null>(() => {
    const doc = window$.get()?.document ?? defaultDocument;
    return doc ? (ObservableHint.opaque(doc) as OpaqueObject<Document>) : null;
  });

  const text$ = observable("");
  const rangesBox$ = observable<OpaqueObject<{ items: Range[] }>>(
    ObservableHint.opaque({ items: [] }) as OpaqueObject<{ items: Range[] }>
  );
  const selection$ = observable<OpaqueObject<Selection> | null>(null);

  const invoke = () => {
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
  };

  // Mount-time selection: throttle/debounce/plain decided once at creation
  // time (the wrapper function itself is swapped at mount and kept stable).
  const raw = opts$.peek();
  const throttleMs = raw?.throttle;
  const debounceMs = raw?.debounce;

  let handler: (...args: unknown[]) => unknown = invoke;
  if (throttleMs !== undefined) {
    handler = createThrottleFn(invoke, throttleMs).throttledFn as typeof handler;
  } else if (debounceMs !== undefined) {
    handler = createDebounceFn(invoke, debounceMs).debouncedFn as typeof handler;
  }

  createEventListener(doc$, "selectionchange", handler as () => void, { passive: true });

  // Lazy computed — getBoundingClientRect runs only when rects$ is accessed.
  const rects$ = observable<DOMRect[]>(() =>
    (rangesBox$.get()?.items ?? []).map((range) => range.getBoundingClientRect())
  );
  const ranges$ = observable<Range[]>(() => rangesBox$.get()?.items ?? []);

  return {
    text$: text$ as ReadonlyObservable<string>,
    rects$: rects$ as ReadonlyObservable<DOMRect[]>,
    ranges$: ranges$ as ReadonlyObservable<Range[]>,
    selection$: selection$ as ReadonlyObservable<OpaqueObject<Selection> | null>,
  };
}
