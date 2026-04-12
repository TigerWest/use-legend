"use client";
import { useScope, toObs, type Fn, type DeepMaybeObservable } from "@usels/core";
import { createOnKeyStroke, type KeyFilter, type UseOnKeyStrokeOptions } from "./core";

export { createOnKeyStroke, createOnKeyDown, createOnKeyPressed, createOnKeyUp } from "./core";
export type {
  KeyPredicate,
  KeyFilter,
  KeyStrokeEventName,
  UseOnKeyStrokeOptions,
  UseOnKeyStrokeReturn,
} from "./core";

export type UseOnKeyStroke = typeof createOnKeyStroke;

export const useOnKeyStroke: UseOnKeyStroke = ((
  keyOrHandler: KeyFilter | ((event: KeyboardEvent) => void),
  handlerOrOptions?: ((event: KeyboardEvent) => void) | UseOnKeyStrokeOptions,
  optionsArg?: UseOnKeyStrokeOptions
): Fn => {
  // Normalize overloads before entering useScope
  let key: KeyFilter;
  let handler: (event: KeyboardEvent) => void;
  let options: UseOnKeyStrokeOptions;

  if (
    typeof keyOrHandler === "function" &&
    (handlerOrOptions == null || typeof handlerOrOptions === "object")
  ) {
    key = true;
    handler = keyOrHandler as (event: KeyboardEvent) => void;
    options = (handlerOrOptions as UseOnKeyStrokeOptions) ?? {};
  } else {
    key = keyOrHandler as KeyFilter;
    handler = handlerOrOptions as (event: KeyboardEvent) => void;
    options = optionsArg ?? {};
  }

  return useScope(
    (cbs, opts) => {
      const cbs$ = toObs(cbs, { handler: "function" });
      const opts$ = toObs(opts) as DeepMaybeObservable<UseOnKeyStrokeOptions>;
      return createOnKeyStroke(key, cbs$.handler as (e: KeyboardEvent) => void, opts$);
    },
    { handler },
    options
  );
}) as UseOnKeyStroke;

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
