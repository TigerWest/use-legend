import { isClient } from "@usels/core/shared/utils";
import type { Ref$ } from "@usels/core";

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
 * Framework-agnostic resolver for a raw `WindowSource`-like value.
 *
 * Accepts the value that comes out of an `opts$.window` field (after the
 * `'opaque'` hint has unwrapped the outer Observable layer) and returns the
 * real `Window` reference.
 *
 * Handles:
 * - `null` / `undefined` → `defaultWindow` (SSR-safe: `undefined`)
 * - plain `Window` → identity (default `Object.prototype.valueOf` is a no-op)
 * - `OpaqueObject<Window>` → identity (opaque is only a Legend-State marker; `valueOf()` returns the window)
 * - `OpaqueObject<HTMLIFrameElement>` → `iframe.contentWindow` (or `undefined` if detached)
 *
 * Intentionally duck-typed on `.valueOf()` to work with both plain values and
 * Legend-State opaque-wrapped values without importing `@legendapp/state`.
 */
export function resolveWindowSource(raw: unknown): Window | undefined {
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
