"use client";
import { useCallback, useRef } from "react";
import type { Fn } from "@usels/core";
import { peekElement, useMaybeObservable, type MaybeElement } from "@usels/core";
import { useEventListener } from "@browser/useEventListener";
import { useConstant } from "@usels/core/shared/useConstant";
import { useLatest } from "@usels/core/shared/useLatest";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { isIOS, noop } from "@usels/core/shared/utils";

export interface OnClickOutsideOptions<
  Controls extends boolean = false,
> extends ConfigurableWindow {
  /**
   * List of elements or CSS selectors that should not trigger the handler.
   */
  ignore?: (string | MaybeElement)[];
  /**
   * Use capturing phase for internal event listener.
   * @default true
   */
  capture?: boolean;
  /**
   * Run handler function if focus moves to an iframe.
   * @default false
   */
  detectIframe?: boolean;
  /**
   * Return control functions (`stop`, `cancel`, `trigger`) instead of just `stop`.
   * @default false
   */
  controls?: Controls;
}

export type OnClickOutsideHandler<
  T extends { detectIframe?: boolean; controls?: boolean } = {
    detectIframe: false;
    controls: false;
  },
> = (
  event:
    | (T["detectIframe"] extends true ? FocusEvent : never)
    | (T["controls"] extends true ? Event : never)
    | PointerEvent
) => void;

export interface OnClickOutsideReturn {
  /** Remove all event listeners */
  stop: Fn;
  /** Prevent the next outside click from triggering the handler */
  cancel: Fn;
  /** Manually trigger the handler with a given event */
  trigger: (event: Event) => void;
}

let _iOSWorkaround = false;

// ---------------------------------------------------------------------------
// Overloads
// ---------------------------------------------------------------------------

/**
 * Listen for clicks outside of a target element.
 *
 * @param target - The element to detect clicks outside of
 * @param handler - Callback fired when a click outside is detected
 * @param options - Configuration options
 * @returns A stop function that removes all event listeners
 */
export function useOnClickOutside<T extends OnClickOutsideOptions<false>>(
  target: MaybeElement,
  handler: OnClickOutsideHandler<T>,
  options?: T
): Fn;

/**
 * Listen for clicks outside of a target element (controls mode).
 *
 * @param target - The element to detect clicks outside of
 * @param handler - Callback fired when a click outside is detected
 * @param options - Configuration options with `controls: true`
 * @returns `{ stop, cancel, trigger }` control object
 */
