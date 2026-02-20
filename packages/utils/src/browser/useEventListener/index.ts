"use client";
import { isObservable } from "@legendapp/state";
import { useObserve } from "@legendapp/state/react";
import { useEffect, useRef } from "react";
import { isEl$, type MaybeElement } from "../../elements/useEl$";
import { normalizeTargets } from "../../shared/normalizeTargets";

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

type Arrayable<T> = T | T[];

function toArray<T>(v: Arrayable<T>): T[] {
  return Array.isArray(v) ? v : [v];
}

/**
 * Returns true if the value looks like an event name argument (string or
 * array of strings), meaning no explicit target was provided.
 */
function isEventNameArg(v: unknown): boolean {
  if (typeof v === "string") return true;
  if (Array.isArray(v)) {
    const nonNull = v.filter((item) => item != null);
    return (
      nonNull.length > 0 && nonNull.every((item) => typeof item === "string")
    );
  }
  return false;
}

/**
 * Returns true if the target argument contains at least one reactive element
 * (El$ or Observable<Element>) that requires useObserve tracking.
 */
function hasMaybeElementTarget(v: unknown): boolean {
  const items = Array.isArray(v) ? v : [v];
  return items
    .filter((i) => i != null)
    .some((i) => isEl$(i) || isObservable(i));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneralEventListener<E = Event> {
  (evt: E): void;
}

// ---------------------------------------------------------------------------
// Overloads
// ---------------------------------------------------------------------------

/**
 * Register using addEventListener on mounted, and removeEventListener
 * automatically on unmounted.
 *
 * Overload 1: Omitted target — defaults to `window`.
 */
export function useEventListener<E extends keyof WindowEventMap>(
  event: Arrayable<E>,
  listener: Arrayable<(ev: WindowEventMap[E]) => any>,
  options?: boolean | AddEventListenerOptions,
): () => void;

/**
 * Register using addEventListener on mounted, and removeEventListener
 * automatically on unmounted.
 *
 * Overload 2: Explicit `Window` target.
 */
export function useEventListener<E extends keyof WindowEventMap>(
  target: Window,
  event: Arrayable<E>,
  listener: Arrayable<(ev: WindowEventMap[E]) => any>,
  options?: boolean | AddEventListenerOptions,
): () => void;

/**
 * Register using addEventListener on mounted, and removeEventListener
 * automatically on unmounted.
 *
 * Overload 3: Explicit `Document` target.
 */
export function useEventListener<E extends keyof DocumentEventMap>(
  target: Document,
  event: Arrayable<E>,
  listener: Arrayable<(ev: DocumentEventMap[E]) => any>,
  options?: boolean | AddEventListenerOptions,
): () => void;

/**
 * Register using addEventListener on mounted, and removeEventListener
 * automatically on unmounted.
 *
 * Overload 4: `MaybeElement` target — supports El$, Observable<Element>,
 * plain HTMLElement, or an array of those (Legend-State reactive).
 */
export function useEventListener<E extends keyof HTMLElementEventMap>(
  target: MaybeElement | MaybeElement[] | null | undefined,
  event: Arrayable<E>,
  listener: Arrayable<(ev: HTMLElementEventMap[E]) => any>,
  options?: boolean | AddEventListenerOptions,
): () => void;

/**
 * Register using addEventListener on mounted, and removeEventListener
 * automatically on unmounted.
 *
 * Overload 5: Generic `EventTarget` fallback.
 */
export function useEventListener<EventType = Event>(
  target: EventTarget | null | undefined,
  event: Arrayable<string>,
  listener: Arrayable<GeneralEventListener<EventType>>,
  options?: boolean | AddEventListenerOptions,
): () => void;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function useEventListener(...args: any[]): () => void {
  // Detect whether first arg is an event name (no target) or a target.
  // Mirrors VueUse's firstParamTargets check.
  const hasTarget = !isEventNameArg(args[0]);

  const rawTarget: unknown = hasTarget ? args[0] : undefined;
  const rawEvent: Arrayable<string> = hasTarget ? args[1] : args[0];
  const rawListener: Arrayable<(...a: any[]) => any> = hasTarget
    ? args[2]
    : args[1];
  const rawOptions: boolean | AddEventListenerOptions | undefined = hasTarget
    ? args[3]
    : args[2];

  // Always keep the latest listeners in a ref so that the forwarder always
  // calls the current listeners, even after re-renders change the functions.
  const listenersRef = useRef(toArray(rawListener));
  listenersRef.current = toArray(rawListener);

  // Stable forwarder — one function reference per hook instance, created once.
  // Delegates to listenersRef.current so state-dependent listeners never go stale.
  // Mirrors useResizeObserver's `(...args) => callbackRef.current(...args)` pattern.
  const forwarder = useRef((ev: Event) => {
    listenersRef.current.forEach((l) => l(ev));
  });

  // Options ref prevents recreating listeners when only options change.
  // A clone is made inside setup() so the stored remove-fn stays consistent.
  const optionsRef = useRef(rawOptions);
  optionsRef.current = rawOptions;

  // Guards useObserve's initial synchronous run (before DOM is committed) from
  // calling setup(). Only useEffect triggers the first setup, ensuring elements
  // are available in the DOM before listeners are attached.
  const mountedRef = useRef(false);

  // Array of removeEventListener thunks for the currently active registrations.
  const cleanupsRef = useRef<Array<() => void>>([]);

  /**
   * Resolves the raw target argument to a flat EventTarget[].
   *
   * - No target: `window` (SSR-safe)
   * - null/undefined: [] (skip registration)
   * - El$ / Observable<Element>: unwrapped via normalizeTargets (registers
   *   reactive tracking when called inside useObserve)
   * - Window, Document, plain HTMLElement, or any other EventTarget: used as-is
   */
  const resolveTargets = (): EventTarget[] => {
    if (!hasTarget) {
      return typeof window !== "undefined" ? [window] : [];
    }
    if (rawTarget == null) return [];

    const items: unknown[] = Array.isArray(rawTarget) ? rawTarget : [rawTarget];
    return items.flatMap((item) => {
      if (item == null) return [];
      // Reactive element references — normalizeTargets calls .get() which
      // registers the observable dependency inside useObserve.
      if (isEl$(item) || isObservable(item)) {
        return normalizeTargets([item as MaybeElement]);
      }
      // Raw EventTarget (Window, Document, HTMLElement, etc.)
      return [item as EventTarget];
    });
  };

  const setup = () => {
    // Remove previously registered listeners before re-registering.
    cleanupsRef.current.forEach((fn) => fn());
    cleanupsRef.current = [];

    const targets = resolveTargets();
    const events = toArray(rawEvent);
    const listeners = listenersRef.current;

    if (!targets.length || !events.length || !listeners.length) return;

    // Clone options object to prevent mutation after registration.
    // Mirrors the VueUse implementation's `optionsClone` approach.
    const opts =
      typeof optionsRef.current === "object" && optionsRef.current !== null
        ? { ...optionsRef.current }
        : optionsRef.current;

    // Register the stable forwarder (not the raw listener) so that
    // removeEventListener can always use the same function reference,
    // and so that state-dependent listeners never go stale between setups.
    const fn = forwarder.current;
    cleanupsRef.current = targets.flatMap((el) =>
      events.map((event) => {
        el.addEventListener(event, fn, opts);
        return () => el.removeEventListener(event, fn, opts);
      }),
    );
  };

  // Initial setup after DOM is committed; cleanup on unmount.
  // useEffect is used directly (instead of useMount/useUnmount) because
  // Legend-State's useEffectOnce delays cleanup via queueMicrotask in test
  // environments, making synchronous post-unmount assertions unreliable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    mountedRef.current = true;
    setup();
    return () => {
      mountedRef.current = false;
      cleanupsRef.current.forEach((fn) => fn());
      cleanupsRef.current = [];
    };
  }, []);

  // Re-run setup whenever observable targets (El$ or Observable<Element>) change.
  // Reading normalizeTargets here registers observable dependencies so
  // useObserve re-fires when a tracked target value changes.
  // mountedRef guard prevents a redundant setup on the initial synchronous run.
  useObserve(() => {
    if (hasTarget && hasMaybeElementTarget(rawTarget)) {
      const items = (
        Array.isArray(rawTarget) ? rawTarget : [rawTarget]
      ) as unknown[];
      normalizeTargets(
        items.filter(
          (i) => i != null && (isEl$(i) || isObservable(i)),
        ) as MaybeElement[],
      );
    }
    if (mountedRef.current) setup();
  });

  // Return a manual cleanup function for imperative removal.
  return () => {
    cleanupsRef.current.forEach((fn) => fn());
    cleanupsRef.current = [];
  };
}
