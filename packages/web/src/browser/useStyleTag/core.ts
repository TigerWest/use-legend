import { observable, type Observable } from "@legendapp/state";
import {
  get,
  createObserve,
  onMount,
  onUnmount,
  type DeepMaybeObservable,
  type MaybeObservable,
  type ReadonlyObservable,
} from "@usels/core";
import { defaultDocument } from "@shared/configurable";

export interface UseStyleTagOptions {
  /**
   * Style tag id
   * @default auto-generated
   */
  id?: string;
  /**
   * CSS media query
   */
  media?: string;
  /**
   * Load the style tag immediately on mount
   * @default true
   */
  immediate?: boolean;
  /**
   * Manual mode — load/unload are not called automatically on mount/unmount
   * @default false
   */
  manual?: boolean;
  /**
   * Nonce attribute for Content Security Policy
   */
  nonce?: string;
  /**
   * Custom document instance (useful for iframes or testing)
   */
  document?: Document;
}

export interface UseStyleTagReturn {
  id: string;
  /** CSS content — update to change injected styles dynamically */
  css$: Observable<string>;
  isLoaded$: ReadonlyObservable<boolean>;
  load: () => void;
  unload: () => void;
}

let _counter = 0;

/**
 * Framework-agnostic dynamic `<style>` tag injector. Appends a style element
 * into `document.head` and keeps its `textContent` in sync with `css$`.
 *
 * @param css - Initial CSS content (`MaybeObservable<string>` — kept in sync with `css$`).
 * @param options - Mount-time-only options (id, media, immediate, manual, nonce, document).
 */
export function createStyleTag(
  css: MaybeObservable<string>,
  options?: DeepMaybeObservable<UseStyleTagOptions>
): UseStyleTagReturn {
  const opts$ = observable(options);
  const {
    id = `usels_style_${++_counter}`,
    nonce,
    media,
    document: _document = defaultDocument,
  } = opts$.peek() ?? {};

  const isLoaded$ = observable(false);
  const css$ = observable<string>(get(css));

  let styleTag: HTMLStyleElement | null = null;

  // Sync prop css → css$ (reactive when css is Observable, runs once for plain string)
  createObserve(() => {
    css$.set(get(css));
  });

  // Sync css$ changes → DOM
  createObserve(() => {
    const cssValue = css$.get();
    if (styleTag) styleTag.textContent = cssValue;
  });

  const load = (): void => {
    if (!_document) return;

    let el = _document.getElementById(id) as HTMLStyleElement | null;

    if (!el) {
      el = _document.createElement("style");
      el.id = id;
      if (nonce) el.nonce = nonce;
      if (media) el.media = media;
      el.textContent = css$.peek();
      _document.head.appendChild(el);
    }

    styleTag = el;
    isLoaded$.set(true);
  };

  const unload = (): void => {
    if (!_document || !styleTag) return;
    styleTag.remove();
    styleTag = null;
    isLoaded$.set(false);
  };

  onMount(() => {
    const { immediate = true, manual = false } = opts$.peek() ?? {};
    if (immediate && !manual) load();
  });

  onUnmount(() => {
    if (!(opts$.peek()?.manual ?? false)) unload();
  });

  return {
    id,
    css$,
    isLoaded$: isLoaded$ as ReadonlyObservable<boolean>,
    load,
    unload,
  };
}
