import { type Observable, type ObservablePrimitive, type OpaqueObject } from "@legendapp/state";
import {
  observe,
  onUnmount,
  get,
  type Arrayable,
  type MaybeObservable,
  type ReadonlyObservable,
} from "@usels/core";
import { toArray } from "@usels/core/shared/utils";
import { normalizeTargets } from "@shared/normalizeTargets";
import { defaultWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneralEventListener<E = Event> {
  (evt: E): void;
}

/**
 * Returns true if the value looks like an event name argument (string or
 * array of strings), meaning no explicit target was provided.
 */
function isEventNameArg(v: unknown): boolean {
  if (typeof v === "string") return true;
  if (Array.isArray(v)) {
    const nonNull = v.filter((item) => item != null);
    return nonNull.length > 0 && nonNull.every((item) => typeof item === "string");
  }
  return false;
}

/**
 * Single source of truth for the (target, event, listener, options)
 * positional layout. Both `createEventListener` and the React wrapper
 * call this so there is no duplicated arg-shape detection.
 */
export interface ParsedEventListenerArgs {
  hasTarget: boolean;
  /** index of the listener parameter inside the original args array */
  listenerIdx: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw user args
  target: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw user args
  event: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw user args
  listener: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw user args
  options: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw user args
export function parseEventListenerArgs(args: any[]): ParsedEventListenerArgs {
  const hasTarget = !isEventNameArg(args[0]);
  return hasTarget
    ? {
        hasTarget,
        listenerIdx: 2,
        target: args[0],
        event: args[1],
        listener: args[2],
        options: args[3],
      }
    : {
        hasTarget,
        listenerIdx: 1,
        target: undefined,
        event: args[0],
        listener: args[1],
        options: args[2],
      };
}

// ---------------------------------------------------------------------------
// Overloads — mirror useEventListener so the hook can derive its type via
// `typeof createEventListener`.
// ---------------------------------------------------------------------------

/**
 * Framework-agnostic event listener registration. Must be called inside a
 * `useScope` factory — registration is deferred to `onMount` so that any
 * other reactive setup in the same scope (e.g. `useWhenever`) gets to run
 * first. Reactive `Ref$` / `Observable<EventTarget>` targets are tracked
 * via `legendObserve` and re-bound automatically when they change.
 *
 * Overload 1: Omitted target — defaults to `window`.
 */
export function createEventListener<E extends keyof WindowEventMap>(
  event: Arrayable<E>,
  listener: Arrayable<(ev: WindowEventMap[E]) => void>,
  options?: MaybeObservable<boolean | AddEventListenerOptions>
): () => void;

/**
 * Overload 2: Explicit `Window` target.
 */
export function createEventListener<E extends keyof WindowEventMap>(
  target: Window | Observable<OpaqueObject<Window> | null>,
  event: Arrayable<E>,
  listener: Arrayable<(ev: WindowEventMap[E]) => void>,
  options?: MaybeObservable<boolean | undefined | AddEventListenerOptions>
): () => void;

/**
 * Overload 3: Explicit or reactive `Document` target.
 */
export function createEventListener<E extends keyof DocumentEventMap>(
  target: Document | Observable<OpaqueObject<Document> | null>,
  event: Arrayable<E>,
  listener: Arrayable<(ev: DocumentEventMap[E]) => void>,
  options?: MaybeObservable<boolean | AddEventListenerOptions>
): () => void;

/**
 * Overload 4: `MaybeEventTarget` target — supports Ref$, Observable<OpaqueObject<Element>>,
 * Document, Window, or an array of those (Legend-State reactive).
 */
export function createEventListener<E extends keyof HTMLElementEventMap>(
  target: MaybeEventTarget | MaybeEventTarget[] | null | undefined,
  event: Arrayable<E>,
  listener: Arrayable<(ev: HTMLElementEventMap[E]) => void>,
  options?: MaybeObservable<boolean | AddEventListenerOptions>
): () => void;

/**
 * Overload 5: Observable<EventTarget> — reactive target (e.g.
 * Observable<MediaQueryList>, Ref$<HTMLElement>, etc.).
 */
export function createEventListener<EventType = Event>(
  target:
    | Observable<unknown>
    | ObservablePrimitive<unknown>
    | ReadonlyObservable<unknown>
    | null
    | undefined,
  event: Arrayable<string>,
  listener: Arrayable<GeneralEventListener<EventType>>,
  options?: MaybeObservable<boolean | AddEventListenerOptions>
): () => void;

/**
 * Overload 6: Combined `MaybeEventTarget | EventTarget` — handles union types where
 * the target may be either a reactive MaybeEventTarget or a raw EventTarget.
 */
export function createEventListener<EventType = Event>(
  target: MaybeEventTarget | EventTarget | null | undefined,
  event: Arrayable<string>,
  listener: Arrayable<GeneralEventListener<EventType>>,
  options?: MaybeObservable<boolean | AddEventListenerOptions>
): () => void;

/**
 * Overload 7: Generic `EventTarget` fallback.
 */
export function createEventListener<EventType = Event>(
  target: EventTarget | null | undefined,
  event: Arrayable<string>,
  listener: Arrayable<GeneralEventListener<EventType>>,
  options?: MaybeObservable<boolean | AddEventListenerOptions>
): () => void;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- implementation overload signature requires rest args
export function createEventListener(...args: any[]): () => void {
  const {
    hasTarget,
    target: rawTarget,
    event: rawEvent,
    listener: rawListener,
    options: rawOptions,
  } = parseEventListenerArgs(args);

  // Listeners captured at mount. The hook wrapper passes a single forwarder
  // that delegates to the latest closure via the scope props proxy, so per-render
  // freshness is handled there. Standalone callers pass a stable function or array.
  const listeners: Array<(ev: Event) => void> = toArray(rawListener);

  // Stable forwarder — one function reference per scope, registered once per
  // (target, event) pair regardless of how many listeners were passed.
  // Single-listener short-circuit: avoid an extra indirection layer for the
  // common case (hook path always sends 1, standalone single-fn callers too).
  const forwarder: (ev: Event) => void =
    listeners.length === 1
      ? listeners[0]
      : (ev: Event) => {
          listeners.forEach((l) => l(ev));
        };

  // Active removeEventListener thunks for the currently registered (target, event)
  // pairs. Cleared on teardown / re-registration.
  let cleanups: Array<() => void> = [];

  const teardown = () => {
    cleanups.forEach((fn) => fn());
    cleanups = [];
  };

  // Scope-aware `observe` — runs synchronously at scope.run() time and re-fires
  // whenever a tracked dep changes. The lifecycle is driven by the **target ref
  // itself**, not by component mount: when the ref/observable target resolves
  // to a non-null EventTarget, listeners are registered; when it goes back to
  // null, they are torn down. The `observe` callback's unsub is auto-registered
  // to the current scope, so it dies when the scope is disposed.
  observe(() => {
    // Teardown previous registrations before re-registering.
    teardown();

    // Resolve targets via `normalizeTargets` — it handles Ref$, Observable
    // targets, raw Window/Document/Element, arrays, and nulls uniformly.
    // Its internal `get(t)` runs inside this `observe()` callback, so reading
    // observable targets registers reactive dependencies here automatically.
    const targets: EventTarget[] = !hasTarget
      ? defaultWindow
        ? [defaultWindow]
        : []
      : (normalizeTargets(rawTarget as MaybeEventTarget | MaybeEventTarget[]) as EventTarget[]);

    // Ref isn't ready yet (or all items resolved to null) — wait for the next
    // re-fire when the ref is populated.
    if (!targets.length) return;

    const events = toArray(rawEvent);
    if (!events.length || !listeners.length) return;

    const resolvedOpts = get(rawOptions);
    const opts =
      typeof resolvedOpts === "object" && resolvedOpts !== null
        ? { ...resolvedOpts }
        : resolvedOpts;

    cleanups = targets.flatMap((el) =>
      events.map((event) => {
        el.addEventListener(event, forwarder, opts);
        return () => el.removeEventListener(event, forwarder, opts);
      })
    );
  });

  // The observe is auto-disposed by the scope, but addEventListener cleanups
  // need explicit teardown when the scope dies.
  onUnmount(teardown);

  return teardown;
}
