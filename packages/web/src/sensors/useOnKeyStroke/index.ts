"use client";
import type { Fn } from "@usels/core";
import { useConstant } from "@usels/core/shared/useConstant";
import { useLatest } from "@usels/core/shared/useLatest";
import { useEventListener } from "@browser/useEventListener";
import { type ConfigurableWindow, defaultWindow } from "@shared/configurable";

export type KeyPredicate = (event: KeyboardEvent) => boolean;
export type KeyFilter = true | string | string[] | KeyPredicate;
export type KeyStrokeEventName = "keydown" | "keypress" | "keyup";

export interface UseOnKeyStrokeOptions extends ConfigurableWindow {
  /**
   * Event name to listen for.
   * @default "keydown"
   */
  eventName?: KeyStrokeEventName;
  /**
   * Event target.
   * @default window
   */
  target?: EventTarget | null;
  /**
   * Use passive event listener.
   * @default false
   */
  passive?: boolean;
  /**
   * Ignore repeated events when a key is held down.
   * @default false
   */
  dedupe?: boolean;
}

function createKeyPredicate(keyFilter: KeyFilter): KeyPredicate {
  if (typeof keyFilter === "function") return keyFilter;
  if (typeof keyFilter === "string") return (event: KeyboardEvent) => event.key === keyFilter;
  if (Array.isArray(keyFilter)) return (event: KeyboardEvent) => keyFilter.includes(event.key);
  // true — match everything
  return () => true;
}

// ---------------------------------------------------------------------------
// Overloads
// ---------------------------------------------------------------------------

/**
 * Listen for keyboard key strokes with key filtering.
 *
 * @param key - Key filter (string, string[], predicate, or `true` for all)
 * @param handler - Callback fired when a matching key event occurs
 * @param options - Configuration options
 * @returns A stop function that removes the event listener
 */
export function useOnKeyStroke(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options?: UseOnKeyStrokeOptions
): Fn;

/**
 * Listen for all keyboard key strokes.
 *
 * @param handler - Callback fired on every key event
 * @param options - Configuration options
 * @returns A stop function that removes the event listener
 */
export function useOnKeyStroke(
  handler: (event: KeyboardEvent) => void,
  options?: UseOnKeyStrokeOptions
): Fn;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function useOnKeyStroke(
  keyOrHandler: KeyFilter | ((event: KeyboardEvent) => void),
  handlerOrOptions?: ((event: KeyboardEvent) => void) | UseOnKeyStrokeOptions,
  optionsArg?: UseOnKeyStrokeOptions
): Fn {
  let key: KeyFilter;
  let handler: (event: KeyboardEvent) => void;
  let options: UseOnKeyStrokeOptions;

  if (
    typeof keyOrHandler === "function" &&
    (handlerOrOptions == null || typeof handlerOrOptions === "object")
  ) {
    // Overload: (handler, options?)
    key = true;
    handler = keyOrHandler as (event: KeyboardEvent) => void;
    options = (handlerOrOptions as UseOnKeyStrokeOptions) ?? {};
  } else {
    // Overload: (key, handler, options?)
    key = keyOrHandler as KeyFilter;
    handler = handlerOrOptions as (event: KeyboardEvent) => void;
    options = optionsArg ?? {};
  }

  const {
    target = defaultWindow,
    eventName = "keydown",
    passive = false,
    dedupe = false,
  } = options;

  const handlerRef = useLatest(handler);
  const dedupeRef = useLatest(dedupe);

  // Stable predicate — created once from the initial key filter.
  // Key filter is a mount-time concern (same as capture in useOnClickOutside).
  const predicate = useConstant(() => createKeyPredicate(key));

  const listener = useConstant(() => (e: KeyboardEvent) => {
    if (e.repeat && dedupeRef.current) return;
    if (predicate(e)) handlerRef.current(e);
  });

  // Collect cleanup returned by useEventListener into a stable container.
  const cleanupRef = useConstant<{ current: Fn }>(() => ({ current: () => {} }));
  // eslint-disable-next-line react-hooks/refs
  cleanupRef.current = useEventListener(target, eventName, listener, { passive });

  return useConstant<Fn>(() => () => {
    cleanupRef.current();
  });
}

// ---------------------------------------------------------------------------
// Convenience functions
// ---------------------------------------------------------------------------

/**
 * Listen for `keydown` events with key filtering.
 */
export function useOnKeyDown(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options: Omit<UseOnKeyStrokeOptions, "eventName"> = {}
): Fn {
  return useOnKeyStroke(key, handler, { ...options, eventName: "keydown" });
}

/**
 * Listen for `keypress` events with key filtering.
 */
export function useOnKeyPressed(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options: Omit<UseOnKeyStrokeOptions, "eventName"> = {}
): Fn {
  return useOnKeyStroke(key, handler, { ...options, eventName: "keypress" });
}

/**
 * Listen for `keyup` events with key filtering.
 */
export function useOnKeyUp(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options: Omit<UseOnKeyStrokeOptions, "eventName"> = {}
): Fn {
  return useOnKeyStroke(key, handler, { ...options, eventName: "keyup" });
}
