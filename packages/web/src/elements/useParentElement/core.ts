import { type Observable, type OpaqueObject, ObservableHint, observable } from "@legendapp/state";
import { get, observe } from "@usels/core";
import type { MaybeEventTarget } from "../../types";

/**
 * Framework-agnostic reactive parent-element tracker.
 *
 * Tracks the `parentElement` of a DOM node. Accepts `Ref$`, `Observable<Element|null>`,
 * or a raw `Element`. When the input is a `Ref$` or `Observable`, the parent is
 * re-read reactively whenever the underlying element reference changes.
 *
 * > NOTE: For a plain (non-Observable) element, the parent is read at construction
 * > time only — subsequent DOM moves are not detected. Use `Ref$` or `Observable<Element>`
 * > for dynamic parent tracking.
 *
 * `Document` / `Window` have no `parentElement`, so they resolve to `null`.
 *
 * @returns `Observable<OpaqueObject<HTMLElement | SVGElement> | null>` — current parent, wrapped opaquely.
 */
export function createParentElement(
  element?: MaybeEventTarget
): Observable<OpaqueObject<HTMLElement | SVGElement> | null> {
  const parent$ = observable<OpaqueObject<HTMLElement | SVGElement> | null>(null);

  observe(() => {
    const el = element ? get(element) : null;
    // Document / Window have no parentElement → null (SSR-safe)
    const parent = (el as HTMLElement | null)?.parentElement ?? null;
    parent$.set(
      parent ? ObservableHint.opaque(parent as unknown as HTMLElement | SVGElement) : null
    );
  });

  return parent$;
}
