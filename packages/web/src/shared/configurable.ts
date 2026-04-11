import { isClient } from "@usels/core/shared/utils";
import type { Ref$ } from "@usels/core";
import { observable, ObservableHint, type Observable, type OpaqueObject } from "@legendapp/state";

/** Window를 resolve할 수 있는 소스 타입 */
export type WindowSource = Window | Ref$<HTMLIFrameElement>;

export interface ConfigurableWindow {
  /*
   * Specify a custom `window` instance, e.g. working with iframes or in testing environments.
   *
   * Accepts a plain `Window`, a `Ref$<HTMLIFrameElement>` (reactive), or
   * an `Observable<OpaqueObject<HTMLIFrameElement> | null>`.
   */
  window?: WindowSource;
}

export interface ConfigurableDocumentOrShadowRoot {
  document?: DocumentOrShadowRoot;
}

export const defaultWindow = /* #__PURE__ */ isClient ? window : undefined;

export const defaultDocument = /* #__PURE__ */ isClient ? window.document : undefined;

export const defaultNavigator = /* #__PURE__ */ isClient ? window.navigator : undefined;

export const defaultLocation = /* #__PURE__ */ isClient ? window.location : undefined;

/**
 * Internal raw resolver: takes the plain value held by an `opts$.window`
 * field and returns the real `Window` reference.
 *
 * Handles:
 * - `null` / `undefined` → `defaultWindow` (SSR-safe: `undefined`)
 * - plain `Window` → identity
 * - `OpaqueObject<Window>` → identity (opaque is only a Legend-State marker; `valueOf()` returns the window)
 * - `OpaqueObject<HTMLIFrameElement>` → `iframe.contentWindow` (or `undefined` if detached)
 *
 * Intentionally duck-typed on `.valueOf()` so plain and opaque-wrapped values
 * both work without importing `@legendapp/state` behavior.
 */
function resolveWindowRaw(raw: unknown): Window | undefined {
  if (raw == null) return defaultWindow;
  const val =
    typeof (raw as { valueOf?: () => unknown }).valueOf === "function"
      ? (raw as { valueOf: () => unknown }).valueOf()
      : raw;
  if (typeof HTMLIFrameElement !== "undefined" && val instanceof HTMLIFrameElement) {
    return val.contentWindow ?? undefined;
  }
  return val as Window;
}

/**
 * Reactive `WindowSource` resolver. Given the `window` field of an options
 * observable (e.g. `opts$.window`), returns a computed
 * `Observable<OpaqueObject<Window> | null>` that recomputes whenever the
 * source observable changes (iframe ref mounting/unmounting, observable
 * options replacement, etc.).
 *
 * Usage inside a scope-based core:
 * ```ts
 * const win$ = resolveWindowSource(opts$.window);
 * const isSupported$ = createSupported(() => {
 *   const win = win$.get(); // reactive
 *   return !!win && "matchMedia" in win;
 * });
 * onMount(() => {
 *   const win = win$.peek(); // non-reactive snapshot at mount
 *   if (!win) return;
 *   // ...
 * });
 * ```
 *
 * The returned observable holds `null` when no window can be resolved (SSR,
 * detached iframe) and an opaque-wrapped `Window` otherwise. The opaque
 * wrapping prevents Legend-State from deep-proxying the `Window` object —
 * property access (`win.matchMedia`, `win.speechSynthesis`, etc.) still works
 * directly because `OpaqueObject<T>` is `T & { [symbolOpaque]: true }`.
 */
export function resolveWindowSource(
  source$: Observable<unknown>
): Observable<OpaqueObject<Window> | null> {
  return observable<OpaqueObject<Window> | null>(() => {
    const win = resolveWindowRaw(source$.get());
    return win ? ObservableHint.opaque(win) : null;
  });
}