export function useOnClickOutside<T extends OnClickOutsideOptions<true>>(
  target: MaybeElement,
  handler: OnClickOutsideHandler<T>,
  options: T
): OnClickOutsideReturn;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function useOnClickOutside(
  target: MaybeElement,
  handler: OnClickOutsideHandler<OnClickOutsideOptions<boolean>>,
  options: OnClickOutsideOptions<boolean> = {}
): Fn | OnClickOutsideReturn {
  // capture is mount-time-only — useEventListener captures options at registration
  const { capture = true, detectIframe = false, controls = false } = options;

  const handlerRef = useLatest(handler);
  const ignoreRef = useLatest(options.ignore);
  const detectIframeRef = useLatest(detectIframe);

  // useRef (not useLatest) for mutable flags — these are toggled synchronously
  // within event handlers on a hot path; useLatest would add unnecessary overhead.
  const shouldListenRef = useRef(true);
  const isProcessingRef = useRef(false);
  // cancel() sets this — prevents the next click even if pointerdown resets shouldListen
  const cancelledRef = useRef(false);

  const windowOpts$ = useMaybeObservable<ConfigurableWindow>(
    { window: options.window },
    { window: "element" }
  );
  const window$ = useResolvedWindow(windowOpts$.window);

  // iOS workaround — passive click listeners on body children
  // https://github.com/vueuse/vueuse/issues/1520
  useConstant(() => {
    const win = window$.peek();
    if (win && isIOS && !_iOSWorkaround) {
      _iOSWorkaround = true;
      const listenerOptions = { passive: true };
      Array.from(win.document.body.children).forEach((el) =>
        el.addEventListener("click", noop, listenerOptions)
      );
      win.document.documentElement.addEventListener("click", noop, listenerOptions);
    }
  });

  const shouldIgnore = useCallback((event: Event): boolean => {
    const list = ignoreRef.current;
    if (!list?.length) return false;
    return list.some((item) => {
      if (typeof item === "string") {
        return Array.from(window$.peek()?.document?.querySelectorAll(item) ?? []).some(
          (el) => el === event.target || event.composedPath().includes(el)
        );
      }
      const el = peekElement(item);
      return (
        el && el instanceof Element && (event.target === el || event.composedPath().includes(el))
      );
    });
  }, []);

  const listener = useCallback((event: Event) => {
    const el = peekElement(target);

    if (event.target == null) return;
    if (!el || !(el instanceof Element)) return;
    if (el === event.target || event.composedPath().includes(el)) return;

    // detail === 0 means keyboard-triggered click — check ignore at this point
    if ("detail" in event && (event as PointerEvent).detail === 0) {
      shouldListenRef.current = !shouldIgnore(event);
    }

    if (!shouldListenRef.current || cancelledRef.current) {
      shouldListenRef.current = true;
      cancelledRef.current = false;
      return;
    }

    handlerRef.current(event as PointerEvent);
  }, []);

  // Collect cleanup functions returned by useEventListener into a stable container.
  // Writing during render is intentional — these are cleanup thunks, not render-affecting state.
  const cleanups = useRef<Array<() => void>>([]);

  // Main click listener
  // eslint-disable-next-line react-hooks/refs -- collecting cleanup thunks, not render state
  cleanups.current[0] = useEventListener(
    window$,
    "click",
    useCallback((event: PointerEvent) => {
      if (!isProcessingRef.current) {
        isProcessingRef.current = true;
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 0);
        listener(event);
      }
    }, []),
    { passive: true, capture }
  );

  // Pointerdown — track whether the click started inside
  // eslint-disable-next-line react-hooks/refs -- collecting cleanup thunks, not render state
  cleanups.current[1] = useEventListener(
    window$,
    "pointerdown",
    useCallback((e: PointerEvent) => {
      const el = peekElement(target);
      shouldListenRef.current =
        !shouldIgnore(e) && !!(el && el instanceof Element && !e.composedPath().includes(el));
    }, []),
    { passive: true }
  );

  // Iframe blur detection — always registered, guards internally via detectIframeRef
  // eslint-disable-next-line react-hooks/refs -- collecting cleanup thunks, not render state
  cleanups.current[2] = useEventListener(
    window$,
    "blur",
    useCallback((event: FocusEvent) => {
      if (!detectIframeRef.current) return;
      setTimeout(() => {
        const win = window$.peek();
        if (!win) return;
        const el = peekElement(target);
        if (
          win.document.activeElement?.tagName === "IFRAME" &&
          el instanceof Element &&
          !el.contains(win.document.activeElement)
        ) {
          handlerRef.current(event as PointerEvent);
        }
      }, 0);
    }, []),
    { passive: true }
  );

  // Stable stop function — removes all event listeners
  const stop = useConstant<Fn>(() => () => {
    cleanups.current.forEach((fn) => fn());
  });

  // Stable cancel function — prevents the next outside click from triggering
  const cancel = useConstant<Fn>(() => () => {
    cancelledRef.current = true;
  });

  // Stable trigger function — manually invokes the handler, bypassing guards
  const trigger = useConstant<(event: Event) => void>(() => (event: Event) => {
    handlerRef.current(event as PointerEvent);
  });

  // Always build the result object (hooks must be called unconditionally)
  const controlsResult = useConstant<OnClickOutsideReturn>(() => ({
    stop,
    cancel,
    trigger,
  }));

  return controls ? controlsResult : stop;
}
