import { observable } from "@legendapp/state";
import { type Fn, onUnmount, peek } from "@usels/core";
import type { DeepMaybeObservable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

const DEFAULT_DELAY = 500;
const DEFAULT_THRESHOLD = 10;

export interface UseOnLongPressModifiers {
  /** Call `stopPropagation()` on pointer events */
  stop?: boolean;
  /** Remove listeners after the first long press cycle */
  once?: boolean;
  /** Call `preventDefault()` on pointer events */
  prevent?: boolean;
  /** Use capturing phase for event listeners */
  capture?: boolean;
  /** Only trigger when `event.target` is the element itself */
  self?: boolean;
}

export interface UseOnLongPressOptions {
  /**
   * Time in ms till `longpress` gets called
   * @default 500
   */
  delay?: number;
  /**
   * Allowance of moving distance in pixels.
   * The action will get canceled when moving too far from the pointerdown position.
   * Set to `false` to disable distance checking.
   * @default 10
   */
  distanceThreshold?: number | false;
  /**
   * Event modifiers
   */
  modifiers?: UseOnLongPressModifiers;
  /**
   * Function called when the element is released.
   * @param duration - How long the element was pressed in ms
   * @param distance - Distance from the pointerdown position
   * @param isLongPress - Whether the action was a long press or not
   * @param event - The native PointerEvent
   */
  onMouseUp?: (
    duration: number,
    distance: number,
    isLongPress: boolean,
    event: PointerEvent
  ) => void;
}

/**
 * Framework-agnostic long press gesture detector.
 *
 * Listens for `pointerdown`/`pointermove`/`pointerup`/`pointerleave` events
 * and fires the handler callback after the configured delay when held.
 *
 * @param target - The element to detect long presses on
 * @param handler - Callback fired when a long press is detected
 * @param options - Configuration options
 * @returns A stop function that removes all event listeners and clears timers
 */
export function createOnLongPress(
  target: MaybeEventTarget,
  handler: (evt: PointerEvent) => void,
  options?: DeepMaybeObservable<UseOnLongPressOptions>
): Fn {
  const opts$ = observable(options);

  // Timer state — closure variables cleaned up in onUnmount
  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
  let posStart: { x: number; y: number } | undefined = undefined;
  let startTimestamp: number | undefined = undefined;
  let hasLongPressed = false;

  const clear = () => {
    if (timeout != null) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    posStart = undefined;
    startTimestamp = undefined;
    hasLongPressed = false;
  };

  const onDown = (ev: PointerEvent) => {
    const opts = opts$.peek();
    const el = peek(target);

    if (opts?.modifiers?.self && ev.target !== el) return;

    clear();

    if (opts?.modifiers?.prevent) ev.preventDefault();
    if (opts?.modifiers?.stop) ev.stopPropagation();

    posStart = { x: ev.clientX, y: ev.clientY };
    startTimestamp = ev.timeStamp;

    const delay = opts?.delay ?? DEFAULT_DELAY;
    timeout = setTimeout(() => {
      hasLongPressed = true;
      handler(ev);
    }, delay);
  };

  const onMove = (ev: PointerEvent) => {
    const opts = opts$.peek();
    const el = peek(target);

    if (opts?.modifiers?.self && ev.target !== el) return;
    if (!posStart || opts?.distanceThreshold === false) return;

    if (opts?.modifiers?.prevent) ev.preventDefault();
    if (opts?.modifiers?.stop) ev.stopPropagation();

    const dx = ev.clientX - posStart.x;
    const dy = ev.clientY - posStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= (opts?.distanceThreshold ?? DEFAULT_THRESHOLD)) {
      clear();
    }
  };

  const onRelease = (ev: PointerEvent) => {
    const opts = opts$.peek();
    const el = peek(target);
    const _startTimestamp = startTimestamp;
    const _posStart = posStart;
    const _hasLongPressed = hasLongPressed;

    clear();

    if (!opts?.onMouseUp || !_posStart || _startTimestamp == null) return;
    if (opts?.modifiers?.self && ev.target !== el) return;
    if (opts?.modifiers?.prevent) ev.preventDefault();
    if (opts?.modifiers?.stop) ev.stopPropagation();

    const dx = ev.clientX - _posStart.x;
    const dy = ev.clientY - _posStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    opts.onMouseUp(ev.timeStamp - _startTimestamp, distance, _hasLongPressed, ev);
  };

  // Read listener options at construction time (modifiers.capture/once are structural)
  const raw = opts$.peek();
  const listenerOptions: AddEventListenerOptions = {
    capture: raw?.modifiers?.capture,
    once: raw?.modifiers?.once,
  };

  const stopDown = createEventListener(
    target,
    "pointerdown",
    onDown as EventListener,
    listenerOptions
  );
  const stopMove = createEventListener(
    target,
    "pointermove",
    onMove as EventListener,
    listenerOptions
  );
  const stopUp = createEventListener(
    target,
    "pointerup",
    onRelease as EventListener,
    listenerOptions
  );
  const stopLeave = createEventListener(
    target,
    "pointerleave",
    onRelease as EventListener,
    listenerOptions
  );

  const stop: Fn = () => {
    clear();
    stopDown();
    stopMove();
    stopUp();
    stopLeave();
  };

  onUnmount(clear);

  return stop;
}
