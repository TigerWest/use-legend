import { isClient } from "@usels/core/shared/utils";
import type { Ref$ } from "@usels/core";
import type { Observable, OpaqueObject } from "@legendapp/state";

/** Window를 resolve할 수 있는 소스 타입 */
export type WindowSource =
  | Window
  | Ref$<HTMLIFrameElement>
  | Observable<OpaqueObject<HTMLIFrameElement> | null>;

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
