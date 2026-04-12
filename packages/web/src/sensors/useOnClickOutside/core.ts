import { peek, type DeepMaybeObservable, type Fn } from "@usels/core";
import { isIOS, noop } from "@usels/core/shared/utils";
import { type ConfigurableWindow, defaultWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export interface OnClickOutsideOptions<
  Controls extends boolean = false,
> extends ConfigurableWindow {
  /**
   * List of elements or CSS selectors that should not trigger the handler.
   */
  ignore?: (string | MaybeEventTarget)[];
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

export function createOnClickOutside<T extends OnClickOutsideOptions<false>>(
  target: MaybeEventTarget,
  handler: OnClickOutsideHandler<T>,
  options?: T
): Fn;

export function createOnClickOutside<T extends OnClickOutsideOptions<true>>(
  target: MaybeEventTarget,
  handler: OnClickOutsideHandler<T>,
  options: T
): OnClickOutsideReturn;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createOnClickOutside(
  target: MaybeEventTarget,
  handler: OnClickOutsideHandler<OnClickOutsideOptions<boolean>>,
  options: DeepMaybeObservable<OnClickOutsideOptions<boolean>> = {}
): Fn | OnClickOutsideReturn {
  const raw = peek(options) as OnClickOutsideOptions<boolean> | undefined;
  const capture = raw?.capture ?? true;
  const controls = raw?.controls ?? false;
  const detectIframe = raw?.detectIframe ?? false;
  const ignore = raw?.ignore;

  // Mutable flags — toggled synchronously within event handlers on a hot path.
  let shouldListen = true;
  let isProcessing = false;
  // cancel() sets this — prevents the next click even if pointerdown resets shouldListen.
  let cancelled = false;

  // iOS workaround — passive click listeners on body children
  // https://github.com/vueuse/vueuse/issues/1520
  if (defaultWindow && isIOS && !_iOSWorkaround) {
    _iOSWorkaround = true;
    const listenerOptions = { passive: true };
    Array.from(defaultWindow.document.body.children).forEach((el) =>
      el.addEventListener("click", noop, listenerOptions)
    );
    defaultWindow.document.documentElement.addEventListener("click", noop, listenerOptions);
  }

  const shouldIgnore = (event: Event): boolean => {
    if (!ignore?.length) return false;
    return ignore.some((item) => {
      if (typeof item === "string") {
        return Array.from(defaultWindow?.document?.querySelectorAll(item) ?? []).some(
          (el) => el === event.target || event.composedPath().includes(el)
        );
      }
      const el = peek(item);
      return (
        el && el instanceof Element && (event.target === el || event.composedPath().includes(el))
      );
    });
  };

  const listener = (event: Event) => {
    const el = peek(target);

    if (event.target == null) return;
    if (!el || !(el instanceof Element)) return;
    if (el === event.target || event.composedPath().includes(el)) return;

    // detail === 0 means keyboard-triggered click — check ignore at this point
    if ("detail" in event && (event as PointerEvent).detail === 0) {
      shouldListen = !shouldIgnore(event);
    }

    if (!shouldListen || cancelled) {
      shouldListen = true;
      cancelled = false;
      return;
    }

    handler(event as PointerEvent);
  };

  const win = (defaultWindow as MaybeEventTarget) ?? null;

  // Main click listener
  const clickCleanup = createEventListener(
    win,
    "click",
    (event: PointerEvent) => {
      if (!isProcessing) {
        isProcessing = true;
        setTimeout(() => {
          isProcessing = false;
        }, 0);
        listener(event);
      }
    },
    { passive: true, capture }
  );

  // Pointerdown — track whether the click started inside
  const pointerCleanup = createEventListener(
    win,
    "pointerdown",
    (e: PointerEvent) => {
      const el = peek(target);
      shouldListen =
        !shouldIgnore(e) && !!(el && el instanceof Element && !e.composedPath().includes(el));
    },
    { passive: true }
  );

  // Iframe blur detection
  const blurCleanup = createEventListener(
    win,
    "blur",
    (event: FocusEvent) => {
      if (!detectIframe) return;
      setTimeout(() => {
        if (!defaultWindow) return;
        const el = peek(target);
        if (
          defaultWindow.document.activeElement?.tagName === "IFRAME" &&
          el instanceof Element &&
          !el.contains(defaultWindow.document.activeElement)
        ) {
          handler(event as unknown as PointerEvent);
        }
      }, 0);
    },
    { passive: true }
  );

  const stop: Fn = () => {
    clickCleanup();
    pointerCleanup();
    blurCleanup();
  };

  const cancel: Fn = () => {
    cancelled = true;
  };

  const trigger = (event: Event) => {
    handler(event as PointerEvent);
  };

  return controls ? { stop, cancel, trigger } : stop;
}
