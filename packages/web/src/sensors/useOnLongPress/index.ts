"use client";
import { useRef, useCallback } from "react";
import type { Fn } from "@usels/core";
import { peek } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { useConstant } from "@usels/core/shared/useConstant";
import { useLatest } from "@usels/core/shared/useLatest";
import { useEventListener } from "@browser/useEventListener";

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
 * Listen for long press gestures on an element.
 *
 * @param target - The element to detect long presses on
 * @param handler - Callback fired when a long press is detected
 * @param options - Configuration options
 * @returns A stop function that removes all event listeners and clears timers
 */
export function useOnLongPress(
  target: MaybeEventTarget,
  handler: (evt: PointerEvent) => void,
  options: UseOnLongPressOptions = {}
): Fn {
  const handlerRef = useLatest(handler);
  const optionsRef = useLatest(options);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const posStartRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const startTimestampRef = useRef<number | undefined>(undefined);
  const hasLongPressedRef = useRef(false);

  const clear = useConstant<Fn>(() => () => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    posStartRef.current = undefined;
    startTimestampRef.current = undefined;
    hasLongPressedRef.current = false;
  });

  const onDown = useCallback((ev: PointerEvent) => {
    const opts = optionsRef.current;
    const el = peek(target);

    if (opts.modifiers?.self && ev.target !== el) return;

    clear();

    if (opts.modifiers?.prevent) ev.preventDefault();
    if (opts.modifiers?.stop) ev.stopPropagation();

    posStartRef.current = { x: ev.x, y: ev.y };
    startTimestampRef.current = ev.timeStamp;

    const delay = opts.delay ?? DEFAULT_DELAY;
    timeoutRef.current = setTimeout(() => {
      hasLongPressedRef.current = true;
      handlerRef.current(ev);
    }, delay);
  }, []);

  const onMove = useCallback((ev: PointerEvent) => {
    const opts = optionsRef.current;
    const el = peek(target);

    if (opts.modifiers?.self && ev.target !== el) return;
    if (!posStartRef.current || opts.distanceThreshold === false) return;

    if (opts.modifiers?.prevent) ev.preventDefault();
    if (opts.modifiers?.stop) ev.stopPropagation();

    const dx = ev.x - posStartRef.current.x;
    const dy = ev.y - posStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= (opts.distanceThreshold ?? DEFAULT_THRESHOLD)) {
      clear();
    }
  }, []);

  const onRelease = useCallback((ev: PointerEvent) => {
    const opts = optionsRef.current;
    const el = peek(target);
    const _startTimestamp = startTimestampRef.current;
    const _posStart = posStartRef.current;
    const _hasLongPressed = hasLongPressedRef.current;

    clear();

    if (!opts.onMouseUp || !_posStart || _startTimestamp == null) return;
    if (opts.modifiers?.self && ev.target !== el) return;
    if (opts.modifiers?.prevent) ev.preventDefault();
    if (opts.modifiers?.stop) ev.stopPropagation();

    const dx = ev.x - _posStart.x;
    const dy = ev.y - _posStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    opts.onMouseUp(ev.timeStamp - _startTimestamp, distance, _hasLongPressed, ev);
  }, []);

  const listenerOptions: AddEventListenerOptions = {
    capture: options.modifiers?.capture,
    once: options.modifiers?.once,
  };

  // Collect cleanup functions returned by useEventListener into a stable container.
  const cleanups = useRef<Array<() => void>>([]);

  // eslint-disable-next-line react-hooks/refs -- collecting cleanup thunks, not render state
  cleanups.current[0] = useEventListener(target, "pointerdown", onDown, listenerOptions);
  // eslint-disable-next-line react-hooks/refs -- collecting cleanup thunks, not render state
  cleanups.current[1] = useEventListener(target, "pointermove", onMove, listenerOptions);
  // eslint-disable-next-line react-hooks/refs -- collecting cleanup thunks, not render state
  cleanups.current[2] = useEventListener(target, "pointerup", onRelease, listenerOptions);
  // eslint-disable-next-line react-hooks/refs -- collecting cleanup thunks, not render state
  cleanups.current[3] = useEventListener(target, "pointerleave", onRelease, listenerOptions);

  return useConstant<Fn>(() => () => {
    clear();
    cleanups.current.forEach((fn) => fn());
  });
}
