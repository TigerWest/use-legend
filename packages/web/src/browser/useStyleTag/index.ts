"use client";
import type { Observable } from "@legendapp/state";
import { useMount, useObservable, useObserveEffect, useUnmount } from "@legendapp/state/react";
import { useRef } from "react";
import { get, type MaybeObservable, type ReadonlyObservable } from "@usels/core";
import { useConstant } from "@usels/core/shared/useConstant";
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

export function useStyleTag(
  css: MaybeObservable<string>,
  options: UseStyleTagOptions = {}
): UseStyleTagReturn {
  const {
    immediate = true,
    manual = false,
    id = `usels_style_${++_counter}`,
    nonce,
    media,
    document: _document = defaultDocument,
  } = options;

  const styleTagRef = useRef<HTMLStyleElement | null>(null);
  const isLoaded$ = useObservable(false);
  const css$ = useObservable<string>(get(css));

  // Sync prop css → css$ (reactive if css is Observable, runs once if plain string)
  useObserveEffect(() => {
    css$.set(get(css));
  });

  // Sync css$ changes → DOM
  useObserveEffect(() => {
    const cssValue = css$.get();
    if (styleTagRef.current) styleTagRef.current.textContent = cssValue;
  });

  const load = useConstant(() => () => {
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

    styleTagRef.current = el;
    isLoaded$.set(true);
  });

  const unload = useConstant(() => () => {
    if (!_document || !styleTagRef.current) return;
    styleTagRef.current.remove();
    styleTagRef.current = null;
    isLoaded$.set(false);
  });

  useMount(() => {
    if (immediate && !manual) load();
  });

  useUnmount(() => {
    if (!manual) unload();
  });

  return {
    id,
    css$,
    isLoaded$: isLoaded$ as ReadonlyObservable<boolean>,
    load,
    unload,
  };
}
