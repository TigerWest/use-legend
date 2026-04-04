"use client";
import { useMount, useObservable, useUnmount } from "@legendapp/state/react";
import { useRef } from "react";
import { get, useOpaque, type MaybeObservable, type ReadonlyObservable } from "@usels/core";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultDocument } from "@shared/configurable";

export interface UseScriptTagOptions {
  /**
   * Load the script immediately on mount
   * @default true
   */
  immediate?: boolean;
  /**
   * Set the script element's async attribute
   * @default true
   */
  async?: boolean;
  /**
   * Script MIME type
   * @default "text/javascript"
   */
  type?: string;
  /**
   * Manual control — if true, load/unload are not called automatically on mount/unmount
   * @default false
   */
  manual?: boolean;
  crossOrigin?: "anonymous" | "use-credentials";
  referrerPolicy?: ReferrerPolicy;
  noModule?: boolean;
  defer?: boolean;
  /** Additional attributes to set on the script element */
  attrs?: Record<string, string>;
  nonce?: string;
  /** Custom document instance (useful for iframes or testing) */
  document?: Document;
}

export interface UseScriptTagReturn {
  scriptTag$: ReadonlyObservable<HTMLScriptElement | null>;
  /** True once the script's `load` event has fired (or a pre-loaded element was found). Resets to false on unload(). */
  isLoaded$: ReadonlyObservable<boolean>;
  load: (waitForScriptLoad?: boolean) => Promise<HTMLScriptElement | boolean>;
  unload: () => void;
}

export function useScriptTag(
  src: MaybeObservable<string>,
  onLoaded: (el: HTMLScriptElement) => void = () => {},
  options: UseScriptTagOptions = {}
): UseScriptTagReturn {
  const {
    immediate = true,
    manual = false,
    type = "text/javascript",
    async: asyncAttr = true,
    crossOrigin,
    referrerPolicy,
    noModule,
    defer,
    document: _document = defaultDocument,
    attrs = {},
    nonce,
  } = options;

  const scriptTag$ = useOpaque<HTMLScriptElement | null>(null);
  const isLoaded$ = useObservable(false);
  const promiseRef = useRef<Promise<HTMLScriptElement | boolean> | null>(null);

  // Stable reference — options are mount-time-only, captured in closure once.
  const loadScript = useConstant(
    () =>
      (waitForScriptLoad: boolean): Promise<HTMLScriptElement | boolean> =>
        new Promise((resolve, reject) => {
          if (!_document) {
            resolve(false);
            return;
          }

          const srcValue = get(src);
          let shouldAppend = false;
          let el = _document.querySelector<HTMLScriptElement>(`script[src="${srcValue}"]`);

          if (!el) {
            el = _document.createElement("script");
            el.type = type;
            el.async = asyncAttr;
            el.src = srcValue;

            if (defer) el.defer = defer;
            if (crossOrigin) el.crossOrigin = crossOrigin;
            if (noModule) el.noModule = noModule;
            if (referrerPolicy) el.referrerPolicy = referrerPolicy;
            if (nonce) el.nonce = nonce;

            Object.entries(attrs).forEach(([name, value]) => el!.setAttribute(name, value));
            shouldAppend = true;
          } else if (el.hasAttribute("data-loaded")) {
            scriptTag$.set(el);
            isLoaded$.set(true);
            resolve(el);
            return;
          }

          const resolveWithElement = (scriptEl: HTMLScriptElement) => {
            scriptTag$.set(scriptEl);
            resolve(scriptEl);
          };

          el.addEventListener("error", (event) => reject(event), { passive: true });
          el.addEventListener("abort", (event) => reject(event), { passive: true });
          el.addEventListener(
            "load",
            () => {
              el!.setAttribute("data-loaded", "true");
              isLoaded$.set(true);
              onLoaded(el!);
              resolveWithElement(el!);
            },
            { passive: true }
          );

          if (shouldAppend) el = _document.head.appendChild(el);
          if (!waitForScriptLoad) resolveWithElement(el);
        })
  );

  const load = useConstant(
    () =>
      (waitForScriptLoad = true): Promise<HTMLScriptElement | boolean> => {
        if (!promiseRef.current) {
          promiseRef.current = loadScript(waitForScriptLoad);
        }
        return promiseRef.current;
      }
  );

  const unload = useConstant(() => () => {
    if (!_document) return;
    promiseRef.current = null;
    scriptTag$.set(null);
    isLoaded$.set(false);
    const el = _document.querySelector<HTMLScriptElement>(`script[src="${get(src)}"]`);
    if (el) _document.head.removeChild(el);
  });

  useMount(() => {
    if (immediate && !manual) load();
  });

  useUnmount(() => {
    if (!manual) unload();
  });

  return {
    scriptTag$: scriptTag$ as ReadonlyObservable<HTMLScriptElement | null>,
    isLoaded$: isLoaded$ as ReadonlyObservable<boolean>,
    load,
    unload,
  };
}
