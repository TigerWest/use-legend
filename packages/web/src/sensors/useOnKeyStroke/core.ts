import { observable } from "@legendapp/state";
import { type Fn, type DeepMaybeObservable, onUnmount } from "@usels/core";
import { type ConfigurableWindow, defaultWindow } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

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

export type UseOnKeyStrokeReturn = Fn;

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
 * Framework-agnostic keyboard key stroke listener with key filtering.
 *
 * @param key - Key filter (string, string[], predicate, or `true` for all)
 * @param handler - Callback fired when a matching key event occurs
 * @param options - Configuration options
 * @returns A stop function that removes the event listener
 */
export function createOnKeyStroke(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options?: DeepMaybeObservable<UseOnKeyStrokeOptions>
): UseOnKeyStrokeReturn;

/**
 * Framework-agnostic keyboard key stroke listener for all keys.
 *
 * @param handler - Callback fired on every key event
 * @param options - Configuration options
 * @returns A stop function that removes the event listener
 */
export function createOnKeyStroke(
  handler: (event: KeyboardEvent) => void,
  options?: DeepMaybeObservable<UseOnKeyStrokeOptions>
): UseOnKeyStrokeReturn;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createOnKeyStroke(
  keyOrHandler: KeyFilter | ((event: KeyboardEvent) => void),
  handlerOrOptions?: ((event: KeyboardEvent) => void) | DeepMaybeObservable<UseOnKeyStrokeOptions>,
  optionsArg?: DeepMaybeObservable<UseOnKeyStrokeOptions>
): UseOnKeyStrokeReturn {
  let key: KeyFilter;
  let handler: (event: KeyboardEvent) => void;
  let rawOptions: DeepMaybeObservable<UseOnKeyStrokeOptions> | undefined;

  if (
    typeof keyOrHandler === "function" &&
    (handlerOrOptions == null || typeof handlerOrOptions === "object")
  ) {
    // Overload: (handler, options?)
    key = true;
    handler = keyOrHandler as (event: KeyboardEvent) => void;
    rawOptions = handlerOrOptions as DeepMaybeObservable<UseOnKeyStrokeOptions> | undefined;
  } else {
    // Overload: (key, handler, options?)
    key = keyOrHandler as KeyFilter;
    handler = handlerOrOptions as (event: KeyboardEvent) => void;
    rawOptions = optionsArg;
  }

  const opts$ = observable(rawOptions);

  // Construction-time reads (mount-time-only: target, eventName, passive)
  const target = opts$.peek()?.target ?? defaultWindow;
  const eventName = opts$.peek()?.eventName ?? "keydown";
  const passive = opts$.peek()?.passive ?? false;

  // Stable predicate — created once from the initial key filter.
  const predicate = createKeyPredicate(key);

  const listener = (e: KeyboardEvent) => {
    if (e.repeat && opts$.peek()?.dedupe) return;
    if (predicate(e)) handler(e);
  };

  const stop = createEventListener(
    target as EventTarget | null | undefined,
    eventName,
    listener as (ev: Event) => void,
    { passive }
  );

  onUnmount(stop);

  return stop;
}

// ---------------------------------------------------------------------------
// Convenience functions
// ---------------------------------------------------------------------------

/**
 * Listen for `keydown` events with key filtering.
 */
export function createOnKeyDown(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options: Omit<UseOnKeyStrokeOptions, "eventName"> = {}
): UseOnKeyStrokeReturn {
  return createOnKeyStroke(key, handler, { ...options, eventName: "keydown" });
}

/**
 * Listen for `keypress` events with key filtering.
 */
export function createOnKeyPressed(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options: Omit<UseOnKeyStrokeOptions, "eventName"> = {}
): UseOnKeyStrokeReturn {
  return createOnKeyStroke(key, handler, { ...options, eventName: "keypress" });
}

/**
 * Listen for `keyup` events with key filtering.
 */
export function createOnKeyUp(
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void,
  options: Omit<UseOnKeyStrokeOptions, "eventName"> = {}
): UseOnKeyStrokeReturn {
  return createOnKeyStroke(key, handler, { ...options, eventName: "keyup" });
}
