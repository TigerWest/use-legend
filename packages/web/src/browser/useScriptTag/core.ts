import { observable } from "@legendapp/state";
import {
  get,
  onMount,
  onUnmount,
  type DeepMaybeObservable,
  type MaybeObservable,
  type ReadonlyObservable,
} from "@usels/core";
import { createOpaque } from "@usels/core/reactivity/useOpaque/core";
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

/**
 * Framework-agnostic dynamic `<script>` loader. Appends an external script tag
 * to `document.head`, deduplicates by `src`, and tracks the load lifecycle.
 *
 * @param src - Script src (`MaybeObservable<string>` — read at load time).
 * @param onLoaded - Optional callback invoked once the script's `load` event fires.
 * @param options - Mount-time-only options (immediate, manual, attrs, etc.).
 */
export function createScriptTag(
  src: MaybeObservable<string>,
  onLoaded: (el: HTMLScriptElement) => void = () => {},
  options?: DeepMaybeObservable<UseScriptTagOptions>
): UseScriptTagReturn {
  const opts$ = observable(options);

  const scriptTag$ = createOpaque<HTMLScriptElement>(null);
  const isLoaded$ = observable(false);

  let promise: Promise<HTMLScriptElement | boolean> | null = null;

  const loadScript = (waitForScriptLoad: boolean): Promise<HTMLScriptElement | boolean> =>
    new Promise((resolve, reject) => {
      const {
        document: _document = defaultDocument,
        type = "text/javascript",
        async: asyncAttr = true,
        crossOrigin,
        referrerPolicy,
        noModule,
        defer,
        nonce,
        attrs = {},
      } = opts$.peek() ?? {};

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
    });

  const load = (waitForScriptLoad = true): Promise<HTMLScriptElement | boolean> => {
    if (!promise) {
      promise = loadScript(waitForScriptLoad);
    }
    return promise;
  };

  const unload = (): void => {
    const { document: _document = defaultDocument } = opts$.peek() ?? {};
    if (!_document) return;
    promise = null;
    scriptTag$.set(null);
    isLoaded$.set(false);
    const el = _document.querySelector<HTMLScriptElement>(`script[src="${get(src)}"]`);
    if (el) _document.head.removeChild(el);
  };

  onMount(() => {
    const opts = opts$.peek() ?? {};
    if ((opts.immediate ?? true) && !(opts.manual ?? false)) load();
  });

  onUnmount(() => {
    if (!(opts$.peek()?.manual ?? false)) unload();
  });

  return {
    scriptTag$: scriptTag$ as unknown as ReadonlyObservable<HTMLScriptElement | null>,
    isLoaded$: isLoaded$ as ReadonlyObservable<boolean>,
    load,
    unload,
  };
}
